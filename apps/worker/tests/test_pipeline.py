from __future__ import annotations

import time
from types import SimpleNamespace
from typing import Any

import pytest

from clipmax_worker import pipeline
from clipmax_worker.media import ProbeResult
from clipmax_worker.pipeline import (
    LeaseLostError,
    PermanentJobError,
    _fail_job,
    _keep_lease,
    _require_lease,
    _select_render_clips,
    _validate_probe,
)


class FakeStore:
    def __init__(self) -> None:
        self.deleted: list[str] = []

    def delete(self, key: str) -> None:
        self.deleted.append(key)


class FakeRest:
    def __init__(
        self,
        result: Any = True,
        *,
        clips: list[dict[str, Any]] | None = None,
    ) -> None:
        self.result = result
        self.clips = clips or []
        self.calls: list[tuple[str, dict[str, Any]]] = []

    def rpc(self, name: str, params: dict[str, Any]) -> Any:
        self.calls.append((name, params))
        return self.result

    def select(self, table: str, filters: list[tuple[str, str]]) -> list[dict[str, Any]]:
        return self.clips


def make_context(
    rest: FakeRest,
    *,
    lease_seconds: float = 60,
    store: FakeStore | None = None,
) -> Any:
    return SimpleNamespace(
        settings=SimpleNamespace(
            job_lease_seconds=lease_seconds,
            max_source_duration_seconds=900,
        ),
        rest=rest,
        store=store or FakeStore(),
        worker_id="worker-test",
    )


def test_keep_lease_renews_with_the_owning_worker(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(pipeline, "HEARTBEAT_MIN_INTERVAL_SECONDS", 0.01)
    rest = FakeRest()
    context = make_context(rest, lease_seconds=0.03)

    with _keep_lease(context, "job-1"):
        time.sleep(0.05)

    heartbeats = [call for call in rest.calls if call[0] == "heartbeat_job"]
    assert heartbeats
    assert heartbeats[0][1]["p_worker_id"] == "worker-test"
    assert heartbeats[0][1]["p_job_id"] == "job-1"


def test_require_lease_raises_when_the_job_was_reclaimed() -> None:
    rest = FakeRest(result=False)

    with pytest.raises(LeaseLostError):
        _require_lease(make_context(rest), "job-1", 50)


def test_fail_job_reports_ownership_and_permanence() -> None:
    rest = FakeRest(
        clips=[
            {
                "storage_path": "renders/partial/clip.mp4",
                "thumbnail_path": "renders/partial/thumb.jpg",
            }
        ]
    )
    store = FakeStore()

    _fail_job(
        make_context(rest, store=store),
        {"id": "job-1", "project_id": "project-1", "attempts": 1, "max_attempts": 3},
        "boom",
        permanent=True,
    )

    name, params = rest.calls[-1]
    assert name == "fail_job"
    assert params["p_worker_id"] == "worker-test"
    assert params["p_permanent"] is True
    assert store.deleted == ["renders/partial/clip.mp4", "renders/partial/thumb.jpg"]


def test_fail_job_keeps_objects_when_the_lease_was_lost() -> None:
    rest = FakeRest(
        result=False,
        clips=[{"storage_path": "renders/partial/clip.mp4", "thumbnail_path": None}],
    )
    store = FakeStore()

    _fail_job(
        make_context(rest, store=store),
        {"id": "job-1", "project_id": "project-1", "attempts": 3, "max_attempts": 3},
        "boom",
        permanent=False,
    )

    assert rest.calls[-1][0] == "fail_job"
    assert store.deleted == []


def test_select_render_clips_skips_already_rendered_clips() -> None:
    matching, pending = _select_render_clips(
        [
            {"id": "a", "render_status": "rendered"},
            {"id": "b", "render_status": "queued"},
        ],
        {"a", "b"},
    )

    assert len(matching) == 2
    assert [clip["id"] for clip in pending] == ["b"]


def test_select_render_clips_accepts_an_all_rendered_set() -> None:
    matching, pending = _select_render_clips(
        [{"id": "a", "render_status": "rendered"}],
        {"a"},
    )

    assert len(matching) == 1
    assert pending == []


def test_select_render_clips_rejects_missing_requested_clips() -> None:
    with pytest.raises(PermanentJobError):
        _select_render_clips([{"id": "a", "render_status": "draft"}], {"missing"})


def test_select_render_clips_rejects_an_empty_project() -> None:
    with pytest.raises(PermanentJobError):
        _select_render_clips([], None)


def test_validate_probe_rejects_zero_duration() -> None:
    context = make_context(FakeRest())
    result = ProbeResult(
        duration_seconds=0.0,
        size_bytes=1,
        width=1920,
        height=1080,
        has_audio=True,
    )

    with pytest.raises(PermanentJobError):
        _validate_probe(context, result)
