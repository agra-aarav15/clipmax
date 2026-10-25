"""The real worker pipeline: claim → source → probe → transcribe → highlights → render → R2.

The worker is intentionally boring: every external call is explicit, every failure is written back
to Postgres, and every output key is derived from the project and clip ids.
"""

from __future__ import annotations

import logging
import math
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast
from urllib.parse import urlparse

from clipmax_worker.config import Settings
from clipmax_worker.highlights import detect_highlights
from clipmax_worker.logging import job_id_var, project_id_var
from clipmax_worker.media import (
    ProbeResult,
    build_ass,
    extract_audio,
    make_thumbnail,
    probe,
    render_clip,
    words_for_clip,
    write_ass,
)
from clipmax_worker.r2 import ObjectStore
from clipmax_worker.supabase import SupabaseRest
from clipmax_worker.transcribe import (
    TranscriptionPermanentError,
    transcribe_audio,
    transcription_provider_configured,
)

logger = logging.getLogger(__name__)

SUPPORTED_SOURCE_HOSTS = frozenset(
    {
        "youtube.com",
        "youtu.be",
        "instagram.com",
        "tiktok.com",
        "vimeo.com",
        "x.com",
        "twitter.com",
        "facebook.com",
        "fb.watch",
        "linkedin.com",
        "twitch.tv",
    }
)

CONTENT_TYPE_BY_SUFFIX = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".mkv": "video/x-matroska",
}


class PermanentJobError(RuntimeError):
    """A failure that retries cannot fix (bad source, unsupported link, missing audio)."""


@dataclass
class WorkerContext:
    settings: Settings
    rest: SupabaseRest
    store: ObjectStore
    worker_id: str

    def claim(self) -> dict[str, Any] | None:
        rows = self.rest.rpc(
            "claim_next_job",
            {
                "p_worker_id": self.worker_id,
                "p_lease_seconds": self.settings.job_lease_seconds,
            },
        )
        if not isinstance(rows, list) or not rows:
            return None
        return cast(dict[str, Any], rows[0])

    def close(self) -> None:
        self.rest.close()


def build_context(settings: Settings) -> WorkerContext:
    rest = SupabaseRest(settings.supabase_url, settings.supabase_service_role_key)
    store = ObjectStore(
        endpoint=settings.resolved_r2_endpoint,
        access_key_id=settings.r2_access_key_id,
        secret_access_key=settings.r2_secret_access_key,
        bucket=settings.r2_bucket,
    )
    return WorkerContext(
        settings=settings,
        rest=rest,
        store=store,
        worker_id=settings.worker_id,
    )


def process_job(context: WorkerContext, job: dict[str, Any]) -> None:
    job_id = str(job.get("id") or "")
    project_id = str(job.get("project_id") or "")
    job_type = str(job.get("job_type") or "")
    if not job_id or not project_id:
        logger.error("claim returned a job without id/project_id: %s", job)
        return

    job_id_var.set(job_id)
    project_id_var.set(project_id)

    try:
        project = context.rest.select_one("projects", [("id", f"eq.{project_id}")])
        if project is None:
            raise PermanentJobError("Project no longer exists.")
        if job_type == "transcribe":
            _process_transcribe(context, job, project)
        elif job_type == "render_clip":
            _process_render(context, job, project)
        else:
            raise PermanentJobError(f"Unknown job type: {job_type}")
    except PermanentJobError as exc:
        logger.error("permanent job failure: %s", exc)
        _permanent_fail(context, job_id, project_id, str(exc))
    except Exception as exc:
        logger.exception("transient job failure")
        try:
            context.rest.rpc("fail_job", {"p_job_id": job_id, "p_error": str(exc)[:2000]})
        except Exception:
            logger.exception("could not mark job as failed")
    finally:
        job_id_var.set(None)
        project_id_var.set(None)


def _process_transcribe(
    context: WorkerContext,
    job: dict[str, Any],
    project: dict[str, Any],
) -> None:
    job_id = str(job["id"])
    project_id = str(project["id"])
    user_id = str(project["user_id"])

    if not transcription_provider_configured(context.settings):
        raise PermanentJobError(
            "Transcription is not configured. Add OPENAI_API_KEY or GROQ_API_KEY, "
            "or set WHISPER_PROVIDER=local and install the local-whisper extra."
        )

    with tempfile.TemporaryDirectory(
        dir=context.settings.temp_dir,
        prefix=f"clipmax-{project_id[:8]}-",
    ) as tmp:
        tmp_path = Path(tmp)
        source_path = _ensure_source(context, project, tmp_path)
        result = probe(
            source_path,
            ffprobe_binary=context.settings.ffprobe_binary,
        )
        _validate_probe(context, result)

        actual_credits = max(1, math.ceil(result.duration_seconds / 60))
        context.rest.rpc(
            "settle_project_credits",
            {"p_project_id": project_id, "p_actual_credits": actual_credits},
        )
        context.rest.update(
            "projects",
            [("id", f"eq.{project_id}")],
            {
                "status": "processing",
                "duration_seconds": round(result.duration_seconds, 3),
                "error_message": None,
            },
        )
        _update_job_progress(context, job_id, 15)

        if not result.has_audio:
            raise PermanentJobError("The source has no audio stream to transcribe.")

        audio_path = extract_audio(
            source_path,
            tmp_path / "audio.mp3",
            has_audio=result.has_audio,
            ffmpeg_binary=context.settings.ffmpeg_binary,
            timeout=context.settings.transcription_timeout_seconds,
        )
        _update_job_progress(context, job_id, 25)

        try:
            transcription = transcribe_audio(
                audio_path,
                context.settings,
                duration_seconds=result.duration_seconds,
            )
        except TranscriptionPermanentError as exc:
            raise PermanentJobError(str(exc)) from exc
        _update_job_progress(context, job_id, 55)

        context.rest.upsert(
            "transcripts",
            [
                {
                    "project_id": project_id,
                    "user_id": user_id,
                    "language": transcription.language,
                    "text": transcription.text,
                    "segments": transcription.segments,
                    "words": transcription.words,
                    "provider": transcription.provider,
                }
            ],
            on_conflict="project_id",
        )

        highlights = detect_highlights(
            transcription.segments,
            context.settings,
            duration_seconds=result.duration_seconds,
        )
        if not highlights:
            raise PermanentJobError("No usable highlights were found in the transcript.")
        _update_job_progress(context, job_id, 70)

        context.rest.delete(
            "clips",
            [("project_id", f"eq.{project_id}"), ("render_status", "eq.draft")],
        )
        clip_rows = [
            {
                "project_id": project_id,
                "user_id": user_id,
                "title": candidate.title,
                "hook_text": candidate.hook_text or None,
                "start_time": round(candidate.start, 3),
                "end_time": round(candidate.end, 3),
                "virality_score": candidate.virality_score,
                "reasoning": candidate.reasoning or None,
                "render_status": "draft",
                "render_version": 0,
                "caption_style": {
                    "preset": "beast_bold",
                    "font_size": 72,
                    "highlight_color": "#89CFF0",
                },
            }
            for candidate in highlights
        ]
        inserted = context.rest.insert("clips", clip_rows)
        if not inserted:
            raise RuntimeError("Clip insert returned no rows.")

        clip_ids = [str(row["id"]) for row in inserted]
        context.rest.rpc(
            "enqueue_job",
            {
                "p_project_id": project_id,
                "p_job_type": "render_clip",
                "p_payload": {"clip_ids": clip_ids},
            },
        )
        context.rest.update(
            "projects",
            [("id", f"eq.{project_id}")],
            {"status": "processing", "error_message": None},
        )
        _complete_job(context, job_id)


def _process_render(
    context: WorkerContext,
    job: dict[str, Any],
    project: dict[str, Any],
) -> None:
    job_id = str(job["id"])
    project_id = str(project["id"])
    raw_payload = job.get("payload")
    payload = raw_payload if isinstance(raw_payload, dict) else {}
    requested_ids = payload.get("clip_ids")
    requested = set(requested_ids) if isinstance(requested_ids, list) else None

    with tempfile.TemporaryDirectory(
        dir=context.settings.temp_dir,
        prefix=f"clipmax-render-{project_id[:8]}-",
    ) as tmp:
        tmp_path = Path(tmp)
        source_path = _ensure_source(context, project, tmp_path)
        probe_result = probe(
            source_path,
            ffprobe_binary=context.settings.ffprobe_binary,
        )
        _validate_probe(context, probe_result)

        transcript = context.rest.select_one(
            "transcripts",
            [("project_id", f"eq.{project_id}")],
        )
        if transcript is None:
            raise PermanentJobError("No transcript was found for this project.")
        raw_words = transcript.get("words")
        words = raw_words if isinstance(raw_words, list) else []
        if not words:
            raise PermanentJobError(
                "The transcript has no word-level timestamps, so captions cannot be burned in."
            )

        clips = context.rest.select(
            "clips",
            [("project_id", f"eq.{project_id}"), ("order", "start_time.asc")],
        )
        if requested:
            clips = [clip for clip in clips if str(clip.get("id")) in requested]
        clips = [clip for clip in clips if clip.get("render_status") != "rendered"]
        if not clips:
            raise PermanentJobError("No clips need rendering.")

        context.rest.update(
            "projects",
            [("id", f"eq.{project_id}")],
            {"status": "processing", "error_message": None},
        )

        for index, clip in enumerate(clips):
            _render_one(
                context,
                project=project,
                source_path=source_path,
                probe_result=probe_result,
                words=words,
                clip=clip,
                tmp_path=tmp_path,
            )
            progress = 25 + int(70 * (index + 1) / len(clips))
            _update_job_progress(context, job_id, progress)

        context.rest.update(
            "projects",
            [("id", f"eq.{project_id}")],
            {"status": "completed", "error_message": None},
        )
        _complete_job(context, job_id)
        logger.info("rendered %d clip(s) for project %s", len(clips), project_id)


def _render_one(
    context: WorkerContext,
    *,
    project: dict[str, Any],
    source_path: Path,
    probe_result: ProbeResult,
    words: list[dict[str, Any]],
    clip: dict[str, Any],
    tmp_path: Path,
) -> None:
    clip_id = str(clip["id"])
    project_id = str(project["id"])
    user_id = str(project["user_id"])
    start = _safe_float(clip.get("start_time"))
    end = min(_safe_float(clip.get("end_time")), probe_result.duration_seconds)
    if end <= start:
        raise PermanentJobError(f"Clip {clip_id} has invalid timestamps.")

    context.rest.update(
        "clips",
        [("id", f"eq.{clip_id}")],
        {"render_status": "rendering"},
    )

    caption_style = clip.get("caption_style")
    style = caption_style if isinstance(caption_style, dict) else {}
    clip_words = words_for_clip(words, start_seconds=start, end_seconds=end)
    ass_content = build_ass(
        clip_words,
        width=context.settings.render_width,
        height=context.settings.render_height,
        caption_style=style,
    )
    ass_path = write_ass(tmp_path / "captions.ass", ass_content)
    rendered = tmp_path / f"clip-{clip_id}.mp4"
    thumbnail = tmp_path / f"thumb-{clip_id}.jpg"

    render_clip(
        source_path,
        rendered,
        start_seconds=start,
        end_seconds=end,
        ass_path=ass_path,
        width=context.settings.render_width,
        height=context.settings.render_height,
        fps=context.settings.render_fps,
        preset=context.settings.ffmpeg_preset,
        crf=context.settings.ffmpeg_crf,
        has_audio=probe_result.has_audio,
        ffmpeg_binary=context.settings.ffmpeg_binary,
        timeout=context.settings.render_timeout_seconds,
    )
    make_thumbnail(
        source_path,
        thumbnail,
        at_seconds=min(probe_result.duration_seconds, start + min(1.5, (end - start) / 2)),
        ffmpeg_binary=context.settings.ffmpeg_binary,
    )

    version = int(_safe_float(clip.get("render_version"))) + 1
    video_key = f"renders/{user_id}/{project_id}/{clip_id}/clip-v{version}.mp4"
    thumb_key = f"renders/{user_id}/{project_id}/{clip_id}/thumb-v{version}.jpg"
    context.store.upload(rendered, video_key, content_type="video/mp4")
    context.store.upload(thumbnail, thumb_key, content_type="image/jpeg")

    context.rest.update(
        "clips",
        [("id", f"eq.{clip_id}")],
        {
            "render_status": "rendered",
            "render_version": version,
            "storage_path": video_key,
            "thumbnail_path": thumb_key,
        },
    )


def _ensure_source(
    context: WorkerContext,
    project: dict[str, Any],
    tmp_path: Path,
) -> Path:
    storage_path = project.get("storage_path")
    if isinstance(storage_path, str) and storage_path:
        suffix = Path(storage_path).suffix or ".mp4"
        destination = tmp_path / f"source{suffix}"
        context.store.download(storage_path, destination)
        return destination

    source_url = project.get("source_url")
    if project.get("source_type") != "public_url" or not isinstance(source_url, str):
        raise PermanentJobError("Project has neither an uploaded object nor a public source URL.")

    path = _download_public_source(context, source_url, tmp_path)
    suffix = path.suffix or ".mp4"
    key = f"sources/{project['user_id']}/{project['id']}/source{suffix}"
    context.store.upload(path, key, content_type=CONTENT_TYPE_BY_SUFFIX.get(suffix, "video/mp4"))
    context.rest.update(
        "projects",
        [("id", f"eq.{project['id']}")],
        {"storage_path": key, "original_filename": path.name},
    )
    return path


def _download_public_source(
    context: WorkerContext,
    url: str,
    tmp_path: Path,
) -> Path:
    _validate_public_url(url)
    try:
        import yt_dlp  # type: ignore[import-untyped]
    except ImportError as exc:
        raise PermanentJobError("yt-dlp is not installed in the worker environment.") from exc

    options: dict[str, Any] = {
        "format": "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b",
        "outtmpl": str(tmp_path / "%(id)s.%(ext)s"),
        "merge_output_format": "mp4",
        "noplaylist": True,
        "playlistend": 1,
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "restrictfilenames": True,
        "overwrites": True,
        "socket_timeout": 30,
        "retries": 2,
        "max_filesize": context.settings.max_source_bytes,
    }
    if context.settings.source_cookies_file:
        options["cookiefile"] = context.settings.source_cookies_file

    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(url, download=True)
            downloads = info.get("requested_downloads") if isinstance(info, dict) else None
            filepath: str | None = None
            if isinstance(downloads, list) and downloads:
                candidate = downloads[0].get("filepath")
                if isinstance(candidate, str):
                    filepath = candidate
            if not filepath and isinstance(info, dict):
                prepared = ydl.prepare_filename(info)
                filepath = prepared if isinstance(prepared, str) else None
    except Exception as exc:
        raise PermanentJobError(f"Could not download the public source: {exc}") from exc

    path = Path(filepath) if filepath else None
    if path is None or not path.exists():
        files = [item for item in tmp_path.iterdir() if item.is_file()]
        if not files:
            raise PermanentJobError("The public source downloaded no media.")
        path = max(files, key=lambda item: item.stat().st_size)

    if path.stat().st_size > context.settings.max_source_bytes:
        raise PermanentJobError("The public source is larger than the 500 MB limit.")
    return path


def _validate_public_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise PermanentJobError("The source link is not a public HTTP URL.")
    hostname = parsed.hostname.lower()
    if not any(
        hostname == allowed or hostname.endswith(f".{allowed}")
        for allowed in SUPPORTED_SOURCE_HOSTS
    ):
        raise PermanentJobError("The source host is not on the supported list.")


def _validate_probe(context: WorkerContext, result: ProbeResult) -> None:
    if result.duration_seconds > context.settings.max_source_duration_seconds:
        raise PermanentJobError(
            f"The source is {result.duration_seconds / 60:.1f} minutes; the limit is "
            f"{context.settings.max_source_duration_seconds // 60} minutes."
        )
    if result.size_bytes > context.settings.max_source_bytes:
        raise PermanentJobError("The source is larger than the 500 MB limit.")
    if result.width <= 0 or result.height <= 0:
        raise PermanentJobError("The source has no usable video dimensions.")


def _update_job_progress(context: WorkerContext, job_id: str, percent: int) -> None:
    context.rest.update(
        "processing_jobs",
        [("id", f"eq.{job_id}")],
        {"progress_percent": max(0, min(100, percent))},
    )


def _complete_job(context: WorkerContext, job_id: str) -> None:
    context.rest.update(
        "processing_jobs",
        [("id", f"eq.{job_id}")],
        {
            "status": "completed",
            "progress_percent": 100,
            "error_message": None,
            "locked_by": None,
            "locked_at": None,
            "lease_expires_at": None,
        },
    )


def _permanent_fail(
    context: WorkerContext,
    job_id: str,
    project_id: str,
    message: str,
) -> None:
    try:
        context.rest.update(
            "processing_jobs",
            [("id", f"eq.{job_id}")],
            {
                "status": "failed",
                "error_message": message[:2000],
                "locked_by": None,
                "locked_at": None,
                "lease_expires_at": None,
            },
        )
        context.rest.rpc("refund_project_credits", {"p_project_id": project_id})
        context.rest.update(
            "projects",
            [("id", f"eq.{project_id}")],
            {"status": "failed", "error_message": message[:2000]},
        )
    except Exception:
        logger.exception("could not persist permanent failure")


def _safe_float(value: Any) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0.0
    return number if math.isfinite(number) else 0.0
