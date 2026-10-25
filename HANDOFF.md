# ClipMax — Handoff

> **This file is no longer the source of truth.** [CLIPMAX.md](CLIPMAX.md) is the master plan and
> continuation file: current state, the design decision, the proof-first plan, evidence, and the
> working agreement for parallel agents. `PLAN.md` is kept only as historical context.

## Continue in a new chat

Paste this:

```text
You are continuing ClipMax, an AI video-repurposing SaaS in F:\ClipMax (Windows).
Read CLIPMAX.md completely before touching code, then PRODUCT.md, DESIGN.md,
docs/architecture.md, and docs/runbook.md. Run `git status` and `git log --oneline -5`
first. Work only on the next unchecked task in CLIPMAX.md §6, in the order given.
Never invent credentials, never fake a success state, never commit another agent's
uncommitted work, and never use `git add -A`. Verify with CLIPMAX.md §8 commands and
record new evidence before claiming anything works.
```

## The one-paragraph version

ClipMax turns one long horizontal video into vertical 9:16 clips with burned word-level captions.
The code is complete through Supabase auth, direct-to-R2 uploads, the real FFmpeg worker, credits,
Razorpay billing, legal pages, and a GitHub Pages design preview. **Hosted Supabase is live and
proven** (project `eerqogsjvoswkqhhnhld`): six migrations, 28 functions, the auth trigger, RLS, and
the 30-credit signup grant. R2 and Razorpay keys are still missing, so the upload → render → payment
path is unproven. The design is **not final**: six directions are on the board, four are full pages
in `/lab`, and one must be chosen before Track B starts. The critical path is now R2 credentials →
a real upload → a real render → a real test checkout.
