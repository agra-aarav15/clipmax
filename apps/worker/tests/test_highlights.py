from __future__ import annotations

import itertools

from clipmax_worker.highlights import (
    MAX_CLIPS,
    _parse_candidates,
    fallback_highlights,
)


def test_parser_rejects_short_long_and_out_of_bounds_candidates() -> None:
    raw = [
        {"start": 0, "end": 10, "score": 90},
        {"start": 0, "end": 75, "score": 90},
        {"start": 120, "end": 150, "score": 90},
        {"start": 10, "end": 40, "score": 80},
    ]

    clips = _parse_candidates(raw, 100.0)

    assert [(clip.start, clip.end) for clip in clips] == [(10.0, 40.0)]


def test_parser_caps_candidates_at_the_product_limit() -> None:
    raw = [
        {"start": index * 25, "end": index * 25 + 20, "score": 90 - index}
        for index in range(MAX_CLIPS + 4)
    ]

    clips = _parse_candidates(raw, 200.0)

    assert len(clips) == MAX_CLIPS


def test_parser_prefers_the_higher_score_when_candidates_overlap() -> None:
    raw = [
        {"start": 0, "end": 30, "score": 40, "title": "low"},
        {"start": 5, "end": 35, "score": 95, "title": "high"},
    ]

    clips = _parse_candidates(raw, 100.0)

    assert [clip.title for clip in clips] == ["high"]


def test_parser_accepts_a_window_for_a_source_shorter_than_the_normal_minimum() -> None:
    clips = _parse_candidates([{"start": 0, "end": 12, "score": 70}], 12.0)

    assert len(clips) == 1


def test_parser_ignores_malformed_candidates() -> None:
    clips = _parse_candidates(
        [
            "not an object",
            {"start": "nope", "end": 30},
            {"start": 0, "end": None},
            {"start": 0, "end": 30, "score": "excellent"},
        ],
        100.0,
    )

    assert len(clips) == 1
    assert clips[0].virality_score == 60


def test_fallback_returns_at_most_three_non_overlapping_clips() -> None:
    segments = [
        {"start": index, "end": index + 5, "text": "a dense spoken passage " * 6}
        for index in range(0, 180, 5)
    ]

    clips = fallback_highlights(segments, duration_seconds=180.0)

    assert 1 <= len(clips) <= 3
    for previous, current in itertools.pairwise(clips):
        assert current.start >= previous.end


def test_fallback_returns_nothing_for_a_zero_duration_source() -> None:
    segments = [{"start": 0.0, "end": 1.0, "text": "hello"}]

    assert fallback_highlights(segments, duration_seconds=0.0) == []
