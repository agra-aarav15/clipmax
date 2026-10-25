# ClipMax — Handoff Prompt

Copy everything below the line into a new agent chat. It is written to stand alone.

---

You are continuing **ClipMax**, an AI video-repurposing SaaS, in the local monorepo at `F:\ClipMax`
(Windows, PowerShell). Read `PRODUCT.md`, `DESIGN.md`, and `PLAN.md` before changing code. Treat
`clipmax_master_vision_prompt.md` as the original source of truth, but the newer product and design
docs win where they are more specific.

## What ClipMax is

Long-form horizontal video in, vertical 9:16 captioned clips out.

- Hero line: **Long video in. A week of clips out.**
- Audience: podcasters, interviewers, course creators, webinar hosts, small content teams.
- Launch promise: one upload or supported public link → 3–5 real vertical clips with word-level
  captions, a hook, and a score, ready to review and download.
- Stack: Next.js 16 App Router, TypeScript, Tailwind 4, Supabase (Postgres/Auth/RLS/Realtime),
  Cloudflare R2 private bucket with presigned uploads, Python 3.12 worker with `uv` and system
  FFmpeg. **No Docker.**
- Worker pipeline: source → audio → transcribe → highlights → crop → captions → render → publish.
- Pricing: Free 30 credits/month; Starter $19 / ₹1,499 for 150 credits/month. 1 credit = 1 minute
  of source video, rounded up.

## Non-negotiable rules

1. **Zero fake UI / zero mock data.** No fake progress, fake clips, fake testimonials, fake logos,
   or invented metrics. Sample content must be visibly labelled `sample`.
2. **Real errors.** If Supabase/R2/AI credentials are missing, show a specific configuration/error
   state. Never show a fake success.
3. **No Docker.** Web runs on Node/pnpm; worker runs natively with `uv` and system FFmpeg.
4. **Video bytes never proxy through the Next.js server.** Browser → presigned PUT → R2.
5. **Auth/credits/payments are server-truth.** Never trust client state for entitlements.
6. Keep the current visual world: cinematic editorial, warm-black, film grain, masked dot field,
   oversized type, Instrument Serif italic emphasis, monospace timecodes.
7. Respect `prefers-reduced-motion`; keyboard focus; WCAG AA contrast.
8. Do not delete or overwrite another agent's work. The repository is committed and pushed to
   `origin/main`; run `git status` before editing and do not rewrite published history.

## Current state (25 Oct 2026)

### Repository and public preview

- Public repository: `https://github.com/agra-aarav15/clipmax` (branch `main`).
- Static design preview: `https://aarav.runs-on.dev/clipmax/`. It is the real landing page from
  `apps/site`, built with GitHub Pages under `/clipmax`. `/signup` and `/dashboard` on that host
  explain the preview boundary instead of faking the studio.
- The full app still runs only on Node with hosted credentials. GitHub Pages cannot serve API
  routes, `/auth/callback`, the worker, or webhooks.

### Implemented in code

- Monorepo, CI, shared contracts, schema with RLS, credits, and the lease-based job queue.
- Landing rebuilt in the cobalt + ice cinematic system, including the lower sections, pricing, and
  a reduced-motion-safe GSAP/Lenis/ScrollFloat motion layer.
- Supabase Auth signup/signin (Google + magic link), PKCE callback, session-refresh proxy, real
  `/dashboard` shell with wallet and projects.
- Direct-to-R2 presigned uploads with real XHR progress, HeadObject verification, credit
  reservation, retry, and delete.
- Public-link intake through yt-dlp with an allowlist and honest errors.
- Project results page: real pipeline timeline, signed clip playback, thumbnails, word-level
  transcript, downloads, retry, delete, and 5-second polling while a job is active.
- Worker pipeline: claim, download, ffprobe, audio, transcription (remote or local), highlights
  (LLM or labelled heuristic), 9:16 render with burned ASS captions, thumbnail, R2 publish, and DB
  state. Missing AI keys fail the job permanently and refund; `/healthz` reports FFmpeg/libass.
- Razorpay: checkout, server-stored subscription ownership, signature verification, webhook with
  raw-body HMAC, idempotent per-charge grants, state transitions, and the billing/ledger page.
- Per-reservation credit idempotency so retries settle and refund correctly.
- Postgres-backed fixed-window rate limits on presign, initiate, link, retry, checkout, and verify.
- Idempotent monthly free-plan renewal through a `CRON_SECRET`-protected cron route.
- `/api/health` readiness checks for Supabase, R2, billing, and cron configuration.
- `docs/runbook.md`: the full hosted setup, worker systemd unit, smoke pass, monitoring, and rollback.

### Verified locally (no hosted credentials)

- Web typecheck, lint, and production build pass.
- Worker pytest (11), ruff, and mypy --strict pass.
- Synthetic source renders 1080×1920 H.264/AAC with burned ASS captions; ffprobe confirms it.
- Razorpay HMAC verification passes valid and tamper-negative cases.
- All five migrations apply to PostgreSQL 18 (PGlite with stubbed Supabase auth) and an executable
  check proves: signup grant once, monthly renewal once and not in the signup month, starter
  accounts skipped, rate limiter allows/blocked with a bounded retry, RLS hides the other tenant,
  and reserve/refund settle idempotently.
- `/api/health` returns 503 `ready:false` without credentials and 200 only when Supabase and R2 are
  configured. The cron route rejects a missing secret (503) and the limiter fails open with a log
  when its migration is absent.
- GitHub Pages serves the real landing at 1440 and 390 px with no horizontal overflow, no console
  errors, and no failed requests. The static `/signup` and `/dashboard` routes are honest
  preview-boundary pages, not mock product screens.

### Not verified / not built

- No `.env` credentials in this checkout. Hosted Supabase migrations/auth, R2 upload/signing, real
  transcription, Razorpay test webhook delivery, and a real end-to-end project have not run.
- No domain/DNS or confirmed hosting target. `docs/runbook.md` covers both Vercel and a native Node
  host; choose one before provisioning.
- No pgTAP suite or Sentry. `pnpm db:verify` runs the migrations plus RLS/credit checks in CI, but
  it is not pgTAP and does not use the hosted project.
- No privacy policy, terms, refund policy, or monitored support inbox. Razorpay live KYC needs them;
  the signup copy now says only “use content you have the rights to process” rather than claiming
  agreement to documents that do not exist.
- Center crop only; no face tracking. Do not claim face tracking in copy.
- Full NLE editor, teams, auto-posting, and marketplace remain non-goals.

## Locked decisions (23 Oct 2026)

- **Palette:** cobalt `#0047AB` + ice `#89CFF0`. Cobalt is `bg-primary`; ice is `text-signal`,
  `border-signal`, `bg-signal`, and the focus ring. Lime is removed. Do not use cobalt for small
  text on dark (2.36:1).
- **Auth:** Supabase Auth (email magic link + Google), native RLS.
- **Hosting:** full Next.js app on Vercel or Cloudflare with one custom domain. GitHub Pages cannot
  host `/auth/callback`, API routes, or webhooks. Domain/DNS is still open.
- **Payments:** Razorpay first for India, with a `PaymentProvider` interface for Stripe later.
  youPI-PG is not the launch path: it is a self-hosted UPI/COD bank-SMS gateway, not a
  Razorpay/Stripe SDK, and carries compliance/freeze/ops risk. Do not wire it without a new
  explicit decision.
- **Backend:** real Supabase + R2 + worker. A seed project is allowed only when visibly labelled
  sample.
- **Link intake:** public-link ingestion through yt-dlp in the worker, with honest unsupported and
  private-URL errors. Upload remains the fallback.
- **Instagram/Telegram:** public Reels via URL; Telegram Desktop JSON export first. Live Telethon is
  optional and requires a persistent process.

## Immediate next actions

1. **Create the hosted Supabase project and R2 bucket**, then copy `.env.example` to `.env` and
   `apps/web/.env.example` to `apps/web/.env.local`. Never commit either file.
2. Run `pnpm db:verify`, then apply all five migrations in `supabase/migrations` in date order with
   `pnpm db:push`. Set the Supabase redirect URLs for `/auth/callback`, add the R2 CORS rule, and
   run the real smoke pass: signup → upload → worker → clip → download.
3. Configure a Razorpay **test** plan and webhook (`/api/webhooks/razorpay`). Test one checkout,
   confirm exactly 150 credits are granted once, and replay the webhook to prove it is a no-op.
4. Set `CRON_SECRET`, schedule `/api/cron/renew-free-credits` for `0 2 1 * *`, and run it twice to
   confirm the second call is a no-op. Authenticated mutation routes are already limited; the
   webhook is intentionally gated by its HMAC signature instead of a counter so Razorpay retries
   are not dropped.
5. Pick the domain/host, deploy the web app and the native worker following `docs/runbook.md`, run
   the mobile pass at 390/768/1440, and record the rollback owner.
6. Add the reviewed privacy, terms, and refund pages plus a monitored support inbox before Razorpay
   live mode. Do not launch live payments without them.
7. Launch only when the smoke pass and payment replay pass are green. Until then, keep the pricing
   copy honest: the code says checkout is unavailable when the Razorpay keys are missing.

## Key files

- `apps/web/src/components/landing/hero.tsx` — headline, background, intake, proof strip.
- `apps/web/src/components/landing/hero-console.tsx` — sample cutting-room console; mobile
  source-chip layout fixed.
- `apps/web/src/components/landing/site-header.tsx` — nav, sticky state, mobile dialog.
- `apps/web/src/components/landing/source-intake.tsx` — link/upload modes, validation, signup route.
- `apps/web/src/app/signup/page.tsx` — split signup layout.
- `apps/web/src/components/auth/signup-form.tsx` — Google OAuth, magic link, config fallback.
- `apps/web/src/app/auth/callback/route.ts` — PKCE exchange.
- `apps/web/src/lib/supabase/client.ts` — browser client; returns null without env.
- `apps/web/src/app/globals.css` — tokens, grain, dots, animations, reduced motion.
- `apps/web/src/app/layout.tsx` — fonts, metadata, theme color.
- `apps/web/next.config.ts` — security headers, dev indicators.
- `apps/worker/clipmax_worker/` — worker pipeline and native runtime.
- `packages/shared/src/` — shared types, credit rules, statuses.
- `apps/web/src/lib/rate-limit.ts` — typed limits for authenticated mutation routes.
- `apps/web/src/app/api/cron/renew-free-credits/route.ts` — protected monthly grant.
- `supabase/migrations/20261024190000_rate_limits.sql` — fixed-window limiter.
- `supabase/migrations/20261024191000_free_plan_renewal.sql` — idempotent free grant.
- `docs/runbook.md` — the credential-backed deployment procedure and rollback table.
- `docs/architecture.md` — architecture contract; update as decisions land.

## Commands

```powershell
# from F:\ClipMax
pnpm install
$env:SKIP_ENV_VALIDATION='1'; pnpm --filter @clipmax/web dev --port 3200

pnpm --filter @clipmax/web typecheck
pnpm --filter @clipmax/web lint
$env:SKIP_ENV_VALIDATION='1'; pnpm --filter @clipmax/web build

python -m uv run --directory apps/worker pytest
python -m uv run --directory apps/worker ruff check .
python -m uv run --directory apps/worker mypy clipmax_worker
pnpm db:verify

# monthly grant (after setting CRON_SECRET)
curl -H "Authorization: Bearer $env:CRON_SECRET" `
  http://localhost:3200/api/cron/renew-free-credits
```

Use `http://localhost:3200`, not `127.0.0.1`, for local auth redirects.

## Environment

Copy `.env.example` to `.env` and `apps/web/.env.example` to `apps/web/.env.local`; copy worker vars
to `apps/worker/.env`. Required for a production web boot: Supabase URL/anon/service role, R2
account/access/secret/bucket (or `R2_ENDPOINT`), and `CRON_SECRET`. Razorpay keys, worker Whisper/LLM
keys, and the worker's `R2_*` values are required for those features. Never commit real secrets.
Never prefix a secret with `NEXT_PUBLIC_`.

## Working style

- Move fast, but verify: typecheck, lint, build, and a real browser pass after each meaningful UI
  change.
- Prefer the smallest working diff (Ponytail). Do not add abstractions for one implementation.
- Use subagents/parallel tools for independent research and test generation; review their output.
- When a decision is genuinely blocking, ask one grouped question with options and a recommendation.
- Keep `PLAN.md` updated as the source of execution truth. Keep `DESIGN.md` as the visual contract.
- Do not expand scope past the definition of done in `PLAN.md` §6.

Start by reading the three docs, run `./scripts/verify.ps1`, then get the hosted credentials and
execute the smoke pass in “Immediate next actions”. Do not claim a render, upload, or payment
succeeded until the hosted service confirms it.
