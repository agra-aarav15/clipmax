from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Worker runtime configuration.

    Credentials are validated when `get_settings()` is first called, not at import
    time, so the service can answer `/healthz` before its environment is complete.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: Literal["development", "staging", "production", "test"] = "development"
    log_level: str = "INFO"
    worker_id: str = "local"
    worker_concurrency: int = Field(default=1, ge=1, le=32)
    worker_autostart: bool = True
    worker_poll_seconds: float = Field(default=5.0, ge=1.0, le=60.0)
    job_budget_seconds: int = Field(default=3000, ge=60)
    job_lease_seconds: int = Field(default=1800, ge=60)
    test_mode: bool = False

    # Native tools and temp storage
    ffmpeg_binary: str = "ffmpeg"
    ffprobe_binary: str = "ffprobe"
    temp_dir: str | None = None
    source_cookies_file: str | None = None
    transcription_timeout_seconds: int = Field(default=900, ge=60)
    render_timeout_seconds: int = Field(default=900, ge=60)

    # Supabase (service role — worker bypasses RLS by design)
    supabase_url: str = Field(min_length=1)
    supabase_service_role_key: str = Field(min_length=1)

    # Cloudflare R2 (S3-compatible). Either an explicit endpoint or the account id is enough;
    # the endpoint is derived from the account id when it is not set.
    r2_account_id: str | None = None
    r2_access_key_id: str = Field(min_length=1)
    r2_secret_access_key: str = Field(min_length=1)
    r2_bucket: str = Field(min_length=1)
    r2_endpoint: str | None = None

    # Transcription
    whisper_provider: Literal["openai", "groq", "local"] = "openai"
    whisper_model: str = "whisper-1"
    openai_api_key: str | None = None
    groq_api_key: str | None = None

    # Highlight reasoning
    llm_provider: Literal["openai", "groq"] = "openai"
    llm_model: str = "gpt-4o-mini"
    llm_api_key: str | None = None

    # Source limits — mirrored in packages/shared/src/credits.ts
    max_source_duration_seconds: int = Field(default=900, ge=1)
    max_source_bytes: int = Field(default=524_288_000, ge=1)

    # Render defaults
    ffmpeg_preset: str = "veryfast"
    ffmpeg_crf: int = Field(default=20, ge=0, le=51)
    render_width: int = Field(default=1080, ge=1)
    render_height: int = Field(default=1920, ge=1)
    render_fps: int = Field(default=30, ge=1, le=120)

    @model_validator(mode="after")
    def _validate_storage(self) -> Settings:
        endpoint = (self.r2_endpoint or "").strip()
        account = (self.r2_account_id or "").strip()
        if not endpoint and not account:
            raise ValueError("R2_ENDPOINT or R2_ACCOUNT_ID is required")
        return self

    @property
    def resolved_r2_endpoint(self) -> str:
        """Use R2_ENDPOINT when present, otherwise the canonical account endpoint."""
        endpoint = (self.r2_endpoint or "").strip()
        if endpoint:
            return endpoint.rstrip("/")
        return f"https://{(self.r2_account_id or '').strip()}.r2.cloudflarestorage.com"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
