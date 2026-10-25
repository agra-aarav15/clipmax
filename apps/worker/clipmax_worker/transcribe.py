"""Transcription providers.

OpenAI and Groq are used through their compatible audio endpoints. Local faster-whisper is an
optional extra (`uv sync --extra local-whisper`) for offline development.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

from clipmax_worker.config import Settings


class TranscriptionError(RuntimeError):
    """Provider failure or an unusable transcript response. Retrying may help."""


class TranscriptionPermanentError(TranscriptionError):
    """A failure retries cannot fix: missing key, bad request, missing local model."""


@dataclass(frozen=True)
class TranscriptionResult:
    text: str
    language: str | None
    segments: list[dict[str, Any]]
    words: list[dict[str, Any]]
    provider: str


def transcription_provider_configured(settings: Settings) -> bool:
    """True when the selected provider has what it needs to start a job."""
    if settings.whisper_provider == "local":
        return True
    if settings.whisper_provider == "groq":
        return bool(settings.groq_api_key)
    return bool(settings.openai_api_key)


def transcribe_audio(
    audio_path: Path,
    settings: Settings,
    *,
    duration_seconds: float,
) -> TranscriptionResult:
    if settings.whisper_provider == "local":
        return _transcribe_local(audio_path, settings, duration_seconds=duration_seconds)
    return _transcribe_remote(audio_path, settings, duration_seconds=duration_seconds)


def _transcribe_remote(
    audio_path: Path,
    settings: Settings,
    *,
    duration_seconds: float,
) -> TranscriptionResult:
    if settings.whisper_provider == "groq":
        base_url = "https://api.groq.com/openai/v1"
        api_key = settings.groq_api_key
        model = (
            "whisper-large-v3-turbo"
            if settings.whisper_model == "whisper-1"
            else settings.whisper_model
        )
    else:
        base_url = "https://api.openai.com/v1"
        api_key = settings.openai_api_key
        model = settings.whisper_model

    if not api_key:
        raise TranscriptionPermanentError(
            f"Transcription is not configured: no API key for {settings.whisper_provider}."
        )

    data: dict[str, str] = {
        "model": model,
        "response_format": "verbose_json",
        "timestamp_granularities[]": "word",
    }

    try:
        with audio_path.open("rb") as audio_file:
            response = httpx.post(
                f"{base_url}/audio/transcriptions",
                headers={"Authorization": f"Bearer {api_key}"},
                data=data,
                files={"file": (audio_path.name, audio_file, "audio/mpeg")},
                timeout=httpx.Timeout(settings.transcription_timeout_seconds),
            )
    except httpx.HTTPError as exc:
        raise TranscriptionError(f"Transcription request failed: {exc}") from exc

    if response.is_error:
        message = f"Transcription provider returned {response.status_code}: {response.text[:600]}"
        if response.status_code in {400, 401, 402, 403, 404, 413, 415, 422}:
            raise TranscriptionPermanentError(message)
        raise TranscriptionError(message)

    try:
        payload = response.json()
    except ValueError as exc:
        raise TranscriptionError("Transcription provider returned invalid JSON.") from exc

    text = str(payload.get("text") or "").strip()
    if not text:
        raise TranscriptionPermanentError("Transcription provider returned no text.")

    segments = _coerce_segments(payload.get("segments"))
    words = _coerce_words(payload.get("words"))
    if not segments:
        segments = [{"start": 0.0, "end": max(duration_seconds, 0.1), "text": text}]
    if not words:
        words = _words_from_segments(segments)

    return TranscriptionResult(
        text=text,
        language=payload.get("language"),
        segments=segments,
        words=words,
        provider=f"{settings.whisper_provider}:{model}",
    )


def _transcribe_local(
    audio_path: Path,
    settings: Settings,
    *,
    duration_seconds: float,
) -> TranscriptionResult:
    try:
        from faster_whisper import WhisperModel  # type: ignore[import-not-found]
    except ImportError as exc:
        raise TranscriptionPermanentError(
            "Local Whisper is not installed. Run `uv sync --extra local-whisper`."
        ) from exc

    model_name = "base.en" if settings.whisper_model == "whisper-1" else settings.whisper_model
    try:
        model = WhisperModel(model_name, device="cpu", compute_type="int8")
        iterator, info = model.transcribe(
            str(audio_path),
            word_timestamps=True,
            vad_filter=True,
            beam_size=5,
        )
        raw_segments = list(iterator)
    except Exception as exc:
        raise TranscriptionError(f"Local Whisper failed: {exc}") from exc

    segments: list[dict[str, Any]] = []
    words: list[dict[str, Any]] = []
    for segment in raw_segments:
        text = str(getattr(segment, "text", "") or "").strip()
        start = float(getattr(segment, "start", 0.0) or 0.0)
        end = float(getattr(segment, "end", start) or start)
        if not text:
            continue
        segments.append({"start": start, "end": end, "text": text})
        for word in getattr(segment, "words", None) or []:
            token = str(getattr(word, "word", "") or "").strip()
            if not token:
                continue
            words.append(
                {
                    "word": token,
                    "start": float(getattr(word, "start", start) or start),
                    "end": float(getattr(word, "end", end) or end),
                }
            )

    full_text = " ".join(segment["text"] for segment in segments).strip()
    if not full_text:
        raise TranscriptionPermanentError("Local Whisper returned no text.")
    if not segments:
        segments = [{"start": 0.0, "end": max(duration_seconds, 0.1), "text": full_text}]
    if not words:
        words = _words_from_segments(segments)

    language = getattr(info, "language", None)
    return TranscriptionResult(
        text=full_text,
        language=str(language) if language else None,
        segments=segments,
        words=words,
        provider=f"local:{model_name}",
    )


def _coerce_segments(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    result: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        text = str(item.get("text") or "").strip()
        if not text:
            continue
        start = _safe_float(item.get("start"))
        end = max(start, _safe_float(item.get("end")))
        result.append({"start": start, "end": end, "text": text})
    result.sort(key=lambda segment: segment["start"])
    return result


def _coerce_words(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    result: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        text = str(item.get("word") or item.get("text") or "").strip()
        if not text:
            continue
        start = _safe_float(item.get("start"))
        end = max(start + 0.08, _safe_float(item.get("end")))
        result.append({"word": text, "start": start, "end": end})
    result.sort(key=lambda word: word["start"])
    return result


def _words_from_segments(segments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Approximate word timing when a provider omits word-level timestamps.

    This is deliberately labelled as a fallback by using proportional timing. It is better than
    dropping captions entirely, and it never invents words.
    """

    words: list[dict[str, Any]] = []
    for segment in segments:
        tokens = re.findall(r"\S+", str(segment.get("text") or ""))
        if not tokens:
            continue
        start = _safe_float(segment.get("start"))
        end = max(start + 0.1, _safe_float(segment.get("end")))
        weights = [len(token) + 1 for token in tokens]
        total = sum(weights)
        cursor = start
        for token, weight in zip(tokens, weights, strict=True):
            share = (end - start) * (weight / total)
            word_end = min(end, cursor + max(0.08, share))
            words.append({"word": token, "start": cursor, "end": word_end})
            cursor = word_end
    return words


def _safe_float(value: Any) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0.0
    return number if math.isfinite(number) and number >= 0 else 0.0
