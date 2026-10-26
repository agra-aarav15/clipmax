# ClipMax

AI video repurposing SaaS. Long-form horizontal video in, vertical 9:16 captioned clips out.

**Start here:** [CLIPMAX.md](CLIPMAX.md) is the master plan and continuation file. It records what is
built, what is proven, what is blocked, and the exact next task. Read it before changing anything.

This repository is the production monorepo: a Next.js web app, Supabase schema and RLS, Cloudflare R2
direct uploads, and a native Python/FFmpeg worker. The web app runs on Node via pnpm. The worker runs
in a `uv` virtual environment and calls the system FFmpeg binary. Local development connects straight
to hosted Supabase and R2, so both services run natively on the developer's machine.

## Live design preview

[Open the static design preview](https://aarav.runs-on.dev/clipmax/) (source: [apps/site](apps/site)).

The frontend has been **rejected**. Track B is assigned to an external builder; the brief is
[FRONTEND_PROMPT.md](FRONTEND_PROMPT.md). The working direction is **The Rundown**: a light-first
broadcast edit desk with warm paper and ink, one safety-orange signal, timecode rails, and real
clips. The builder delivers 5–10 coded references first, then one full-app build; the founder
reviews the references before the final direction is locked.

The current preview and the six-direction board are the old cobalt/ice exploration. They stay live
as history until the rebuild lands, but they are **not the target design**. GitHub Pages serves the
landing from `apps/site` under `/clipmax`. It is a static preview, not the working studio: sign-in,
uploads, processing, and billing live in the full Next.js app and need hosted Supabase, R2, worker,
and Razorpay credentials. The preview routes state that boundary instead of showing fake data.

## Status

| Phase | Scope                                               | State                                                                            |
| ----- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1     | Repo scaffolding, shared contracts, navbar and hero | **Complete**                                                                     |
| 2     | Supabase schema, RLS, credits, job queue            | **Complete**; six applied to hosted, seventh hardening migration pending         |
| 3     | R2 presigned upload API + project lifecycle         | **Code complete** (needs R2 keys)                                                |
| 4     | Worker pipeline: transcribe → highlights → render   | **Code complete** (needs R2 keys and an AI provider)                             |
| 5     | Frontend: landing, auth, studio, results, billing   | **Rejected; external rebuild** from [FRONTEND_PROMPT.md](FRONTEND_PROMPT.md)     |
| 6     | Razorpay webhook + credit enforcement               | **Code complete** (needs test/live Razorpay keys)                                |
| 7     | Hardening, deploy, launch                           | **In progress** — static preview live; production needs credentials and a domain |

There is no fake data presented as real. Missing credentials produce a specific configuration state,
never a fake success. The studio now has real project rows, signed clip playback, transcript
disclosure, downloads, retry, delete, credit ledger, Razorpay checkout, server-side rate limits, and
a monthly free-plan renewal.

A read-only backend audit on 26 Oct found eleven issues; all are fixed and covered by the local
suite. The fixes cover R2 presign checksums, account-deletion cleanup, unique worker ids, provider-
matched LLM keys, terminal-failure and lease-reaper cleanup, retry render cleanup, and a checkout
state machine that never cancels a paid subscription or loses an orphan id. The new migration must be
applied before the matching checkout route is deployed; the route fails closed if it is not.

### Verification status (26 Oct 2026)

Verified locally without hosted credentials:

- `pnpm typecheck`, `pnpm lint`, and the web production build pass.
- `pnpm db:verify` applies all seven Supabase migrations to PostgreSQL 18 (PGlite) with stubbed
  Supabase auth and passes 119 executable checks: signup grant, monthly renewal idempotency,
  fixed-window rate limiting, RLS cross-tenant isolation, reservation/settle/refund accounting,
  checkout reuse/stale/clear/reconcile, webhook claim/retry idempotency, ordered subscription
  events, worker lease ownership, final-attempt reaping, and terminal clip cleanup.
- Worker `pytest` (27 tests), `ruff`, and `mypy --strict` pass.
- A synthetic source renders through the real FFmpeg path: 1080×1920, H.264/AAC, burned ASS
  captions with word-level highlight, verified by ffprobe.
- Razorpay webhook and checkout HMAC verification pass positive and tamper-negative tests.
- `/api/health` reports real readiness: 503 with `ready: false` when Supabase/R2 are missing, 200
  only when the core integrations are configured. `/api/cron/renew-free-credits` rejects missing or
  wrong `CRON_SECRET` values.
- **Hosted Supabase is live** (project `eerqogsjvoswkqhhnhld`): six migrations applied, 28
  functions, the auth-user trigger, and 8 RLS policies. An Admin-API user creation produced a
  profile, a 30-credit wallet, and a `grant_signup` ledger row; anon REST reads of `profiles`
  returned `[]`. QA users were removed afterwards. The seventh migration
  (`20261026120000_backend_hardening.sql`) is locally verified and still pending on the hosted
  project; apply it before deploying the matching app code.
- The GitHub Pages build serves the landing under `/clipmax` with no horizontal overflow, console
  errors, or failed requests. `/signup` and `/dashboard` there are preview-boundary pages, not mock
  product screens.

Still unverified because R2 and Razorpay keys are not configured: a real upload/signing round trip,
real transcription and a real hosted render, Razorpay test checkout and webhook delivery, and
deployment. The Supabase half is proven at the API/DB level; the browser magic-link and Google round
trips still need the hosted Site URL set to `http://localhost:3200`. The seventh hardening migration
is pending on the hosted project and must be applied before the matching checkout route is deployed.
Follow [docs/runbook.md](docs/runbook.md) for the credential-backed pass.

## Stack

- **Web:** Next.js 16 (App Router, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Query)
- **Data:** Supabase (PostgreSQL, Auth, RLS) — Phase 2
- **Storage:** Cloudflare R2, private bucket, presigned PUT/GET only — Phase 3
- **Worker:** Python 3.12, FastAPI, system FFmpeg + libass, managed with `uv` — Phase 4
- **Billing:** Razorpay subscriptions — Phase 6

Both services are native processes; the repository contains no image or orchestrator configuration.

## Layout

```text
apps/web          Next.js application (landing, auth, studio, API)
apps/site         Static GitHub Pages preview (landing + historical design pages)
apps/worker       Native Python worker (uv + system FFmpeg)
packages/shared   Types, zod schemas, credit rules, status enums
contracts/        JSON Schemas shared by TypeScript and Python
supabase/         Remote migrations, RLS, SQL verification fixtures
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
pnpm --filter @clipmax/web dev --port 3200   # http://localhost:3200

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
- **R2:** create a private bucket and an S3 API token. Add a CORS rule for `http://localhost:3200`
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
