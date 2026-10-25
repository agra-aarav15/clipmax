# ClipMax — Master Plan & Continuation File

> **Read this file first.** It is the single source of truth for what ClipMax is, what is already
> built, what is proven, what is blocked, and what happens next. If a chat, an agent, or a
> contributor disappears, this file is enough to continue without asking anyone.
>
> Last updated: **25 October 2026** · Owner: Aarav Agrawal · Repo: `F:\ClipMax` (public:
> `github.com/agra-aarav15/clipmax`) · Live design preview: `https://aarav.runs-on.dev/clipmax/`
> · Direction board: `https://aarav.runs-on.dev/clipmax/directions/`

---

## 0. How to continue (for a new chat or a new agent)

Paste this into a fresh session:

```text
You are continuing ClipMax, an AI video-repurposing SaaS in F:\ClipMax (Windows).
Read CLIPMAX.md completely before touching code, then PRODUCT.md, DESIGN.md,
docs/architecture.md, and docs/runbook.md. Run `git status` and `git log --oneline -5`
first. Work only on the next unchecked task in CLIPMAX.md §6, in the order given.
Never invent credentials, never fake a success state, never commit another agent's
uncommitted work, and never use `git add -A`. Verify with the commands in §8 and
record new evidence in §8 before claiming anything works.
```

**Read order:** this file → `PRODUCT.md` (product truth) → `DESIGN.md` (visual contract) →
`docs/architecture.md` (contracts and invariants) → `docs/runbook.md` (hosted setup) → code.

**Where the work actually stands:** the product is **code-complete** through auth, direct-to-R2
upload, the real FFmpeg worker, credits, billing, legal pages, and a GitHub Pages design preview.
**Hosted Supabase is now live and proven** (schema, triggers, RLS, signup credits). R2 and Razorpay
credentials are still missing, so the upload → render → payment path is not yet proven. The design
is **not final**: six directions are presented on the board and four exist as full pages in `/lab`;
one must be chosen before the landing page is rebuilt.

---

## 1. Product truth (short)

**One line:** Long video in. A week of clips out.

ClipMax turns one long horizontal recording into vertical 9:16 clips with word-level burned
captions, a hook line, a virality score, and a reviewable reason for the cut.

- **User:** solo creator-operators, podcasters, interviewers, course and webinar hosts with a back
  catalogue and no editing time.
- **Promise:** upload one source (max 15 min / 500 MB) or paste a supported public link → 3–5 real
  vertical clips, ready to review and download.
- **Output:** 1080 × 1920, H.264/AAC MP4, burned-in word-level captions, center crop.
- **Credits:** 1 credit = 1 minute of source, rounded up, minimum 1.
- **Pricing:** Free 30 credits/month; Starter $19 / ₹1,499 per month for 150 credits. Pro is not
  launched. Payments are not live until Razorpay is configured and KYC is complete.
- **Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Supabase (Postgres/Auth/RLS),
  Cloudflare R2 (private, presigned PUT), Python 3.12 worker on `uv` + system FFmpeg, Razorpay.
  **No Docker.**
- **Non-goals for launch:** teams, native apps, live streaming, a full NLE, auto-posting, public
  marketplace, face tracking. Do not claim any of them.

Full detail: `PRODUCT.md`. Pricing and limits are locked; changing them is a product decision.

---

## 2. The design decision (blocking)

Six complete directions are on the board, each with palette, type, motion, and a hero artboard:

| #   | Direction        | Mood                                         | Palette                              | Signature                                          |
| --- | ---------------- | -------------------------------------------- | ------------------------------------ | -------------------------------------------------- |
| 01  | **Cutting Room** | Lamplit edit bay, film strip, quiet confidence | `#0B0908` `#F3EBDD` `#FFA24B` `#9BE7FF` | Pinned 16:9 frame splits into three 9:16 panels    |
| 02  | **Signal**       | Swiss precision, one electric charge          | `#08090A` `#155EEF` `#9BE7FF` `#F2F1EC` | Scroll-linked waveform is the page spine           |
| 03  | **Paper Edit**   | Printed magazine, ink and red marker          | `#F2EDE3` `#141210` `#E2402C` `#6B6257` | Marker strokes draw, contact sheet settles         |
| 04  | **Control Room** | Operator console, phosphor, real machinery    | `#050607` `#C8FF5A` `#8A9682` `#E7E9E4` | Live log types in; progress rail fills             |
| 05  | **Gallery**      | Dark room, museum wall, work speaks           | `#0E0E0F` `#EDE7DB` `#A9A29A` `#155EEF` | Clip wall drifts; placards fade in                 |
| 06  | **Hook Machine** | The product performs its own feature          | `#000000` `#F4F2ED` `#D8FF3E` `#FF5C39` | Headline snaps in like burned captions             |

**Recommendation: Reel One = Cutting Room × Hook Machine.** Keep the warm cutting room for the
page, borrow kinetic captions for the hero only, and shift the palette to warm black + bone +
sodium amber, with ice for data and focus. Cobalt is retired as the brand colour if this is chosen;
that is a recorded decision, not a tweak.

**Test them, do not imagine them.** Four of the six now exist as complete, responsive landing pages
in the design lab (static, real copy, real pricing, no mock product flows):

- `https://aarav.runs-on.dev/clipmax/lab/cutting-room/`
- `https://aarav.runs-on.dev/clipmax/lab/paper-edit/`
- `https://aarav.runs-on.dev/clipmax/lab/hook-machine/`
- `https://aarav.runs-on.dev/clipmax/lab/gallery/`

Open each at 1440 and 390, scroll the whole page, and pick the one that moves you. The board at
`/directions` remains the reference sheet for all six.

**Status:** awaiting the founder's pick. Until it is picked, **do not rebuild the product's landing
page**; the lab pages are the test surface. Everything else (credentials, worker proof, hardening)
can proceed in parallel. If no pick is made by the start of the design workstream, Reel One is the
default.

When a direction is picked, update: this section, `DESIGN.md` (palette, type, motion, component
rules), `apps/web/src/app/globals.css` (tokens), and the decision log in §10. One direction only.
Do not blend three.

---

## 3. Where the build actually is

### 3.1 Live surfaces

| Surface             | URL                                          | What it is                                                                 |
| ------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| Design preview      | `https://aarav.runs-on.dev/clipmax/`         | Static GitHub Pages build of the real landing page from `apps/site`        |
| Direction board     | `https://aarav.runs-on.dev/clipmax/directions/` | The six references in §2                                                |
| Design lab          | `https://aarav.runs-on.dev/clipmax/lab/`      | Four complete landing pages to test and feel                            |
| Repository          | `https://github.com/agra-aarav15/clipmax`    | Public, `main`, GitHub Actions CI + Pages                                  |
| Full product        | not deployed                                 | Needs hosted credentials and a Node host; Pages cannot run it              |

### 3.2 Implemented and committed (code-complete)

- **Hosted Supabase is live**: project `eerqogsjvoswkqhhnhld` (Tokyo), all six migrations applied,
  28 public functions, the auth-user trigger, 8 RLS policies, and the six migration versions
  recorded in `supabase_migrations.schema_migrations`. Local web credentials are in
  `apps/web/.env.local` (ignored by git). R2 and Razorpay credentials are still absent.
- Monorepo (`apps/web`, `apps/worker`, `apps/site`, `packages/shared`, `supabase`, `scripts`), CI,
  Turbo, shared contracts, ESLint/Prettier/TypeScript, Python `uv` + ruff + mypy.
- Postgres schema with RLS, profiles, projects, jobs, clips, wallets, append-only ledger,
  subscriptions, webhook events, credit reservations, rate limits, monthly renewal, hardening RPCs.
  Six migrations in `supabase/migrations/`.
- Supabase Auth: Google + email magic link, PKCE callback, session-refresh proxy, honest
  missing-configuration states.
- Direct-to-R2 presigned upload with real XHR progress, HeadObject verification, credit
  reservation/settle/refund, retry, delete.
- Public-link intake through yt-dlp with an allowlist and honest unsupported/private errors.
- Project results page: real job timeline, signed clip playback, thumbnails, word-level transcript,
  downloads, retry, delete, 5-second polling while active.
- Worker: claim/lease, download, ffprobe, audio extraction, transcription (OpenAI/Groq/local),
  highlight selection (LLM or labelled heuristic), 9:16 render with burned ASS captions, thumbnail,
  R2 publish, DB state, permanent-error refunds, `/healthz` with FFmpeg/libass.
- Razorpay: checkout, server-stored subscription ownership, signature verification, raw-body HMAC
  webhook, idempotent per-charge grants, state transitions, billing and ledger pages.
- Rate limits (Postgres fixed window), `CRON_SECRET` monthly free renewal, `/api/health` readiness.
- Studio shell, projects index, settings (profile, export, account deletion), legal pages
  (privacy, terms, refund, support, status), sitemap, robots, OG image.
- Landing page in the cobalt + ice cinematic system with GSAP/Lenis/ScrollFloat motion and
  reduced-motion guards. **This will be rebuilt after the direction pick.**

### 3.3 Verified locally (evidence in §8)

- Web: typecheck, lint, production build.
- Worker: 26 pytest tests, ruff, mypy `--strict`, all green on 25 Oct 2026.
- Media: a synthetic source renders 1080×1920 H.264/AAC with burned ASS captions; ffprobe confirms.
- Razorpay HMAC: valid and tampered cases.
- SQL: all six migrations apply to PostgreSQL 18 (PGlite with stubbed Supabase auth) plus 100
  executable checks (grant once, renewal, RLS isolation, reserve/settle/refund idempotency, webhook
  claim/retry, checkout serialization, worker lease reclaim).
- Pages: the real landing page, direction board, design lab, and four concepts build statically
  under `/clipmax`, no console errors, no horizontal overflow at 390 and 1440.
- Hosted Supabase (25 Oct 2026): six migrations applied; 28 functions, 7 triggers (including
  `on_auth_user_created`), and 8 RLS policies exist. Creating a user through the Admin API created
  a `profiles` row, a `credit_wallets` row with 30 credits, and a `grant_signup` ledger entry.
  Anonymous REST requests to `profiles` returned `[]`; the service role saw the row. Both QA users
  were deleted and the cascade removed their profile, wallet, and ledger rows.
- `/api/health` against the hosted project returns `supabase: true`, `cron: true`, `r2: false`,
  `billing: false`, status 503. That is the correct configured/incomplete state.

### 3.4 Not verified / blocked

- **R2 and Razorpay are still unconfigured.** No `apps/worker/.env`, no R2 keys, no Razorpay keys.
  Upload signing, real transcription, a real render, and a test checkout cannot run until they
  exist. Supabase hosted auth is now proven at the API/DB level (see §3.3).
- The browser magic-link callback has not been exercised because the hosted project's Site URL
  still points at `localhost:3000`; the app runs on `localhost:3200`. Set the Site URL and allowed
  redirect URL in Supabase before testing the full sign-in flow.
- No domain/DNS, no confirmed production host, no deployed worker VM.
- No real sample renders, which the Gallery direction (and credible screenshots) require.
- No transactional email provider, no error monitoring, no pgTAP, no analytics.
- Razorpay live KYC and business details are not filled in; support relies on GitHub Issues unless
  `SUPPORT_EMAIL` is set.
- Center crop only, not face tracking. Copy must not imply face tracking.
- The landing page's lower sections are coherent with the current system but will be replaced when
  the direction is chosen.

---

## 4. Architecture and repository map

```text
Browser
  ├─ Next.js app (marketing + studio + API routes)  ── Supabase Auth (cookies)
  ├─ direct PUT ──► Cloudflare R2 (private, presigned, 15 min)
  └─ Supabase (Postgres + RLS) ◄── job rows / clips / ledger
                         ▲
                Python worker (uv + system FFmpeg, no Docker)
                  claim → download → probe → audio → transcribe → highlights
                  → 9:16 crop + ASS captions → thumbnail → R2 → DB
```

Invariants that must not be broken:

1. Video bytes never proxy through the Next.js server.
2. Only SQL functions mutate wallets/ledger; clients never send balances or plan state.
3. Every job claim is a lease with an owner; a dead worker's lease is reclaimable.
4. A credit reservation settles or refunds exactly once, including retries.
5. A webhook is verified from the raw body, claimed before side effects, and idempotent per charge.
6. RLS is the tenant boundary; service-role access exists only in server/worker code.
7. No fake UI. Sample content is labelled. Missing credentials produce a real error state.

**Repo map**

```text
apps/web/          Next.js 16 app: landing, signup, studio, API routes, legal
apps/worker/       Python worker: pipeline, media, transcribe, highlights, supabase, r2, service
apps/site/         Static GitHub Pages preview (reuses the real landing page + direction board)
packages/shared/   Types, credit rules, statuses, API contracts
supabase/          Six migrations, RLS, SQL functions
scripts/           verify-sql.mjs (PGlite checks), verify.ps1, dev-worker.ps1
docs/              architecture.md, runbook.md
.opencode/skills/  Local design/engineering skills (read before using)
```

**Key files**

| Area             | File                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| Design tokens    | `apps/web/src/app/globals.css`                                       |
| Landing          | `apps/web/src/app/page.tsx`, `components/landing/*`                  |
| Direction board  | `apps/site/src/app/directions/page.tsx`                              |
| Auth             | `apps/web/src/app/auth/callback/route.ts`, `src/proxy.ts`            |
| Upload / presign | `apps/web/src/app/api/uploads/presign/route.ts`, `src/lib/r2.ts`     |
| Projects API     | `apps/web/src/app/api/projects/**`                                   |
| Billing          | `apps/web/src/app/api/billing/**`, `api/webhooks/razorpay/route.ts`  |
| Worker pipeline  | `apps/worker/clipmax_worker/pipeline.py`, `media.py`, `highlights.py`|
| Queue / credits  | `supabase/migrations/20261023120000_init.sql` and later migrations    |
| Contracts        | `packages/shared/src/{api,credits,status}.ts`                        |
| Runbook          | `docs/runbook.md`                                                    |

---

## 5. Environment and accounts

Copy `.env.example` → `apps/web/.env.local` (web) and → `apps/worker/.env` (worker). **Never
commit either file.** Only `NEXT_PUBLIC_*` reaches the browser; never prefix a secret with it.

**Web (`apps/web/.env.local`):**
`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_BUCKET`, `R2_ENDPOINT` (optional), `R2_PRESIGN_PUT_TTL_SECONDS`, `R2_SIGNED_GET_TTL_SECONDS`,
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
`RAZORPAY_PLAN_STARTER_MONTHLY`, `CRON_SECRET`.

**Worker (`apps/worker/.env`):**
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `R2_*`, `WHISPER_PROVIDER`, `WHISPER_MODEL`,
`OPENAI_API_KEY` / `GROQ_API_KEY`, `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, `WORKER_ID`,
`WORKER_CONCURRENCY`, `MAX_SOURCE_DURATION_SECONDS`, `MAX_SOURCE_BYTES`, `FFMPEG_*`, `RENDER_*`,
`LOG_LEVEL`, optional `SOURCE_COOKIES_FILE`.

**Hosted Supabase (live):** project ref `eerqogsjvoswkqhhnhld`, region `ap-northeast-1`, URL
`https://eerqogsjvoswkqhhnhld.supabase.co`. Six migrations applied and recorded in
`supabase_migrations.schema_migrations`. `apps/web/.env.local` holds the project URL, anon key,
service-role key, and a local `CRON_SECRET`; the file is gitignored. The service-role key is used
only by server routes. The hosted Site URL must be changed from `http://localhost:3000` to
`http://localhost:3200`, and `http://localhost:3200/auth/callback` allowlisted, before the browser
magic-link flow can be tested.

**Only the founder can do these:** create/own the Supabase project and R2 bucket, complete Razorpay
KYC, buy and point the domain, and approve Google OAuth branding. The founder's Google account is
`officialclipmax@gmail.com`; **never store its password in the repo, this file, a chat, or a
script.** Use it interactively in the browser only, and prefer creating service accounts/API keys
per provider instead of sharing the account password.

**Local commands**

```powershell
pnpm install
$env:SKIP_ENV_VALIDATION='1'; pnpm --filter @clipmax/web dev --port 3200
pnpm --filter @clipmax/web typecheck
pnpm --filter @clipmax/web lint
$env:SKIP_ENV_VALIDATION='1'; pnpm --filter @clipmax/web build
pnpm db:verify
python -m uv run --directory apps/worker pytest
python -m uv run --directory apps/worker ruff check .
python -m uv run --directory apps/worker mypy clipmax_worker
```

Use `http://localhost:3200`, not `127.0.0.1`, for local auth redirects.

---

## 6. The plan

### 6.0 What changed from the old 15-day plan

The day-by-day plan in `PLAN.md` was written before the code existed. It is now misleading: it
describes building features that are already built, and it leaves the actual critical path (proof
against hosted services, a final design, deployment) as a footnote. This plan replaces it as the
execution source of truth. `PLAN.md` remains as history.

Three tracks run in this order of priority:

- **Track A — Prove it (critical path).** Credentials, migrations, a real upload, a real render, a
  real checkout. Nothing else matters until a real video becomes a real clip on the hosted stack.
- **Track B — Make it undeniable (design).** Lock one direction, rebuild the landing, signup, studio
  shell, results, and billing to that contract. Starts only after the direction pick.
- **Track C — Make it safe to launch.** Email, monitoring, domain, legal review, accessibility,
  performance, rollback, and a monitored support inbox.

### Track A — prove the product (founder + agent)

**Status 25 Oct:** A1–A4 done against hosted Supabase. A5 blocked by R2. A6 blocked by Razorpay.
A7's cron secret is set locally. A8 is being recorded as evidence lands.

| ID  | Task                                  | Acceptance                                                                                              | Owner   |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------- |
| A1  | Create Supabase project + R2 bucket    | Project URL, anon key, service role key, bucket, R2 token exist; bucket is private; CORS set for app origins | Founder |
| A2  | Fill env files, never commit           | `apps/web/.env.local` and `apps/worker/.env` present; `/api/health` returns 200 `ready:true`              | Founder + agent |
| A3  | Apply six migrations and verify        | `pnpm db:verify` green; `pnpm db:push` applies all six; profile trigger, RLS, and grants exist in hosted DB | Agent |
| A4  | Auth round trip                        | Google sign-in and magic link both land on `/dashboard` with a real profile row; anonymous `/dashboard` redirects | Agent |
| A5  | Real upload → real job                 | 60–120 s MP4 uploads with progress, project becomes `ready`, worker claims it, clip renders, download plays | Agent |
| A6  | Razorpay test checkout + replay        | One checkout grants 150 credits exactly once; webhook replay is a no-op; signature tamper is rejected      | Agent |
| A7  | Cron + rate limits                     | `/api/cron/renew-free-credits` rejects missing secret; run twice, second is a no-op; limiter blocks abuse  | Agent |
| A8  | Record evidence                        | Screenshots/log references and results added to §8; any failure has an owner and a next action           | Agent |

### Track B — design rebuild (after the pick)

| ID  | Task                     | Acceptance                                                                                              |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| B1  | Lock the direction       | §2 updated; `DESIGN.md` rewritten for the chosen palette, type, motion, and components; the winning `/lab` page becomes the base |
| B2  | Tokens and primitives    | `globals.css` tokens, focus ring, grain, buttons, inputs, cards, badges, dialogs match the direction     |
| B3  | Landing hero             | Headline, intake (link + upload), proof strip, and one signature moment at 1440×1000 and 390×844         |
| B4  | Landing body             | Product evidence, workflow, system/trust, pricing, final CTA; one idea per screen; no fake metrics        |
| B5  | Signup                   | Split layout, Google + magic link, preserved source intent, specific error states                         |
| B6  | Studio shell             | Nav, credit meter, mobile menu, empty state, real project rows; calm and fast                            |
| B7  | Project results          | Job timeline, clip cards/player, transcript, download, retry, delete; honest processing states           |
| B8  | Billing + settings       | Plan, ledger, upgrade/cancel, profile, export, deletion, all in the new system                           |
| B9  | Legal + errors           | Privacy, terms, refund, support, status, 404, signup errors, configuration states                        |
| B10 | Motion and accessibility | One signature scroll moment; `prefers-reduced-motion`; keyboard pass; WCAG AA contrast; no CLS regressions |

### Track C — launch safety

| ID  | Task                    | Acceptance                                                                                      |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| C1  | Domain + host            | One canonical origin; HTTPS; redirects for `www`; Supabase redirect URLs and R2 CORS updated     |
| C2  | Worker deployment       | systemd unit on a Linux VM, restart on failure, `/healthz` green, lease reclaim proven            |
| C3  | Transactional email     | Signup/magic-link and receipt mail arrive from the branded domain; choose the provider by research |
| C4  | Monitoring + analytics  | Error monitoring on web and worker; uptime check; privacy-respecting product analytics           |
| C5  | Legal + support         | Reviewed privacy/terms/refund, real support inbox, working cancellation and deletion paths         |
| C6  | Performance + a11y gate | Lighthouse ≥ 90 performance/accessibility on the landing and studio at 390 and 1440               |

### Order and schedule (target launch: Fri 6 Nov 2026)

| Date        | Work                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- |
| Sun 25 Oct  | Direction board shipped. Founder picks a direction in parallel with A1/A2.             |
| Mon 26 Oct  | A1–A3 green. B1–B2 begin the moment the direction is locked.                            |
| Tue 27 Oct  | A4–A5: first real upload and first real render. B3–B4 landing.                         |
| Wed 28 Oct  | A6–A7 billing proof. B5–B6 signup and studio.                                          |
| Thu 29 Oct  | A8 recorded. B7–B8 results and billing surfaces.                                       |
| Fri 30 Oct  | B9–B10 finish, full browser pass, fix list only.                                       |
| Sat 31 Oct  | C1–C2 domain, host, worker deployed. Buffer for slips.                                 |
| 1–4 Nov     | C3–C6, final QA, real smoke pass on production, rollback rehearsal.                    |
| 5 Nov       | Launch gate review. Only fixes, no new features.                                       |
| 6 Nov       | Launch if every gate in §7 is green; otherwise keep the preview and publish the reason.|

### Explicitly out of scope until after launch

Teams and shared billing, Pro tier, auto-posting to social platforms, a timeline editor, face
tracking, mobile apps, marketplace, live stream ingestion. Do not start these to "polish".

---

## 7. Definition of done (launch gate)

- A new user signs up with Google or a magic link and sees a real, empty studio.
- They upload a 60–120 s video (or paste a supported link), see real progress, and receive at least
  one playable 1080×1920 clip with burned word-level captions.
- They can download the clip, retry a failed job, delete a project, and see their credit ledger.
- A Razorpay **test** checkout grants exactly 150 credits once; a replayed webhook changes nothing.
- Free credits renew once per month, and the cron route is protected.
- Every screen at 390 / 768 / 1440: no horizontal scroll, no console errors, no clipped headings,
  no fake data, visible focus, reduced-motion safe.
- `/api/health` and the worker `/healthz` are green; `/status` reflects reality.
- Legal pages and a monitored support inbox exist; pricing copy says exactly what is live.
- Rollback is written down and rehearsed: previous deployment, env, and worker restart.

---

## 8. Verification and evidence

Run these before claiming anything works:

```powershell
pnpm typecheck
pnpm lint
$env:SKIP_ENV_VALIDATION='1'; pnpm --filter @clipmax/web build
pnpm db:verify
python -m uv run --directory apps/worker pytest
python -m uv run --directory apps/worker ruff check .
python -m uv run --directory apps/worker mypy clipmax_worker
$env:MSYS_NO_PATHCONV='1'; $env:PAGES_BASE_PATH='/clipmax'; pnpm --filter @clipmax/site build:pages
```

| Date       | Claim                                                      | How it was proven                                              |
| ---------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| 25 Oct 26  | Web typecheck, lint, production build                      | `pnpm typecheck`, `pnpm lint`, `next build` — all exit 0        |
| 25 Oct 26  | Worker tests, lint, strict types                           | 26 pytest passed; ruff clean; mypy no issues (11 files)         |
| 25 Oct 26  | Static site and direction board export                     | `build:pages` for `/clipmax`, 6 routes, no errors               |
| 25 Oct 26  | Direction board has no horizontal overflow at 390 / 1440   | Browser measurement: `scrollWidth <= innerWidth`                |
| 25 Oct 26  | Four lab concepts have no horizontal overflow at 390        | Browser measurement on all four routes                          |
| 25 Oct 26  | Hosted Supabase schema, triggers, and RLS                  | 6 migrations, 28 functions, `on_auth_user_created`, 8 policies   |
| 25 Oct 26  | Signup grant fires on hosted auth                          | Admin-created user → profile + 30-credit wallet + ledger row    |
| 25 Oct 26  | RLS hides other tenants from anon                          | Anon REST `profiles` returned `[]`; service role saw the row     |
| 25 Oct 26  | Web reaches hosted Supabase                                | `/api/health` → `supabase:true`, 503 because R2/billing missing  |
| 24 Oct 26  | Six migrations apply + 100 SQL checks                      | `pnpm db:verify` (PGlite, stubbed auth) — 100 checks passed     |
| 24 Oct 26  | Synthetic 1080×1920 render with burned captions            | ffmpeg + ffprobe on a generated source                          |
| 23 Oct 26  | Razorpay HMAC valid/tampered cases                         | Local verification tests                                        |

**Not proven yet — do not describe as working:** hosted migrations/auth, R2 upload/signing, real
transcription, Razorpay test webhook, production deployment, email delivery, any uptime claim.

Add a row here every time a hosted claim becomes true. A claim without a row is a guess.

---

## 9. Risks and open decisions

| Topic                | Status / risk                                                              | Owner   |
| -------------------- | -------------------------------------------------------------------------- | ------- |
| Design direction     | Six options, none chosen. Blocks Track B. Reel One is the default.          | Founder |
| Credentials          | Nothing hosted has run. Biggest launch risk.                                | Founder |
| Domain + hosting     | Not purchased; Pages cannot host the app.                                   | Founder |
| Razorpay KYC         | Live payments blocked until business details and KYC are complete.          | Founder |
| Sample footage       | No real renders; Gallery and screenshots depend on it.                      | Founder |
| AI budget            | Whisper/LLM spend unknown; local whisper is the no-key fallback.            | Founder |
| Legal review         | Pages exist but are not lawyer-reviewed.                                    | Founder |
| Parallel agents      | Two agents may edit the same checkout. Enforce §10 ownership and `git status`. | Both  |
| Center crop          | Acceptable for v1; copy must not claim face tracking.                       | Agent   |
| Monitoring           | None. Errors would be invisible in production.                             | Agent   |

---

## 10. Working agreement (two agents, one checkout)

1. **One owner per workstream.** Track A (backend proof), Track B (design), Track C (ops) do not
   overlap in the same files at the same time. Announce which track you are on in the commit/PR.
2. **Before editing:** `git status`, `git log --oneline -5`, and read the current file. Do not
   overwrite another agent's uncommitted work.
3. **Staging:** stage explicit paths only. `git add -A` and `git commit -a` are forbidden.
4. **Shared files** (`globals.css`, `layout.tsx`, `DESIGN.md`, `CLIPMAX.md`, `README.md`) belong to
   the owner of the current track at that moment. Change one at a time.
5. **Commit small and often** with a clear reason, then push. The remote is the only durable memory
   across chats. Never rewrite published history or force-push `main`.
6. **Update this file** when a decision lands: §2 for design, §6 checkboxes for progress, §8 for
   evidence, §10 for the decision log. A decision that is not written here did not happen.
7. **Verification beats confidence.** Run the commands. If something cannot be verified, write it
   as unverified in §8 rather than implying it works.
8. **No secrets in the repo, chat, screenshots, or commit messages.** `.env*` files are ignored;
   keep them that way.

---

## 11. Decision log

| Date       | Decision                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------ |
| 23 Oct 26  | Product scope, pricing, credits, and stack locked (`PRODUCT.md`).                                 |
| 23 Oct 26  | Palette: cobalt + ice; auth: Supabase; payments: Razorpay; hosting: full Next.js app.            |
| 24 Oct 26  | Vertical slice completed through billing, credits, hardening, legal pages.                       |
| 25 Oct 26  | Published the real landing page and a six-direction design board to GitHub Pages.                |
| 25 Oct 26  | Replaced the 15-day build plan with this proof-first plan; `PLAN.md` kept as history.            |
| 25 Oct 26  | Design direction **pending**. Reel One (Cutting Room × Hook Machine) recommended as default.     |
| 25 Oct 26  | Published four full landing concepts in `/lab` (Cutting Room, Paper Edit, Hook Machine, Gallery). |

---

## 12. Immediate next actions (in order)

1. **Founder:** walk the four pages in `/lab`, pick one name, and say it. (Default: Reel One.)
2. **Founder:** create a Cloudflare R2 bucket and token, then put the values in `apps/worker/.env`
   and `apps/web/.env.local`; add Razorpay **test** keys when ready. Supabase is done.
3. **Agent:** set the Supabase Site URL to `http://localhost:3200` and allow
   `http://localhost:3200/auth/callback`, then prove the browser sign-in flow.
4. **Agent:** with R2 present, run A5 (real upload → real render); with Razorpay present, run A6.
5. **Agent:** when the direction is named, execute B1–B10 without waiting for Track A to finish.
6. **Both:** keep this file current; it is the handoff.
