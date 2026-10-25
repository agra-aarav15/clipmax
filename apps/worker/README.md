# ClipMax Worker

Python 3.12 worker for the ClipMax video pipeline. It runs as a native process in a `uv` virtual
environment and calls the system FFmpeg binary directly.

The worker uses the host's FFmpeg and a local `.venv`; no local object-store emulator is involved.

## Status

The full pipeline is implemented: claim, source download, ffprobe, audio extraction,
transcription, highlight selection, 9:16 render with burned ASS captions, R2 publish, and database
updates. `/healthz` reports whether FFmpeg, ffprobe, and the libass `ass` filter are actually ready;
the worker does not claim jobs while they are missing.

Missing AI credentials do not stop the process. A job that cannot transcribe fails permanently with
a specific message and refunds its credit reservation. Highlights fall back to a deterministic
heuristic when no LLM key is configured, and the reasoning field says so.

## Prerequisites

- Python 3.12
- `uv` 0.13+
- FFmpeg 7+ on `PATH`, built with libass

On Windows:

```powershell
winget install Gyan.FFmpeg
ffmpeg -version
ffmpeg -filters | Select-String " ass "
```

If the `ass` filter is missing, burned-in captions will not render. Install a build with libass
before running Phase 4.

## Local development

From the repository root:

```powershell
./scripts/dev-worker.ps1
```

Or from `apps/worker`:

```powershell
uv sync --group dev
uv run uvicorn clipmax_worker.service:app --reload --port 8080
curl http://localhost:8080/healthz
```

The default provider is `openai` and needs `OPENAI_API_KEY`. For no-key development use local
faster-whisper: run `uv sync --extra local-whisper`, then set `WHISPER_PROVIDER=local` and
`WHISPER_MODEL=base.en`. The extra is not required for hosted providers.

`/healthz` intentionally does not require credentials, so the process can report liveness before its
environment is complete. It does report `worker.media_ready` and `worker.media_error` from a real
FFmpeg/libass probe. The first component that calls `get_settings()` fails fast if Supabase or R2 is
missing.

## Checks

```powershell
uv run ruff check .
uv run ruff format --check .
uv run mypy clipmax_worker
uv run pytest
```

## Native runtime (Phase 4+)

The worker is a long-lived Python service, not a job image:

1. The web API inserts a `processing_jobs` row.
2. The worker claims a row with `claim_next_job()` using `FOR UPDATE SKIP LOCKED`, a lease, and an
   attempt counter.
3. It downloads the source from R2, runs transcription and highlight analysis, renders with the
   system FFmpeg, uploads the results to R2, and updates the job row.
4. Progress is written to Postgres and streamed to the browser through Supabase Realtime.
5. Additional worker processes can run for concurrency; the database claim guarantees one worker per
   job.

The API and worker share the same Supabase and R2 project in local development. No local database or
S3 emulator is used.

## Deployment

The production target is a Linux VM:

- a dedicated unprivileged OS user
- a `uv`-managed virtual environment under the app directory
- system FFmpeg installed from the distribution or a pinned static build
- a systemd unit with `EnvironmentFile=/etc/clipmax/worker.env`
- logs to journald (stdout/stderr from the structured JSON logger)

The service is started by systemd; no image build or registry is involved.
