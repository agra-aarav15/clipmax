"""FFmpeg/ffprobe primitives and ASS caption generation.

All media stays local for the duration of a job; only R2 keys and derived metadata are persisted.
"""

from __future__ import annotations

import json
import math
import os
import subprocess
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class MediaError(RuntimeError):
    """A missing binary, bad media, or a non-zero FFmpeg exit."""


@dataclass(frozen=True)
class ProbeResult:
    duration_seconds: float
    size_bytes: int
    width: int
    height: int
    has_audio: bool


@dataclass(frozen=True)
class CaptionWord:
    start: float
    end: float
    text: str


def _run(args: Sequence[str], *, timeout: int, cwd: Path | None = None) -> str:
    # CREATE_NO_WINDOW exists only on Windows; getattr keeps the module importable
    # and type-checkable on Linux CI while still hiding console windows in dev.
    creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0) if os.name == "nt" else 0
    try:
        completed = subprocess.run(
            list(args),
            cwd=str(cwd) if cwd else None,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
            check=False,
            creationflags=creationflags,
        )
    except FileNotFoundError as exc:
        raise MediaError(f"{args[0]} is not installed or is not on PATH.") from exc
    except subprocess.TimeoutExpired as exc:
        raise MediaError(f"{args[0]} timed out after {timeout}s.") from exc

    if completed.returncode != 0:
        detail = (completed.stderr or completed.stdout or "unknown error").strip()
        raise MediaError(f"{args[0]} exited {completed.returncode}: {detail[-1400:]}")
    return completed.stdout


def verify_tools(
    *,
    ffmpeg_binary: str = "ffmpeg",
    ffprobe_binary: str = "ffprobe",
    timeout: int = 30,
) -> None:
    """Fail with an actionable message when FFmpeg, ffprobe, or libass is missing."""
    _run([ffmpeg_binary, "-version"], timeout=timeout)
    _run([ffprobe_binary, "-version"], timeout=timeout)
    filters = _run([ffmpeg_binary, "-hide_banner", "-filters"], timeout=timeout)

    for line in filters.splitlines():
        parts = line.split()
        if len(parts) >= 2 and parts[1] == "ass":
            return

    raise MediaError(
        "The system FFmpeg has no 'ass' filter (libass), so captions cannot be burned in."
    )


def probe(path: Path, *, ffprobe_binary: str = "ffprobe", timeout: int = 120) -> ProbeResult:
    output = _run(
        [
            ffprobe_binary,
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(path),
        ],
        timeout=timeout,
    )
    try:
        payload = json.loads(output)
    except json.JSONDecodeError as exc:
        raise MediaError("ffprobe returned invalid JSON.") from exc

    streams = payload.get("streams") or []
    video = next((stream for stream in streams if stream.get("codec_type") == "video"), None)
    if video is None:
        raise MediaError("The source has no video stream.")

    format_info = payload.get("format") or {}
    duration = _float(format_info.get("duration"))
    if duration <= 0:
        duration = _float(video.get("duration"))
    if duration <= 0 or not math.isfinite(duration):
        raise MediaError("Could not determine the source duration.")

    size_bytes = int(_float(format_info.get("size")) or path.stat().st_size)
    width = int(video.get("width") or 0)
    height = int(video.get("height") or 0)
    has_audio = any(stream.get("codec_type") == "audio" for stream in streams)

    return ProbeResult(
        duration_seconds=duration,
        size_bytes=size_bytes,
        width=width,
        height=height,
        has_audio=has_audio,
    )


def _float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def extract_audio(
    source: Path,
    destination: Path,
    *,
    has_audio: bool,
    ffmpeg_binary: str = "ffmpeg",
    timeout: int = 600,
) -> Path:
    if not has_audio:
        raise MediaError("The source has no audio stream to transcribe.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    _run(
        [
            ffmpeg_binary,
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(source),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-b:a",
            "64k",
            "-f",
            "mp3",
            str(destination),
        ],
        timeout=timeout,
    )
    if not destination.exists() or destination.stat().st_size == 0:
        raise MediaError("Audio extraction produced an empty file.")
    return destination


def render_clip(
    source: Path,
    output: Path,
    *,
    start_seconds: float,
    end_seconds: float,
    ass_path: Path,
    width: int,
    height: int,
    fps: int,
    preset: str,
    crf: int,
    has_audio: bool,
    ffmpeg_binary: str = "ffmpeg",
    timeout: int = 900,
) -> Path:
    duration = end_seconds - start_seconds
    if duration <= 0:
        raise MediaError("Clip end must be after clip start.")

    output.parent.mkdir(parents=True, exist_ok=True)
    ass_path = ass_path.resolve()
    filter_graph = (
        f"scale={width}:{height}:force_original_aspect_ratio=increase,"
        f"crop={width}:{height},ass={ass_path.name}"
    )

    args = [
        ffmpeg_binary,
        "-y",
        "-loglevel",
        "error",
        "-ss",
        f"{start_seconds:.3f}",
        "-i",
        str(source.resolve()),
        "-t",
        f"{duration:.3f}",
        "-vf",
        filter_graph,
        "-r",
        str(fps),
        "-c:v",
        "libx264",
        "-preset",
        preset,
        "-crf",
        str(crf),
        "-pix_fmt",
        "yuv420p",
    ]
    if has_audio:
        args.extend(["-c:a", "aac", "-b:a", "128k"])
    else:
        args.append("-an")
    args.extend(["-movflags", "+faststart", str(output.resolve())])

    # Run from the ASS directory so the filter never has to parse a Windows path colon.
    _run(args, timeout=timeout, cwd=ass_path.parent)

    if not output.exists() or output.stat().st_size == 0:
        raise MediaError("FFmpeg produced an empty clip.")
    return output


def make_thumbnail(
    source: Path,
    output: Path,
    *,
    at_seconds: float,
    ffmpeg_binary: str = "ffmpeg",
    timeout: int = 120,
) -> Path:
    output.parent.mkdir(parents=True, exist_ok=True)
    _run(
        [
            ffmpeg_binary,
            "-y",
            "-loglevel",
            "error",
            "-ss",
            f"{at_seconds:.3f}",
            "-i",
            str(source.resolve()),
            "-frames:v",
            "1",
            "-vf",
            "scale=540:960:force_original_aspect_ratio=increase,crop=540:960",
            "-q:v",
            "2",
            str(output.resolve()),
        ],
        timeout=timeout,
    )
    if not output.exists() or output.stat().st_size == 0:
        raise MediaError("Thumbnail generation produced an empty file.")
    return output


def ass_time(seconds: float) -> str:
    total_centiseconds = max(0, round(seconds * 100))
    hours, remainder = divmod(total_centiseconds, 360_000)
    minutes, remainder = divmod(remainder, 6_000)
    whole_seconds, centiseconds = divmod(remainder, 100)
    return f"{hours}:{minutes:02d}:{whole_seconds:02d}.{centiseconds:02d}"


def ass_color(hex_color: str) -> str:
    value = hex_color.lstrip("#")
    if len(value) != 6:
        return "F0CF89"
    try:
        red, green, blue = (int(value[index : index + 2], 16) for index in (0, 2, 4))
    except ValueError:
        return "F0CF89"
    return f"{blue:02X}{green:02X}{red:02X}"


def _escape_ass(text: str) -> str:
    return text.replace("\\", "/").replace("{", "(").replace("}", ")").replace("\n", " ").strip()


def _caption_words(words: Iterable[dict[str, Any]]) -> list[CaptionWord]:
    result: list[CaptionWord] = []
    for word in words:
        text = _escape_ass(str(word.get("word") or word.get("text") or ""))
        if not text:
            continue
        start = _float(word.get("start"))
        end = _float(word.get("end"))
        if end <= start:
            end = start + 0.12
        result.append(CaptionWord(start=start, end=end, text=text))
    result.sort(key=lambda item: item.start)
    return result


def group_words(
    words: Iterable[dict[str, Any]],
    *,
    max_words: int = 2,
    max_chars: int = 26,
    max_gap_seconds: float = 0.45,
) -> list[list[CaptionWord]]:
    groups: list[list[CaptionWord]] = []
    current: list[CaptionWord] = []
    for word in _caption_words(words):
        if not current:
            current = [word]
            continue

        previous = current[-1]
        current_chars = sum(len(item.text) for item in current) + len(current) - 1
        if (
            len(current) >= max_words
            or current_chars + 1 + len(word.text) > max_chars
            or word.start - previous.end > max_gap_seconds
        ):
            groups.append(current)
            current = [word]
        else:
            current.append(word)

    if current:
        groups.append(current)
    return groups


def words_for_clip(
    words: Iterable[dict[str, Any]],
    *,
    start_seconds: float,
    end_seconds: float,
) -> list[dict[str, Any]]:
    duration = max(0.0, end_seconds - start_seconds)
    result: list[dict[str, Any]] = []
    for word in words:
        word_start = _float(word.get("start"))
        word_end = _float(word.get("end"))
        if word_end <= start_seconds or word_start >= end_seconds:
            continue
        result.append(
            {
                "word": str(word.get("word") or word.get("text") or ""),
                "start": max(0.0, word_start - start_seconds),
                "end": min(duration, max(0.0, word_end - start_seconds)),
            }
        )
    return result


def build_ass(
    words: Iterable[dict[str, Any]],
    *,
    width: int,
    height: int,
    caption_style: dict[str, Any] | None = None,
) -> str:
    style = caption_style or {}
    font_size = int(_float(style.get("font_size")) or 72)
    highlight = ass_color(str(style.get("highlight_color") or "#9BE7FF"))
    groups = group_words(words)

    style_format = (
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, "
        "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, "
        "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding"
    )
    style_line = (
        f"Style: ClipMax,Arial,{font_size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,"
        "-1,0,0,0,100,100,0,0,1,5,0,2,80,80,300,1"
    )
    header = "\n".join(
        [
            "[Script Info]",
            "ScriptType: v4.00+",
            f"PlayResX: {width}",
            f"PlayResY: {height}",
            "WrapStyle: 0",
            "ScaledBorderAndShadow: yes",
            "YCbCr Matrix: TV.709",
            "",
            "[V4+ Styles]",
            style_format,
            style_line,
            "",
            "[Events]",
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
            "",
        ]
    )

    lines: list[str] = []
    for group in groups:
        group_start = group[0].start
        group_end = group[-1].end
        for index, active in enumerate(group):
            start = group_start if index == 0 else active.start
            end = group_end if index == len(group) - 1 else group[index + 1].start
            if end <= start:
                continue

            parts: list[str] = []
            for word_index, word in enumerate(group):
                text = word.text.upper()
                if word_index == index:
                    parts.append(f"{{\\c&H{highlight}&}}{text}{{\\c&HFFFFFF&}}")
                else:
                    parts.append(text)

            lines.append(
                f"Dialogue: 0,{ass_time(start)},{ass_time(end)},ClipMax,,0,0,0,,{' '.join(parts)}"
            )

    return header + "\n".join(lines) + ("\n" if lines else "")


def write_ass(path: Path, content: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return path
