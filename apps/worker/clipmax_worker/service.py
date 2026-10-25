from __future__ import annotations

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from pydantic import BaseModel

from clipmax_worker import __version__
from clipmax_worker.logging import configure_logging
from clipmax_worker.runtime import WorkerRuntime


class WorkerHealth(BaseModel):
    started: bool
    configured: bool
    media_ready: bool
    media_error: str | None
    jobs_processed: int
    last_error: str | None


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    worker: WorkerHealth


def create_app() -> FastAPI:
    configure_logging(os.getenv("LOG_LEVEL", "INFO"))
    runtime = WorkerRuntime()

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        if os.getenv("WORKER_AUTOSTART", "1") != "0":
            await runtime.start()
        try:
            yield
        finally:
            await runtime.stop()

    app = FastAPI(
        title="ClipMax Worker",
        version=__version__,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        lifespan=lifespan,
    )

    @app.get("/healthz", response_model=HealthResponse)
    async def healthz() -> HealthResponse:
        worker = runtime.snapshot()
        return HealthResponse(
            status="ok",
            service="clipmax-worker",
            version=__version__,
            environment=os.getenv("ENVIRONMENT", "development"),
            worker=WorkerHealth(**worker),
        )

    return app


app = create_app()
