# ClipMax

AI video repurposing SaaS. Long-form horizontal video in, vertical 9:16 captioned clips out.

This repository is the production monorepo: a Next.js web app, Supabase schema and RLS, Cloudflare R2
direct uploads, and a native Python/FFmpeg worker. The web app runs on Node via pnpm. The worker runs
in a `uv` virtual environment and calls the system FFmpeg binary. Local development connects straight
to hosted Supabase and R2, so both services run natively on the developer's machine.

## Live design preview

[Open the static design preview](https://aarav.runs-on.dev/clipmax/) (source: [apps/site](apps/site)).

GitHub Pages serves the real landing page from `apps/site` under `/clipmax`. This is a design
preview, not the working studio: sign-in, uploads, processing, and billing live in the full Next.js
app and need hosted Supabase, R2, worker, and Razorpay credentials. The preview routes state that
boundary instead of showing fake data.

## Status

| Phase | Scope                                               | State                                                                                       |
| ----- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1     | Repo scaffolding, shared contracts, navbar and hero | **Complete**                                                                                |
| 2     | Supabase schema, RLS, credits, job queue            | **Code complete** (apply migrations to hosted project)                                      |
| 3     | R2 presigned upload API + project lifecycle         | **Code complete** (needs R2 keys)                                                           |
| 4     | Worker pipeline: transcribe → highlights → render   | **Code complete** (needs FFmpeg + AI provider)                                              |
| 5     | Frontend: dashboard, upload, results, review        | **Code complete** (no full NLE, by design)                                                  |
| 6     | Razorpay webhook + credit enforcement               | **Code complete** (needs test/live Razorpay keys)                                           |
| 7     | Hardening, deploy, launch                           | **In progress** — static preview live; production needs credentials and a domain            |

There is no mock data anywhere in this repository. Missing credentials produce a specific
configuration state, never a fake success. The studio now has real project rows, signed clip
playback, transcript disclosure, downloads, retry, delete, credit ledger, Razorpay checkout,
server-side rate limits, and a monthly free-plan renewal.

### Verification status (25 Oct 2026)

Verified locally without hosted credentials:

- `pnpm --filter @clipmax/web typecheck`, `lint`, and a production `build` pass.
- Worker `pytest` (11 tests), `ruff`, and `mypy --strict` pass.
- A synthetic source renders through the real FFmpeg path: 1080×1920, H.264/AAC, burned ASS
  captions with word-level highlight, verified by ffprobe.
- Razorpay webhook and checkout HMAC verification pass positive and tamper-negative tests.
- `pnpm db:verify` applies all five Supabase migrations to PostgreSQL 18 (PGlite) with stubbed
  Supabase auth and proves the signup grant, monthly renewal idempotency, fixed-window rate
  limiting, RLS cross-tenant isolation, and reservation/refund accounting.
- `/api/health` reports real readiness: 503 with `ready: false` when Supabase/R2 are missing, 200
  only when the core integrations are configured. `/api/cron/renew-free-credits` rejects missing or
  wrong `CRON_SECRET` values.
- The GitHub Pages build serves the real landing at 1440 and 390 px with no horizontal overflow,
  console errors, or failed requests. `/signup` and `/dashboard` there are preview-boundary pages,
  not mock product screens.

Not verified in this checkout because no `.env` credentials exist: hosted Supabase auth, a real
R2 upload/signing round trip, real transcription, Razorpay test checkout/webhook delivery, and
deployment. Those are integration checks for the founder's keys, not missing code paths. Follow
[docs/runbook.md](docs/runbook.md) for the credential-backed pass.

## Stack

- **Web:** Next.js 16 (App Router, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Query)
- **Data:** Supabase (PostgreSQL, Auth, RLS) — Phase 2
- **Storage:** Cloudflare R2, private bucket, presigned PUT/GET only — Phase 3
- **Worker:** Python 3.12, FastAPI, system FFmpeg + libass, managed with `uv` — Phase 4
- **Billing:** Razorpay subscriptions — Phase 6

Both services are native processes; the repository contains no image or orchestrator configuration.

## Layout

```text
apps/web          Next.js application
apps/worker       Native Python worker (uv + system FFmpeg)
packages/shared   Types, zod schemas, credit rules, status enums
contracts/        JSON Schemas shared by TypeScript and Python
supabase/         Remote migrations, RLS, tests (Phase 2)
docs/             Architecture, data model, API contracts, runbook
scripts/          Local PowerShell helpers
```

## Prerequisites

| Tool          | Version        | Notes                                       |
| ------------- | -------------- | ------------------------------------------- |
| Node.js       | 24.x (>= 22)   | `.nvmrc` pins 24                            |
| pnpm          | 11.x           | `corepack enable`                           |
| Python        | 3.12.x         | worker                                      |
| uv            | 0.13+          | `python -m pip install --user uv`           |
| FFmpeg        | 7+ with libass | system binary, required by the worker       |
| Supabase CLI  | 2.x            | remote link/push/types, `pnpm dlx supabase` |
| Supabase      | hosted         | project URL + anon key + service role key   |
| Cloudflare R2 | hosted         | private bucket + S3 API token               |

Install FFmpeg on Windows:

```powershell
winget install Gyan.FFmpeg
ffmpeg -version
ffmpeg -filters | Select-String " ass "
```

The last command must show the `ass` filter; burned-in word-level captions depend on libass.

## Quick start

```powershell
# 1. install JavaScript dependencies
pnpm install

# 2. configure env
Copy-Item .env.example .env
Copy-Item apps/web/.env.example apps/web/.env.local

# 3. fill in the hosted Supabase and R2 credentials in both files

# 4. web app
pnpm dev            # http://localhost:3000

# 5. worker (separate shell)
./scripts/dev-worker.ps1
```

`scripts/dev-worker.ps1` copies the root `.env` into `apps/worker/.env` when needed, resolves a
pip-installed `uv` that is missing from PATH, and runs the worker with reload enabled.

Or run the one-time setup:

```powershell
./scripts/bootstrap.ps1
```

## Hosted services

There is no local Supabase stack and no object-store emulator.

- **Supabase:** create a hosted project, enable email and Google auth, and copy the project URL and
  keys into the env files. Phase 2 adds migrations under `supabase/migrations`; link once with
  `pnpm db:link`, then apply with `pnpm db:push` and regenerate types with `pnpm db:types`.
- **R2:** create a private bucket and an S3 API token. Add a CORS rule for `http://localhost:3000`
  and the production origin. Only `PUT` and `GET` are needed for direct uploads and signed previews.
- **Worker:** use the hosted Supabase service role key and the R2 S3 credentials. Both are server
  secrets and never use a `NEXT_PUBLIC_` prefix.

## Verification

```powershell
./scripts/verify.ps1
```

The script runs:

```powershell
pnpm typecheck
pnpm lint
pnpm db:verify               # migrations + RLS/credit checks in PGlite
pnpm build
uv run ruff check .          # in apps/worker
uv run ruff format --check .
uv run mypy clipmax_worker
uv run pytest
ffmpeg -version
```

`pnpm db:verify` needs no Docker, no local Supabase, and no hosted credentials. It is also a CI
step, so a migration that breaks signup, credits, RLS, rate limiting, or renewal fails the build.

`pnpm build` validates env vars unless `SKIP_ENV_VALIDATION=1` is set; CI sets it because no secrets
exist in the build environment.

## Locked product decisions

- **Credits:** 1 credit = 1 minute of source video. Free = 30 credits/month. Starter = 150
  credits/month at $19 / ₹1,499 via Razorpay.
- **Sources:** direct upload (`.mp4`, `.mov`, `.webm`; max 500 MB and 15 minutes) or a supported
  public link through yt-dlp. Private or unsupported links fail with an honest error instead of a
  fabricated job.
- **Storage:** private R2 only. Upload URLs live 15 minutes, preview/download URLs live 60 minutes.
- **Tenancy:** multi-tenant from day 1, Supabase Auth (email + Google OAuth), RLS on every table.
- **Processing:** asynchronous, queue-driven. The browser never uploads through the Next.js server.
- **Runtime:** web and worker are native processes. Production worker runs on a Linux VM under a
  dedicated unprivileged account with system FFmpeg; the deployment is source + `uv`, not an image.

## Environment

See `.env.example` for the full list and the secrecy boundary. Only `NEXT_PUBLIC_*` variables are
inlined into the browser bundle; everything else is server/worker only. `apps/web/src/lib/env.ts`
validates at startup and fails closed in production. `apps/worker/.env` is the worker's own file and
must never be committed.
