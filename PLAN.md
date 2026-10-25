# ClipMax — 15-Day Launch Plan (historical)

> **Superseded on 25 October 2026 by [CLIPMAX.md](CLIPMAX.md).** This day-by-day plan was written
> before the vertical slice existed and now describes work that is already built. Keep it as a
> record of the original sequencing; execute from CLIPMAX.md §6 instead.

**Window:** Fri 23 Oct 2026 → Fri 6 Nov 2026
**Repo:** `F:\ClipMax`
**Launch definition:** a real user can sign up, submit a source, watch a real job progress, review at
least one rendered 9:16 clip, and pay for the Starter plan in test mode (or live, if KYC is done).
Marketing is honest, mobile works, and no screen depends on mock data.

This plan is deliberately a **vertical slice**, not the whole cathedral. Every day should end with
something a user can click.

---

## 0. Decisions that change the build

**Resolved 23 Oct 2026.** The build proceeds with these; the open items are listed at the bottom.

| #   | Decision      | Locked choice                                                       | Consequence                                                                                |
| --- | ------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| D1  | Palette       | **Cobalt `#155EEF` + ice `#9BE7FF`**                                | Cobalt is `bg-primary`; ice is `text-signal` and the ring. Lime is removed.                |
| D2  | Auth          | **Supabase Auth**                                                   | Email magic link + Google; native RLS; one vendor.                                         |
| D3  | Hosting       | **Full Next.js app on Vercel or Cloudflare with one custom domain** | GitHub Pages cannot run the auth callback, API routes, or webhooks. Domain/DNS still open. |
| D4  | Payments      | **Razorpay first for India; Stripe adapter later**                  | Test-mode checkout first. youPI-PG is not the launch path.                                 |
| D5  | Backend truth | **Real Supabase + R2 + worker**                                     | A seed project is allowed only when visibly labelled sample.                               |
| D6  | Link intake   | **Public-link ingestion via yt-dlp**                                | Unsupported/private URLs get an honest error; upload remains the fallback.                 |
| D7  | Telegram      | **Desktop JSON export first; live Telethon optional**               | No account session required for launch. Live reading needs a persistent process.           |
| D8  | Instagram     | **Public Reels via URL**                                            | Private/age-gated Reels require user-supplied cookies and are not the default path.        |
| D9  | Domain        | **One apex domain for the app**                                     | Founder must provide the domain and DNS access.                                            |

Still open: domain/DNS, payment KYC (Razorpay/Stripe), AI provider budget, and whether the business
entity can support both payment processors. None of these block the local build.

---

## 1. Current state (23 Oct)

### Done

- Monorepo scaffolding: Next.js web, Python worker skeleton, shared contracts, CI.
- Cinematic editorial hero, header, intake, sample console, signup page, Supabase browser client,
  PKCE callback route.
- Missing-credential states are honest; no fake auth success.
- Desktop/tablet/mobile screenshots and a QA script exist.
- Cobalt + ice palette applied; mobile console source-chip collision fixed; fresh 390/768/1440
  screenshots captured.
- Project skills installed under `.opencode/skills` (Ponytail, Impeccable, GSAP, Lenis, React Bits,
  Apple HIG, Emil motion, UI/UX Pro Max, Hallmark, reel analyzer, agent reach).
- `watch-reels` and `telegram-reader` skills exist. Telegram Desktop JSON export is parsed into
  JSONL + digest; live Telethon is optional.
- `PRODUCT.md`, `DESIGN.md`, this plan, and the handoff prompt.

### Not done

- Real Supabase schema, RLS, credits, queue.
- R2 presign / upload / initiate routes.
- Worker pipeline.
- Real dashboard, results, editor.
- Payments.
- Lower landing sections are still the old engineering-doc style.
- Link intake is only a redirect to signup; no ingestion.
- `/dashboard` is a Phase 1 status page.
- No `.env` credentials, so auth/upload/render cannot be tested end to end.
- No deploy target confirmed.

### Known bugs

- Hero console’s “Open the studio” CTA points at the unfinished `/dashboard`.
- The lower landing sections clash with the new hero.
- The signup upload path does not persist the selected file; the copy says it will be confirmed in
  the studio. Keep the copy or implement persistence.

### 24 Oct build update

The list above is the 23 Oct snapshot. The code now covers the vertical slice through billing; the
remaining work is credential-backed integration, hardening, and deployment.

Shipped after the snapshot:

- Project results page: real job timeline, signed 9:16 playback, thumbnails, transcript disclosure,
  download, retry, delete, and 5-second status polling while the queue is active.
- Dashboard project links and real rendered-clip counts; real plan label from `profiles.plan`.
- Razorpay: authenticated subscription checkout, server-stored subscription ownership, checkout
  signature verification, raw-body webhook verification, idempotent per-charge credit grants,
  subscription state transitions, and a billing page with the real ledger.
- Per-reservation credit idempotency migration, so a retried project can refund and settle again.
- Worker: R2 endpoint fallback from account id, startup without AI keys, permanent provider errors
  that refund, FFmpeg/libass readiness in `/healthz`, and a hard requirement for word timestamps.
- Lower landing rebuilt in the cinematic system with ScrollFloat, Lenis, and reduced-motion guards.
- Postgres-backed fixed-window rate limits on presign, initiate, link, retry, checkout, and verify;
  the limiter fails open (with a loud log) only when its migration is missing.
- Idempotent monthly free-plan renewal plus a `CRON_SECRET`-protected cron route.
- `/api/health` now reports real Supabase/R2/cron readiness instead of a hardcoded phase.
- Deployment runbook covering Supabase, R2, Razorpay, Vercel or native Node, the worker VM, the smoke
  pass, and rollback.
- Mobile/desktop QA fixes: duplicate page titles, truncated configuration keys, and signup copy that
  referenced nonexistent legal terms.

Verified locally: web typecheck/lint/production build; worker pytest/ruff/mypy; a synthetic
1080×1920 render with burned captions; Razorpay HMAC positive/negative cases; all migrations parse
as PostgreSQL.

Still blocked or unverified (24 Oct):

- No hosted credentials, so migrations, auth, R2, transcription, and payments have not run against
  the real services. This is the critical path now.
- No domain/DNS or hosting target.
- No pgTAP suite or Sentry. `pnpm db:verify` runs the migrations, RLS cross-tenant isolation, rate
  limiter, renewal idempotency, and credit accounting against PGlite in CI, but it is not pgTAP and
  does not use the hosted project.
- Privacy, terms, refund, support, and status pages exist. Support routes to GitHub Issues and the
  status page reports credential presence plus a live worker probe. A monitored support inbox still
  requires `SUPPORT_EMAIL`; Razorpay live KYC also needs the business details filled in.
- The crop is a center crop, not face-tracked. This is documented and acceptable for v1, but the
  marketing must not claim face tracking.
- A full editor, teams, auto-posting, and a marketplace remain non-goals.

---

## 2. Architecture recommendation

### Launch topology

```text
Browser
  ├─ marketing + app (Next.js 16, Vercel/Cloudflare)
  ├─ Supabase Auth (email magic link + Google)
  ├─ direct PUT → Cloudflare R2 (presigned, private)
  └─ Supabase Realtime ← job status
                         │
                Python worker (uv + system FFmpeg)
                  ├─ yt-dlp for public links
                  ├─ faster-whisper or Whisper API
                  ├─ LLM JSON for highlight selection
                  ├─ FFmpeg crop + libass captions
                  └─ write clips to R2 + Postgres
```

- **No Docker.** Web on Node/pnpm; worker natively on a Linux VM (or a Windows dev machine) with
  system FFmpeg.
- **Supabase Auth** is the default. If Auth0 is chosen, Supabase must accept Auth0 JWTs through
  third-party auth; this is extra work and is not on the critical path.
- **Payments:** a `PaymentProvider` interface with `createCheckout`, `verifyWebhook`, and
  `grantCredits`. Razorpay and Stripe implement it. youPI-PG is a separate UPI experiment, not the
  default because it is a self-hosted bank-SMS gateway, not a card/subscription processor.
- **Queue:** `processing_jobs` table with `FOR UPDATE SKIP LOCKED`, lease, attempt count. No Redis,
  no separate queue service. This is one less moving part.
- **Credits:** `credit_wallets` cached balance + append-only `credit_ledger`; only SQL functions
  mutate; webhook idempotency table.

### Hosting truth

GitHub Pages only serves static files. The current app needs:

- `/auth/callback` route handler for PKCE.
- Server-side env validation and API routes for presign/initiate/webhooks.
- Dynamic dashboard data and Supabase session cookies.

Therefore **GitHub Pages cannot host the current product**. The fastest path is Vercel or Cloudflare
Pages/Workers with a custom domain. If GitHub Pages is non-negotiable:

1. Put a static marketing page on GitHub Pages at the apex domain.
2. Put the Next.js app on `app.<domain>` at Vercel/Cloudflare.
3. Keep auth and payments on the app subdomain.
4. Accept the extra day of DNS and cross-domain session work.

Do not attempt a full static export of the current app in the 15-day window.

---

## 3. The 15 days

### Day 0 — Fri 23 Oct: decisions + design spine

- Answer D1–D9 (at least D1–D5).
- Install/verify project skills; write `PRODUCT.md`, `DESIGN.md`, `PLAN.md`, `HANDOFF.md`.
- Fix the mobile console collision. (Done.)
- Apply cobalt + ice tokens. (Done; screenshots captured.)
- Set the real domain and hosting target.
- Create the Supabase hosted project and R2 bucket (or confirm existing).
- Write `.env.local` with real keys; never commit.

**Exit:** screenshots of the chosen palette at 390/768/1440; typecheck/lint pass.

### Day 1 — Sat 24 Oct: database + auth

- Apply migrations: `profiles`, `projects`, `processing_jobs`, `clips`, `credit_wallets`,
  `credit_ledger`, `subscriptions`, `webhook_events`.
- RLS on every tenant table; `auth.uid() = user_id`; service-role-only queue/ledger.
- Trigger `auth.users` → `profiles`.
- `claim_next_job()` SQL function with lease + `SKIP LOCKED`.
- Supabase Auth: email magic link + Google; callback route; session refresh middleware.
- Real `/dashboard` shell with signed-in user and a real empty state.

**Exit:** sign up with Google and email on localhost; see a real profile row; `/dashboard` refuses
anonymous users.

### Day 2 — Sun 25 Oct: upload path

- `POST /api/uploads/presign` with auth, MIME/size/duration checks.
- `POST /api/projects/:id/initiate` with HeadObject verification and idempotency.
- R2 CORS for localhost + production.
- Browser XHR upload with real progress.
- Project status transitions; visible errors for expired signatures, wrong type, too large.
- Link intake: server route validates URL and creates a `source_type='link'` project, or returns
  `unsupported_source` honestly.

**Exit:** upload a real MP4 and see a `ready` project row; the file is in R2; no video bytes through
the Next.js server.

### Day 3 — Mon 26 Oct: worker skeleton → real job

- Worker claims a job, downloads/streams source from R2, probes with ffprobe.
- Write progress to `processing_jobs`.
- Extract 16 kHz mono WAV.
- Health check verifies FFmpeg and libass.
- Claim/lease/retry test with two worker processes.

**Exit:** a queued job moves to `in_progress` and produces a real WAV; a killed worker’s lease is
reclaimed.

### Day 4 — Tue 27 Oct: transcription

- `faster-whisper` local provider (default for dev) and Whisper API provider behind one interface.
- Word-level timestamps; store in `transcripts`.
- Chunk long audio; retry on transient failures.
- If no AI key is present, show a real “transcription provider not configured” failure and refund
  credits. Do not fake a transcript.

**Exit:** a 2-minute test clip produces a real transcript with word timestamps.

### Day 5 — Wed 28 Oct: highlights

- LLM JSON schema for 3–5 moments with start/end, hook, reason, score.
- Deterministic fallback: sentence/silence-based windows if no LLM key, clearly labelled
  `heuristic` in the job metadata.
- Word-snap boundaries; duration 20–60s.
- Store `clips` rows in `detected` state.

**Exit:** a real transcript produces three plausible clip windows with reasons; invalid JSON is
rejected and retried.

### Day 6 — Thu 29 Oct: crop + captions

- Face-aware crop plan with OpenCV/MediaPipe if available; center-crop fallback.
- Smoothed crop path; no jitter.
- ASS subtitle generation with word-level highlight and hook banner.
- FFmpeg render 1080×1920, H.264/AAC, faststart.
- Thumbnail extraction.

**Exit:** one real vertical clip with burned captions and a thumbnail.

### Day 7 — Fri 30 Oct: publish + results

- Upload renders to R2; signed GET URLs.
- Update `clips` and `processing_jobs`; complete project.
- Dashboard project view with real status timeline.
- Clip grid with playable previews, hook, timestamps, score, download.
- Empty/error/retry states.

**Exit:** end-to-end: upload → transcript → highlights → render → playable clip in the app.

### Day 8 — Sat 31 Oct: credits + billing

- Credit wallet, ledger, reservation/refund functions.
- Enforce credits server-side at initiate and before render.
- Razorpay test checkout + webhook signature + idempotent grant.
- Stripe test checkout + webhook if the entity supports it.
- Pricing page says “test mode” until live keys exist.
- youPI-PG decision: do not wire it unless D4 explicitly selects it.

**Exit:** test payment grants exactly 150 credits once; replaying the webhook changes nothing.

### Day 9 — Sun 1 Nov: dashboard polish + auth edge cases

- Project list, filters, empty states, loading skeletons.
- Session expiry, signed-out redirect, OAuth error states.
- Delete project (and R2 cleanup job).
- Real credit balance in the header.
- Error boundary and support path.

**Exit:** a new user can navigate the whole product without seeing a dead end.

### Day 10 — Mon 2 Nov: marketing rebuild

- Replace the old lower sections with the design system: pipeline, evidence, pricing, final CTA,
  footer.
- Add GSAP ScrollTrigger + Lenis (reduced-motion safe).
- Use one React Bits text/background/button treatment, adapted to tokens; no dependency dumping.
- Add real product screenshots or the labelled sample console; no fake logos.
- SEO: title, description, OG image, canonical, sitemap, robots.
- Analytics: privacy-safe events for CTA, signup, upload, first clip.

**Exit:** landing reads as one coherent world from hero to footer; Lighthouse mobile ≥ 90 for
performance/accessibility where feasible.

### Day 11 — Tue 3 Nov: link ingestion + Reels/Telegram ops

- Worker link ingestion with yt-dlp for supported public URLs; clear errors for unsupported/private.
- `watch-reels` skill + script: download a public Reel, frames, audio, transcript packet. (Done early.)
- `telegram-reader` skill + script: Telegram Desktop JSON export first, chat digest; optional Telethon
  live watch. (Export parser done early.)
- Document required credentials and the persistent runtime. Do not claim continuous reading until a
  process is actually running.

**Exit:** a public Reel URL produces a real analysis packet; a Telegram chat export or live session
produces a real digest.

### Day 12 — Wed 4 Nov: hardening

- Rate limits on authenticated mutation routes (presign, initiate, link, retry, checkout, verify);
  auth is covered by Supabase's own limits, and the webhook stays signature-gated.
- Security headers, CORS, signed URL TTLs, input validation.
- RLS cross-tenant checks in `pnpm db:verify`; add a hosted-project pgTAP suite if time allows.
- Worker sandbox: temp dirs, size/duration caps, no shell injection.
- Structured JSON logs are in place; add Sentry or an alert sink and job failure alerts.
- Backup/PITR check.

**Exit:** security checklist signed off; no secret in the client bundle.

### Day 13 — Thu 5 Nov: deploy + smoke

- Deploy web (Vercel/Cloudflare) and worker (Linux VM) with production env.
- Point DNS/TLS; verify Supabase redirect URLs and R2 CORS.
- Run the full smoke: signup → upload/link → job → clip → download → checkout test.
- Mobile pass at 390/768/1440.
- Rollback plan and runbook.

**Exit:** production URL works end to end with test payments.

### Day 14 — Fri 6 Nov: launch

- Switch payments live only if KYC and webhook tests are done; otherwise launch with “billing opens
  shortly” and a waitlist, not a fake checkout.
- Publish the landing, announce, monitor logs and job queue.
- Keep a warm worker and a kill switch for processing.
- Post-launch: fix only launch-blocking issues for 24 hours.

**Exit:** public URL, real signups, real jobs, support channel, incident rollback.

---

## 4. Parallel workstreams

| Track               | Owner                    | Work                                                          |
| ------------------- | ------------------------ | ------------------------------------------------------------- |
| Product/design      | Founder + agent          | Palette, copy, screenshots, landing sections, motion.         |
| Web/backend         | Agent + founder for keys | Supabase schema, auth, R2, API routes, dashboard.             |
| Worker/AI           | Agent + founder for keys | ffmpeg, whisper, LLM, crop, captions, render.                 |
| Growth/ops          | Founder                  | Domain, business/KYC, payment account, support, analytics.    |
| Research/automation | Agent (background)       | Reels/Telegram skills, competitor teardown, launch checklist. |

Use subagents or other tools only for **independent** work: research, asset prep, copy variants,
test generation. Every merged change still needs a local typecheck, lint, build, and a visual pass.

---

## 5. Risks and fallbacks

| Risk                             | Likelihood | Fallback                                                                                      |
| -------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| No Supabase/R2 keys by Day 1     | High       | Build against typed interfaces and visible config errors; do not fake data. Get keys first.   |
| GitHub Pages requirement         | High       | Marketing static on Pages + app on subdomain; or move whole app to Vercel/Cloudflare.         |
| Payment KYC not ready            | Medium     | Launch with test-mode billing clearly labelled; collect waitlist; enable live later.          |
| youPI-PG compliance/freeze risk  | High       | Do not use for launch. Use Razorpay/Stripe; keep youPI-PG as an experiment.                   |
| LLM/Whisper cost or keys missing | Medium     | Local faster-whisper + heuristic highlight fallback, labelled honestly.                       |
| Worker host absent               | High       | Run locally for demos; deploy to a small Linux VM by Day 13.                                  |
| Link ingestion breaks (ToS/auth) | Medium     | Upload-first launch; show “link intake coming soon” instead of a broken redirect.             |
| 15-day scope                     | High       | Cut editor, teams, auto-posting, Stripe, and advanced crop before cutting auth/upload/render. |

---

## 6. Definition of done

- [ ] A new user signs up with Google or email on the production domain.
- [ ] They upload a real video or submit a supported public link.
- [ ] The file lands in private R2; the API never proxies video bytes.
- [ ] A real worker job transcribes, selects moments, crops, captions, and renders.
- [ ] The dashboard shows real status and a playable clip with a signed URL.
- [ ] Credits are reserved/refunded correctly; the ledger reconciles.
- [ ] A test payment grants credits exactly once; replays are no-ops.
- [ ] Missing keys produce visible configuration errors, not fake success.
- [ ] Landing, signup, dashboard, and errors work at 390/768/1440.
- [ ] `typecheck`, `lint`, `build`, worker tests, and a browser smoke pass.
- [ ] No fake logos, metrics, testimonials, or unlabelled sample data.
- [ ] The founder can explain the architecture and rollback in one page.

---

## 7. Commands

```powershell
# web dev
$env:SKIP_ENV_VALIDATION='1'; pnpm --filter @clipmax/web dev --port 3200

# checks
pnpm --filter @clipmax/web typecheck
pnpm --filter @clipmax/web lint
$env:SKIP_ENV_VALIDATION='1'; pnpm --filter @clipmax/web build

# worker
python -m uv run --directory apps/worker pytest
python -m uv run --directory apps/worker ruff check .
python -m uv run --directory apps/worker mypy clipmax_worker

# database
pnpm db:link
pnpm db:push
pnpm db:types
```

## 8. What not to do

- Do not add Docker, Kubernetes, or a separate queue service.
- Do not build a fake dashboard with hardcoded clips and call it a product.
- Do not wire youPI-PG into checkout before its compliance and freeze risk are understood.
- Do not put the Next.js app on GitHub Pages and expect auth/webhooks to work.
- Do not spend Day 10 on a new hero if auth/upload/render are not real.
- Do not let the scope expand past the definition of done.
