# ClipMax — Product Truth

> This file is the durable product context. If a claim is not in here, do not put it on the
> marketing site or in the product UI without checking with the founder first.

## One line

**Long video in. A week of clips out.**

ClipMax turns one long-form recording into a set of vertical, captioned clips that are ready to post.

## Who it is for

- Podcasters and interviewers with a back catalogue and no editing time.
- Course creators and webinar hosts who need short promos from long sessions.
- Small content teams and solo operators who want a repeatable short-form engine.
- Founders and experts who already publish long video but are invisible on Reels, Shorts, and TikTok.

The primary user is a **creator-operator**, not a enterprise media team. They care about speed,
taste, and not losing the master file.

## Problem

A 45-minute conversation contains a week of short-form content. Finding the moments, cutting them
cleanly, reframing a horizontal frame for a vertical feed, transcribing, captioning, and exporting is
a 3–6 hour editing job. Most creators either skip it or pay an editor per clip.

## Promise

Upload one source, or paste a supported public video link. ClipMax finds the strongest moments,
frames the speaker, burns readable word-level captions, and gives you vertical clips you can review
and download.

## Product principles

1. **Real states only.** No fake progress bars, fake testimonials, fake customer logos, or invented
   metrics. Sample projects are clearly labelled as samples.
2. **The master file is private.** Source video lives in a private R2 bucket. The browser uploads
   directly with short-lived presigned URLs; video bytes never proxy through the app server.
3. **Asynchronous by default.** Upload, transcribe, analyse, and render are real queue jobs. Closing
   the tab does not cancel the work.
4. **Credits are auditable.** 1 credit = 1 minute of source video, rounded up, minimum 1. Every
   debit and grant is an append-only ledger row written in a transaction.
5. **A good clip is a taste decision.** The product should explain why a moment was chosen, not just
   spit out a score. Hooks, boundaries, and framing must be reviewable.
6. **Fast first, broad later.** v1 is upload + supported public links, 9:16 output, burned captions,
   and a lightweight review/download flow. Teams, mobile apps, and a full NLE are not v1.

## Locked commercial model

| Plan    | Price                  | Credits     | Notes                                                        |
| ------- | ---------------------- | ----------- | ------------------------------------------------------------ |
| Free    | $0                     | 30 / month  | No card. Enough for one 15-minute source plus a little room. |
| Starter | $19 / ₹1,499 per month | 150 / month | 10 × 15-minute sources. Launch plan.                         |
| Pro     | Not launched           | —           | Only add when usage data justifies it.                       |

- 1 credit = 1 minute of source video, rounded up, minimum 1.
- Max source: 15 minutes, 500 MB, MP4 / MOV / WebM.
- Output: 1080 × 1920, H.264/AAC MP4, burned-in word-level captions.
- Payments are **not live** until a provider is connected and tested. The pricing UI must say so.

## Source intake

- **Upload:** direct-to-R2 presigned PUT. Real progress from XHR.
- **Link:** a public video URL. The landing page may capture the URL only if the studio can ingest
  it or gives an honest “not supported yet” error. Do not imply link ingestion works before the
  worker can fetch the source.
- YouTube ingestion was originally deferred. Given the paste-link promise on the landing page, the
  launch scope now includes **public-link ingestion through yt-dlp for supported sources**, with a
  clear unsupported-source error. Private, paid, or login-gated sources are out of scope unless
  cookies are explicitly supplied by the user.

## What “hard-coded backend” means here

The founder wants a backend that behaves like a real company, not a mocked UI. That means:

- Real Supabase Auth and RLS, or Auth0 with a verified Supabase JWT bridge.
- Real Postgres rows, real queue leases, real R2 object keys, and real worker output.
- Seeded demo content is allowed only when labelled **sample** and separated from a user’s data.
- If a credential is missing, the UI shows a visible configuration/error state. It never shows a
  fake success.

## Non-goals for launch

- Teams, organisations, roles, and shared billing.
- Native mobile apps.
- Live streaming ingestion.
- A full timeline editor or multi-track audio.
- Auto-posting to social platforms.
- A public clip marketplace.

## Success metrics

- **Activation:** % of signups that upload or submit a source.
- **Time to first clip:** median seconds from source ready to first playable render.
- **Render success:** completed jobs / claimed jobs.
- **Retention:** week-2 return rate for users with at least one completed project.
- **Conversion:** free → Starter within 14 days.
- **Trust:** support tickets about lost files, double charges, or unclear status = zero.

## Brand in one sentence

A cutting room after midnight: black, precise, a little cinematic, and obsessed with the moment the
clip lands.

## Resolved decisions (23 Oct 2026)

- **Palette:** cobalt `#0047AB` + ice `#89CFF0`. Cobalt for filled actions, ice for readable
  accents, focus, and glow.
- **Auth:** Supabase Auth (email magic link + Google).
- **Hosting:** full Next.js app on Vercel or Cloudflare with a custom domain. GitHub Pages cannot
  host the auth callback, API routes, or webhooks. Domain/DNS is still open.
- **Payments:** Razorpay first for the India launch, with a provider interface for Stripe later.
  youPI-PG is not the launch path because it is a self-hosted UPI/COD gateway with bank-SMS parsing,
  not a card/subscription processor; it carries compliance and freeze risk.
- **Backend:** real Supabase + R2 + worker. A seed project is allowed only when visibly labelled
  sample.
- **Link intake:** public-link ingestion through yt-dlp for supported sources, with honest errors
  for unsupported/private URLs.
- **Social access:** public Reels via URL; Telegram via Desktop JSON export. Live Telethon reading
  remains optional and requires a persistent process.

## Still open

- Domain name and DNS access.
- Whether the business entity can support Razorpay and Stripe at launch.
- Which AI providers are funded for launch (local faster-whisper is the fallback).
