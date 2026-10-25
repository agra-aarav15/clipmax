from __future__ import annotations

import pytest
from pydantic import ValidationError

from clipmax_worker.config import Settings
from clipmax_worker.transcribe import transcription_provider_configured

BASE_ENV = {
    "SUPABASE_URL": "https://project.supabase.co",
    "SUPABASE_SERVICE_ROLE_KEY": "service-role-key",
    "R2_ACCOUNT_ID": "account-id",
    "R2_ACCESS_KEY_ID": "access-key",
    "R2_SECRET_ACCESS_KEY": "secret-key",
    "R2_BUCKET": "clipmax",
    "R2_ENDPOINT": "https://account.r2.cloudflarestorage.com",
    "OPENAI_API_KEY": "sk-test",
}


def set_base_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for key, value in BASE_ENV.items():
        monkeypatch.setenv(key, value)


def test_settings_load_defaults(monkeypatch: pytest.MonkeyPatch) -> None:
    set_base_env(monkeypatch)

    settings = Settings(_env_file=None)

    assert settings.whisper_provider == "openai"
    assert settings.llm_provider == "openai"
    assert settings.max_source_duration_seconds == 900
    assert settings.max_source_bytes == 524_288_000
    assert settings.render_width == 1080
    assert settings.render_height == 1920


def test_missing_credentials_fail_fast(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in BASE_ENV:
        monkeypatch.delenv(key, raising=False)

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_ai_keys_are_not_required_to_start(monkeypatch: pytest.MonkeyPatch) -> None:
    set_base_env(monkeypatch)
    monkeypatch.delenv("OPENAI_API_KEY")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("LLM_API_KEY", raising=False)

    settings = Settings(_env_file=None)

    assert settings.openai_api_key is None
    assert not transcription_provider_configured(settings)


def test_missing_openai_key_blocks_only_the_job(monkeypatch: pytest.MonkeyPatch) -> None:
    set_base_env(monkeypatch)
    monkeypatch.delenv("OPENAI_API_KEY")

    settings = Settings(_env_file=None)

    assert settings.whisper_provider == "openai"
    assert not transcription_provider_configured(settings)


def test_groq_without_key_is_unconfigured(monkeypatch: pytest.MonkeyPatch) -> None:
    set_base_env(monkeypatch)
    monkeypatch.setenv("WHISPER_PROVIDER", "groq")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)

    settings = Settings(_env_file=None)

    assert not transcription_provider_configured(settings)


def test_local_whisper_needs_no_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    set_base_env(monkeypatch)
    monkeypatch.setenv("WHISPER_PROVIDER", "local")
    monkeypatch.delenv("OPENAI_API_KEY")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)

    settings = Settings(_env_file=None)

    assert transcription_provider_configured(settings)


def test_r2_endpoint_is_derived_from_account_id(monkeypatch: pytest.MonkeyPatch) -> None:
    set_base_env(monkeypatch)
    monkeypatch.delenv("R2_ENDPOINT")

    settings = Settings(_env_file=None)

    assert settings.resolved_r2_endpoint == "https://account-id.r2.cloudflarestorage.com"


def test_r2_needs_an_endpoint_or_account_id(monkeypatch: pytest.MonkeyPatch) -> None:
    set_base_env(monkeypatch)
    monkeypatch.delenv("R2_ENDPOINT")
    monkeypatch.delenv("R2_ACCOUNT_ID")

    with pytest.raises(ValidationError, match="R2_ENDPOINT or R2_ACCOUNT_ID"):
        Settings(_env_file=None)


def test_crf_out_of_range_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    set_base_env(monkeypatch)
    monkeypatch.setenv("FFMPEG_CRF", "99")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)
