from __future__ import annotations

from fastapi.testclient import TestClient

from clipmax_worker.service import app


def test_healthz_reports_version() -> None:
    client = TestClient(app)

    response = client.get("/healthz")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "clipmax-worker"
    assert body["version"] == "0.1.0"
    assert body["worker"]["media_ready"] in (True, False)
    assert "media_error" in body["worker"]


def test_healthz_does_not_require_credentials(monkeypatch) -> None:
    for key in (
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET",
        "R2_ENDPOINT",
    ):
        monkeypatch.delenv(key, raising=False)

    client = TestClient(app)
    assert client.get("/healthz").status_code == 200
