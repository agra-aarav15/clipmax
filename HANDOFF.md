# ClipMax — Handoff

> **This file is no longer the source of truth.** [CLIPMAX.md](CLIPMAX.md) is the master plan and
> continuation file: current state, the frontend decision, the proof-first plan, evidence, and the
> working agreement. `PLAN.md` is kept only as historical context.

## Continue in a new chat

Paste this:

```text
You are continuing ClipMax, an AI video-repurposing SaaS in F:\ClipMax (Windows).
Read CLIPMAX.md completely before touching code, then PRODUCT.md, DESIGN.md,
docs/architecture.md, and docs/runbook.md. If the task is frontend, read
FRONTEND_PROMPT.md too. Run `git status` and `git log --oneline -5` first. Work only
on the next unchecked task in CLIPMAX.md §6, in the order given. Never invent
credentials, never fake a success state, never commit another agent's uncommitted
work, and never use `git add -A`. Verify with the CLIPMAX.md §8 commands and record
new evidence before claiming anything works.
```

## The one-paragraph version

ClipMax turns one long horizontal video into vertical 9:16 clips with burned word-level captions.
The **backend is code-complete and locally verified**: Supabase auth and Postgres, direct-to-R2
uploads, the real Python/FFmpeg worker, credit reservations, Razorpay subscriptions, rate limits,
cron renewal, legal pages, and a GitHub Pages preview. **Hosted Supabase is live and proven**
(project `eerqogsjvoswkqhhnhld`): six migrations, 28 functions, the auth trigger, RLS, and the
30-credit signup grant. A seventh hardening migration is locally verified and **not yet applied to
the hosted project**. R2 and Razorpay keys are still missing, so the upload → render → payment
path is unproven, and the browser auth round trip needs the hosted Site URL fixed. The critical path
is the hosted migration → R2 credentials → a real upload → a real render → a real test checkout.

## Frontend handoff

The founder **rejected** the cobalt/ice frontend. Track B is owned by an **external builder**, not
this repo's backend agent. The contract is [FRONTEND_PROMPT.md](FRONTEND_PROMPT.md).

- Working direction: **The Rundown** — light-first broadcast edit desk, warm paper and ink, one
  safety-orange signal, timecode rails, contact sheets, real clips, fully designed dark mode.
- The builder must first produce **5–10 coded, responsive references** with a scorecard and a
  recommendation. The founder reviews them; the final direction is locked in
  `REFERENCE_DECISION.md`.
- Then the builder executes **one full-app build**: landing, auth, studio, projects, results,
  billing, settings, legal, status, support, errors, and the static Pages preview.
- No fake data. Every sample project and clip is visibly labelled. Missing credentials produce an
  honest configuration state.
- The backend agent reviews integration and protects the API contracts. It does **not** rebuild the
  UI in parallel.
- The old six-direction board and the four `/lab` pages are historical. Do not reopen them.

## What to do next

1. Apply `supabase/migrations/20261026120000_backend_hardening.sql` to hosted Supabase and verify
   seven migrations / 30 functions **before** deploying the hardened checkout route.
2. Deliver `FRONTEND_PROMPT.md` to the builder and let it run the reference sprint.
3. Create the R2 bucket/token and fill `apps/worker/.env` plus the R2 values in
   `apps/web/.env.local`.
4. Add Razorpay **test** keys and plan id.
5. Set the Supabase Site URL to `http://localhost:3200` and allow
   `http://localhost:3200/auth/callback`, then prove Google and magic-link sign-in.
6. With credentials present, run Track A5/A6 and record the evidence in CLIPMAX.md §8.
