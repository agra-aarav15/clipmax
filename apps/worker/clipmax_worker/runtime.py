"""Async loop around the synchronous worker pipeline."""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any

from clipmax_worker.config import get_settings
from clipmax_worker.media import verify_tools
from clipmax_worker.pipeline import WorkerContext, build_context, process_job

logger = logging.getLogger(__name__)


class WorkerRuntime:
    """Owns the claim loop and keeps the health endpoint truthful.

    The pipeline is synchronous because boto3/ffmpeg are blocking. Each job runs in a worker thread
    so the FastAPI event loop can still answer `/healthz`.
    """

    def __init__(self) -> None:
        self._task: asyncio.Task[None] | None = None
        self._context: WorkerContext | None = None
        self._jobs_processed = 0
        self._last_error: str | None = None
        self._media_ready: bool | None = None
        self._media_error: str | None = None
        self._started = False

    async def start(self) -> None:
        if self._task is None:
            self._task = asyncio.create_task(self._run(), name="clipmax-worker-loop")

    async def stop(self) -> None:
        if self._task is None:
            return
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        finally:
            self._task = None
            if self._context is not None:
                self._context.close()
                self._context = None

    def snapshot(self) -> dict[str, Any]:
        configured = self._context is not None
        return {
            "started": self._started,
            "configured": configured,
            "media_ready": bool(self._media_ready),
            "media_error": self._media_error,
            "jobs_processed": self._jobs_processed,
            "last_error": self._last_error,
        }

    def _check_media(self) -> None:
        try:
            verify_tools(
                ffmpeg_binary=os.getenv("FFMPEG_BINARY", "ffmpeg"),
                ffprobe_binary=os.getenv("FFPROBE_BINARY", "ffprobe"),
            )
        except Exception as exc:
            self._media_ready = False
            self._media_error = str(exc)[:500]
            logger.error("media tools are not ready: %s", self._media_error)
            return

        self._media_ready = True
        self._media_error = None
        logger.info("media tools ready (ffmpeg, ffprobe, libass)")

    async def _run(self) -> None:
        self._started = True
        while True:
            try:
                if not self._media_ready:
                    await asyncio.to_thread(self._check_media)
                    if not self._media_ready:
                        # Stay alive and keep reporting the failure instead of claiming jobs that
                        # would fail every time and refund in a loop.
                        await asyncio.sleep(30)
                        continue

                if self._context is None:
                    self._context = build_context(get_settings())
                job = await asyncio.to_thread(self._context.claim)
                if job is None:
                    await asyncio.sleep(self._context.settings.worker_poll_seconds)
                    continue

                await asyncio.to_thread(process_job, self._context, job)
                self._jobs_processed += 1
                self._last_error = None
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                self._last_error = str(exc)[:500]
                logger.exception("worker loop error; retrying")
                await asyncio.sleep(10)
