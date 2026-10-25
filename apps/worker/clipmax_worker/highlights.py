"""Highlight selection.

The LLM is asked for self-contained 20-60 second clips with timestamps. If it is unavailable or
returns something invalid, a deterministic density fallback still produces honest clips; it is
labelled as a fallback in the reasoning field.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from typing import Any

import httpx

from clipmax_worker.config import Settings

logger = logging.getLogger(__name__)


class HighlightError(RuntimeError):
    """A malformed or unusable highlight response."""


@dataclass(frozen=True)
class ClipCandidate:
    start: float
    end: float
    title: str
    hook_text: str
    reasoning: str
    virality_score: int


def detect_highlights(
    segments: list[dict[str, Any]],
    settings: Settings,
    *,
    duration_seconds: float,
) -> list[ClipCandidate]:
    if not segments:
        return []

    api_key = settings.llm_api_key or settings.openai_api_key or settings.groq_api_key
    if api_key:
        try:
            clips = _request_llm_clips(segments, settings, api_key, duration_seconds)
            if clips:
                return clips
        except Exception as exc:
            logger.warning("highlight LLM failed; using density fallback: %s", exc)

    return fallback_highlights(segments, duration_seconds=duration_seconds)


def _request_llm_clips(
    segments: list[dict[str, Any]],
    settings: Settings,
    api_key: str,
    duration_seconds: float,
) -> list[ClipCandidate]:
    if settings.llm_provider == "groq":
        base_url = "https://api.groq.com/openai/v1"
    else:
        base_url = "https://api.openai.com/v1"

    transcript = _format_transcript(segments)
    prompt = (
        "You select short-form clips from a long video transcript. "
        "Return JSON only, with this shape:\n"
        '{"clips":[{"start":12.5,"end":42.0,"title":"...","hook":"...","reasoning":"...",'
        '"score":86}]}\n'
        "Rules:\n"
        "- Pick 2 to 5 clips.\n"
        "- Each clip must be 20 to 60 seconds, self-contained, and make sense without the rest.\n"
        "- Start and end must be inside the transcript duration and must not overlap.\n"
        f"- The source is {duration_seconds:.1f} seconds long.\n"
        "- Prefer a strong claim, a surprising detail, a practical tip, or a clean story beat.\n"
        "- Do not fabricate quotes or facts. Titles and hooks may paraphrase the transcript.\n"
        "- Score is an integer from 0 to 100.\n\n"
        f"Transcript with timestamps:\n{transcript}"
    )

    response = httpx.post(
        f"{base_url}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": settings.llm_model,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a precise video editor. "
                        "You return valid JSON and never invent quotes."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        },
        timeout=httpx.Timeout(120.0),
    )

    if response.is_error:
        raise HighlightError(
            f"Highlight provider returned {response.status_code}: {response.text[:600]}"
        )

    payload = response.json()
    try:
        content = payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise HighlightError("Highlight provider response has no message content.") from exc

    data = _parse_json_object(str(content))
    raw_clips = data.get("clips") if isinstance(data, dict) else None
    if not isinstance(raw_clips, list):
        raise HighlightError("Highlight response has no clips array.")

    clips: list[ClipCandidate] = []
    for item in raw_clips:
        if not isinstance(item, dict):
            continue
        start = _safe_float(item.get("start"))
        end = _safe_float(item.get("end"))
        if start is None or end is None:
            continue
        start = max(0.0, min(start, duration_seconds))
        end = max(0.0, min(end, duration_seconds))
        if end - start < 12.0:
            continue
        title = str(item.get("title") or "").strip()[:120] or "Untitled clip"
        hook = str(item.get("hook") or "").strip()[:140]
        reasoning = str(item.get("reasoning") or "").strip()[:1200]
        score = _safe_int(item.get("score"), default=60)
        clips.append(
            ClipCandidate(
                start=start,
                end=end,
                title=title,
                hook_text=hook,
                reasoning=reasoning,
                virality_score=max(0, min(100, score)),
            )
        )

    return _non_overlapping(clips)


def _format_transcript(segments: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for segment in segments:
        start = _safe_float(segment.get("start")) or 0.0
        end = _safe_float(segment.get("end")) or start
        text = str(segment.get("text") or "").strip()
        if text:
            lines.append(f"[{start:.1f}-{end:.1f}] {text}")
    transcript = "\n".join(lines)
    # Keep prompts bounded. 18k chars is enough for a 15-minute talk and leaves room for output.
    return transcript[-18_000:]


def fallback_highlights(
    segments: list[dict[str, Any]],
    *,
    duration_seconds: float,
) -> list[ClipCandidate]:
    if duration_seconds <= 0 or not segments:
        return []

    if duration_seconds <= 25:
        start = 0.0
        end = duration_seconds
        text = _text_between(segments, start, end)
        return [
            ClipCandidate(
                start=start,
                end=end,
                title=_title_from_text(text, "The whole source"),
                hook_text=_hook_from_text(text),
                reasoning=(
                    "Heuristic fallback: the source is shorter than the minimum highlight window."
                ),
                virality_score=50,
            )
        ]

    window = min(30.0, duration_seconds)
    step = max(5.0, window / 3)
    candidates: list[tuple[float, float, float, str]] = []
    cursor = 0.0
    while cursor + 8.0 <= duration_seconds:
        end = min(duration_seconds, cursor + window)
        text = _text_between(segments, cursor, end)
        if text:
            candidates.append((cursor, end, float(len(text)), text))
        if end >= duration_seconds:
            break
        cursor += step

    candidates.sort(key=lambda item: item[2], reverse=True)
    selected: list[tuple[float, float, str]] = []
    for start, end, _score, text in candidates:
        if any(
            start < chosen_end and end > chosen_start for chosen_start, chosen_end, _ in selected
        ):
            continue
        selected.append((start, end, text))
        if len(selected) >= 3:
            break

    selected.sort(key=lambda item: item[0])
    return [
        ClipCandidate(
            start=start,
            end=end,
            title=_title_from_text(text, f"Clip {index + 1}"),
            hook_text=_hook_from_text(text),
            reasoning=(
                "Heuristic fallback: selected a dense speech window because the LLM was "
                "unavailable or returned invalid timestamps."
            ),
            virality_score=50,
        )
        for index, (start, end, text) in enumerate(selected)
    ]


def _non_overlapping(clips: list[ClipCandidate]) -> list[ClipCandidate]:
    result: list[ClipCandidate] = []
    for clip in sorted(clips, key=lambda item: item.start):
        if result and clip.start < result[-1].end:
            continue
        result.append(clip)
    return result


def _text_between(segments: list[dict[str, Any]], start: float, end: float) -> str:
    parts: list[str] = []
    for segment in segments:
        seg_start = _safe_float(segment.get("start")) or 0.0
        seg_end = _safe_float(segment.get("end")) or seg_start
        if seg_end <= start or seg_start >= end:
            continue
        text = str(segment.get("text") or "").strip()
        if text:
            parts.append(text)
    return " ".join(parts).strip()


def _title_from_text(text: str, fallback: str) -> str:
    words = text.split()
    if not words:
        return fallback
    return " ".join(words[:8]).strip(" .,!?:;")[:120] or fallback


def _hook_from_text(text: str) -> str:
    words = text.split()
    return " ".join(words[:14]).strip()[:140]


def _parse_json_object(value: str) -> dict[str, Any]:
    cleaned = value.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise HighlightError("Highlight response is not valid JSON.") from exc
    if not isinstance(data, dict):
        raise HighlightError("Highlight response must be a JSON object.")
    return data


def _safe_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _safe_int(value: Any, *, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default
