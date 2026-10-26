# ClipMax Frontend Rebuild: Master Prompt

> Paste this entire document into the builder. Do not summarize it, and do not skip the reference
> phase. It is the brief, the design contract, and the acceptance test.
>
> Works with Gemini Antigravity, GPT 6.1 Soul / Omni Rush, or any coding agent that has the
> repository and can run the verification commands. The builder owns the frontend. The backend is
> already built and must not be reinvented.

---

## 0. The assignment

Rebuild the entire ClipMax frontend inside the existing monorepo (the repository root; on the
founder's machine, `F:\ClipMax`).

ClipMax is a real AI video-repurposing SaaS: a long horizontal recording goes in, and vertical 9:16
clips with burned word-level captions come out. The backend is real: Supabase auth and Postgres,
direct-to-Cloudflare-R2 uploads, a Python/FFmpeg worker, credit reservations, and Razorpay
subscriptions. The frontend must feel like the working product, not a concept page wrapped around a
fake dashboard.

The current UI has been rejected by the founder and the team. It is too dark and artsy, too generic,
too much like a mockup, and its hierarchy is weak. Do not preserve it. Do not start from the four
`/lab` concepts either; they are historical exploration, not the final direction.

Deliver in two phases:

1. **Reference sprint:** 5 to 10 complete, coded UI directions, each with a landing hero, a studio
   overview, and a component strip. Show them as a contact sheet with a scorecard and a clear
   recommendation.
2. **Final build:** one direction, executed across the full app: landing, auth, studio, projects,
   results, billing, settings, legal, status, support, errors, and the static GitHub Pages preview.

Do not blend three directions. Pick one and finish it.

---

## 1. Read this before touching code

Read, in this order:

1. `PRODUCT.md` - product truth, pricing, limits, non-goals.
2. `CLIPMAX.md` - current state, proof, blockers, working agreement.
3. `docs/architecture.md` - backend contracts and invariants.
4. `docs/runbook.md` - hosted setup and smoke pass.
5. The existing `apps/web` routes and components, especially:
   - `apps/web/src/app/page.tsx`
   - `apps/web/src/app/signup/page.tsx`
   - `apps/web/src/app/(app)/dashboard/**`
   - `apps/web/src/components/studio/**`
   - `apps/web/src/components/layout/**`
   - `apps/web/src/app/globals.css`
   - `apps/web/src/lib/supabase/**`
   - `apps/web/src/app/api/**`
6. The competitor reference pack: `ClipMax-competitor-UI-reference-pack.zip` (39 screenshots,
   supplied alongside this brief). It is gitignored: do not commit it.

Then run:

```powershell
git status
git log --oneline -5
pnpm install
pnpm typecheck
pnpm lint
```

Do not commit another agent's uncommitted work. Stage explicit paths only. `git add -A` is
forbidden.

---

## 2. Product truth (do not invent around this)

### One line

**Long video in. A week of clips out.**

### Who it is for

Solo creator-operators, podcasters, interviewers, course creators, and webinar hosts with a back
catalogue and no editing time. Not enterprise media teams. Not a full NLE.

### What the product actually does

- **Input:** upload MP4, MOV, or WebM up to **15 minutes** and **500 MB**, or paste a supported
  public link.
- **Supported link hosts:** YouTube, Instagram, TikTok, Vimeo, X/Twitter, Facebook, LinkedIn,
  Twitch. Private, paid, or login-gated links are out of scope.
- **Output:** 3 to 5 vertical clips per source, **1080 x 1920**, H.264/AAC MP4, center crop, burned
  word-level captions, a hook line, a virality score, and a reviewable reason for the cut.
- **Credits:** 1 credit = 1 minute of source, rounded up, minimum 1. A 15-minute source costs 15
  credits. Up to 15 credits are held at initiate, settled after ffprobe, refunded on permanent
  failure.
- **Plans:** Free: 30 credits/month, no card. Starter: $19 / INR 1,499 per month for 150 credits.
  Pro is not launched.
- **Auth:** Google OAuth and email magic link. No passwords.
- **Storage:** private Cloudflare R2. The browser uploads directly with a short-lived presigned URL.
  Video bytes never proxy through the Next.js server.
- **Billing:** Razorpay subscriptions. Credits are granted only by a verified webhook, never by the
  browser callback.

### What is not in this build

Do not show these as live features, working controls, or navigation items:

- Teams, organizations, roles, shared billing, or workspaces.
- Native mobile apps.
- Live stream ingestion.
- A full timeline editor, multi-track audio, or clip trimming UI.
- Auto-posting to social platforms or a post scheduler.
- A public clip marketplace or public share links.
- Face tracking. The crop is center crop.
- 16:9 or 1:1 exports. The output is 9:16.
- MCP, a public API, or third-party integrations.
- AI B-roll, split screen, or gameplay backgrounds.
- Watermarks, invoices, or plan tiers that do not exist.

If you want to mention future work, put it in a clearly labelled "Not in this build" note outside
the primary flow. Never render a disabled fake control that implies the feature exists.

### Feature-scale ambition

The benchmark is ScaleReach-level **information architecture, density, and perceived completeness**
for the surfaces that exist. It is not permission to claim feature parity with ScaleReach. ClipMax
wins by doing one pipeline exceptionally well, not by pretending to have a scheduler, an API, and a
team workspace.

---

## 3. Why the current UI was rejected

Do not reproduce any of these:

- Dark-only, near-black canvas with cobalt and ice. It reads as a mood piece, not a tool.
- Serif italic words inside sans headlines. It feels decorative and art-directed.
- Film grain, dot fields, gradient orbs, and ambient glows on every surface.
- A centered hero followed by three feature cards and a pricing table.
- A fake dashboard with invented numbers, fake clips, or a browser-chrome frame.
- Tiny 8px mono labels everywhere. If everything is a label, nothing is.
- Cards inside cards inside cards. Glassmorphism on every panel.
- Endless scroll animation, Lenis smooth scroll, parallax on every section, cursor effects.
- Generic copy: "unlock", "supercharge", "effortless", "10x", "AI magic", "trusted by".
- A layout that looks like a SaaS template with the logo swapped.

The new UI must feel like a real product used by someone with taste, on a deadline, with a long
recording and a week of posts to ship.

---

## 4. The direction: The Rundown

**The Rundown** is a broadcast-grade edit desk. It borrows the operational language of a TV rundown
and the material honesty of a contact sheet, then renders it as a calm, light-first product.

**Thesis:** Warm paper and ink in light mode, graphite and ink in dark mode, one safety-orange
signal, hard cuts, timecodes, contact sheets, and real clips. It should feel like a working control
surface, not a cinematic mood board.

Why this direction:

- **Not dark and artsy:** light mode is the primary canvas. Dark mode is a fully designed equal, not
  a recolored afterthought.
- **Not generic SaaS:** the layout uses a 12-column editorial grid, asymmetric 5/7 splits, hard
  hairline rules, a timecode rail, a monitor wall of 9:16 clips, and lower-third labels. It does not
  use a centered hero with floating cards.
- **Strong hierarchy:** one display headline, one supporting sentence, one primary action per
  screen. Numbers and status are set in mono. Body copy is readable, not 8px.
- **Product-as-evidence:** real video frames, real clip cards, real job states, real credits. No
  fake dashboard.
- **Built for a creative tool:** dense enough for the studio, spacious enough for the landing. The
  same system works for marketing and for a 3-hour work session.

**Internal name:** The Rundown. Do not repeat the name as a label on every screen. The product is
ClipMax. The studio page may be called "Studio" or "Rundown"; pick one and be consistent.

### Visual signatures

- **Paper and ink:** warm off-white canvas, near-black ink, no blue-black.
- **One signal:** safety orange used for the cut marker, active state, focus, and the one number that
  matters. It is not a background wash.
- **Hard rules:** 1px hairlines, not soft shadows. Sections meet at rules.
- **Timecode rail:** a thin left rail with section numbers, timecodes, or pipeline steps. It is a
  navigation and rhythm device, not decoration on every card.
- **Contact sheet:** frames in a strip with sprocket-like spacing, but rendered as clean UI, not a
  skeuomorphic film strip.
- **Monitor wall:** 9:16 clips in a row or grid, each with a timecode and a status.
- **Lower-third type:** expanded uppercase mono labels for metadata, used sparingly.
- **Video is the only rich surface:** clips can be dark, cinematic, and colorful. The UI around them
  stays flat and quiet.

### Palette (use these tokens)

```css
:root,
[data-theme="light"] {
  color-scheme: light;

  --canvas: #f4f0e7;
  --surface: #fbf8f1;
  --surface-2: #ece6d9;
  --surface-3: #e3dccd;

  --ink: #161513;
  --ink-2: #3b3731;
  --muted: #635d53;
  --quiet: #857e72;

  --line: #d8d0c1;
  --line-strong: #b9af9e;

  --signal: #d93a16;
  --signal-strong: #b92e0e;
  --on-signal: #fff8f0;

  --success: #1f7a4d;
  --warning: #8a5a00;
  --danger: #b42318;

  --focus: #b92e0e;
  --selection: rgb(217 58 22 / 18%);
}

[data-theme="dark"] {
  color-scheme: dark;

  --canvas: #12110f;
  --surface: #1a1815;
  --surface-2: #221f1b;
  --surface-3: #2a2621;

  --ink: #f5efe4;
  --ink-2: #d8d0c2;
  --muted: #b0a798;
  --quiet: #82796c;

  --line: #302c26;
  --line-strong: #4a443b;

  --signal: #ff6a3d;
  --signal-strong: #ff815c;
  --on-signal: #1a0e08;

  --success: #6ee7a8;
  --warning: #f5c26b;
  --danger: #ff8a80;

  --focus: #ff815c;
  --selection: rgb(255 106 61 / 22%);
}
```

Rules:

- Primary buttons are ink in light mode and paper in dark mode. The orange is a signal, not a giant
  filled button on every screen.
- Links and small accent text use `--signal-strong` in light mode and `--signal` in dark mode.
- Filled orange chips use `--signal-strong` with `--on-signal` text, never white on `--signal`.
- Semantic colors are for state only. Do not use them as decoration.
- No gradients, no glass, no colored glows, no random hex outside the token file.
- Video surfaces may use their own colors. Document any scene color in the component.

### Typography

- **Display, UI, body:** Archivo, variable, weights 400 to 800.
- **Metadata, timecodes, scores, file sizes, table numbers:** IBM Plex Mono, weights 400 and 500.
- **No serif.** No second display face. No handwritten fonts.
- Self-host through `next/font/google` with `display: swap`. Preload only the weights used.
- `font-synthesis: none`. `font-variant-numeric: tabular-nums` for data.

Scale:

| Role       | Size                           | Weight | Tracking   | Leading |
| ---------- | ------------------------------ | ------ | ---------- | ------- |
| Hero       | `clamp(3.4rem, 7.4vw, 7.2rem)` | 750    | `-0.055em` | `0.88`  |
| Section    | `clamp(2.2rem, 4.6vw, 4.2rem)` | 700    | `-0.045em` | `0.92`  |
| Page title | `clamp(1.9rem, 3.2vw, 2.8rem)` | 700    | `-0.04em`  | `0.96`  |
| Card title | `1rem - 1.25rem`               | 600    | `-0.02em`  | `1.25`  |
| Body       | `15px - 17px`                  | 400    | `-0.01em`  | `1.6`   |
| UI         | `13px - 14px`                  | 450    | `0`        | `1.45`  |
| Mono data  | `11px - 12px`                  | 500    | `0.02em`   | `1.4`   |
| Mono label | `10px - 11px`                  | 500    | `0.08em`   | `1.2`   |

Rules:

- No body text below 12px. No metadata below 10px. 8px text is banned.
- Uppercase only for short labels, never for paragraphs.
- Use `text-wrap: balance` for headings and `pretty` for paragraphs.
- Do not put a serif italic word inside a headline. If you need emphasis, use weight, a rule, or the
  signal color.

### Space, grid, shape

- Marketing container: max 1440px, 12 columns, 24px gap, 24/32/48px gutters.
- Studio: max 1440px, 248px left rail, 32/40px main padding.
- Spacing base 4px. Use 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128.
- Section padding: 96 to 128px desktop, 64 to 80px mobile.
- Radii: 2px, 4px, 6px, 10px, 14px. Buttons 6px. Inputs 6px. Cards 10px. Dialogs 14px.
  Pills only for status badges and avatars.
- Borders: 1px hairlines. Shadows only on dialogs and popovers, never on every card.
- Asymmetry is required: 5/7 or 4/8 splits, an image that bleeds off the grid, a rail that starts
  before the headline. Perfect symmetry everywhere is generic.

### Motion

- **Hard cuts, not soft fades.** 120ms for hover, 180ms for state, 240ms for panels, 500ms for the
  one hero entrance.
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- One signature moment: the hero source frame cuts into three vertical clips, or the rundown rail
  snaps its markers into place. Choose one, not both.
- No Lenis. No scroll-jacking. No parallax on every section. No looping ambient animation.
- Animate `transform` and `opacity` only. Never `width`, `height`, `top`, `left`, or
  `transition: all`.
- `prefers-reduced-motion: reduce` disables every non-essential animation and keeps all content
  visible.

### Imagery

- Use real video frames. No stock photos of people pointing at laptops. No abstract AI art.
- Source one public-domain or Creative Commons talking-head/interview clip. Record the source and
  license in `ASSETS.md`.
- Render a real 9:16 sample with FFmpeg if possible, with burned captions. If you cannot render,
  use real poster frames from the source and label the set "Sample frames. Render pending." Do not
  draw a fake video player.
- Every sample project, clip, score, transcript, and thumbnail must carry a visible "Sample" label.
  Do not mix sample rows into a real user's workspace.
- No fake customer logos, testimonials, metrics, or "trusted by" walls.

---

## 5. Phase 1: The reference sprint

This phase is mandatory. Do not jump to the final build.

**Hard stop:** finish the references, the scorecard, and the recommendation, then stop. Do not start
Phase 2 until the founder picks a direction or the decision rule below is applied. Commit the
reference sprint as its own commit before the final build begins.

### What to produce

Create a temporary design lab route (for example `/design-lab`) that is not linked from production
navigation. Build **5 to 10 complete directions**. Each direction must include:

1. **Landing hero** at 1440 x 1000 and 390 x 844.
2. **Studio overview** at 1440 x 1000 and 390 x 844.
3. **Component strip:** primary/secondary buttons, input, tabs, status badge, credit meter, pipeline
   rail, 9:16 clip card, empty state, error state.
4. **A one-page rationale:** name, thesis, references, palette, type, hero composition, studio
   shell, motion signature, what it rejects, risks.

The references must be **coded and responsive**, not moodboards, not text descriptions, not
AI-generated images. Use real copy from this brief and a labelled sample project. No lorem ipsum.

### Required coverage

At least:

- 3 light-first directions.
- 2 output-first directions (the clips are the hero).
- 2 tool-first directions (the studio is the hero).
- 1 dark-first direction, which must still pass the hierarchy and "not artsy" test.
- 1 direction that is deliberately quiet and typographic, with almost no product UI above the fold.
- 2 directions that are genuinely original, not variations of the seeds below.

You may use these seeds, rename them, or replace them:

1. **The Rundown** (recommended): broadcast desk, paper/ink/orange, timecode rail, monitor wall.
2. **Contact Sheet:** photographic, black-and-white frames, red grease-pencil marks, light.
3. **The Feed:** output-first wall of real 9:16 clips, white gallery, minimal chrome.
4. **Field Notes:** warm documentary notebook, ruled paper, stamps, but no fake handwriting.
5. **Signal Desk:** light technical grid, precise data, one orange mark, no dark hacker aesthetic.
6. **Cut List:** production paperwork, shot numbers, call sheets, but readable and modern.

Do not build six dark cinematic pages with different accent colors. That is the failure mode.

### Scorecard

Score each direction 1 to 5 on:

- **Distinctiveness:** would someone remember it after closing the tab?
- **Product truth:** does it show the real workflow and real states without fake data?
- **Hierarchy:** can a stranger tell what to read, what to do, and what happened?
- **Light/dark parity:** are both themes fully designed?
- **Accessibility:** contrast, focus, keyboard, reduced motion, readable type.
- **Buildability:** can it be built cleanly in Next.js and Tailwind without hacks?
- **Longevity:** will it still look good in 12 months, after the trend cycle?

Weight distinctiveness, product truth, and hierarchy highest. Show the table. Recommend one
direction and explain the trade-offs.

### Decision rule

- If the founder picks a direction, build that one.
- If no human response is possible, build **The Rundown** if it is within 10% of the top score.
  Otherwise build the top-scoring direction that satisfies every non-negotiable in this brief.
- Do not average directions. Do not keep three palettes. Do not "take the best parts" of five
  systems. One direction, fully executed.

### Reference study

Study these, and write down what you take and what you reject:

- **OpusClip:** clip cards, score, transcript, editor density, workflow clarity. Reject the purple
  gradients, floating panels, and hype.
- **Vizard:** frictionless upload, clear pricing, editor grid. Reject the generic dashboard feel.
- **ClipCut:** direct value proposition, simple signup, pricing clarity. Reject stock AI imagery.
- **Apple:** product-as-hero, restrained copy, typographic hierarchy, scroll storytelling. Reject
  the giant empty whitespace and cinematic dark palette.
- **Arc:** spatial clarity, confident color, onboarding. Reject whimsical clutter.
- **Framer:** motion craft, component polish, pricing clarity. Reject endless animation and
  template energy.
- **ScaleReach:** feature breadth, demo clips, workflow explanation, pricing comparison. Reject the
  celebrity avatars, "viral" hype, and features ClipMax does not have.

The supplied reference pack has 39 screenshots. Use it. Do not rely on memory.

---

## 6. Phase 2: The final full-app build

Build the chosen direction across every route. The app must work against the real backend. If a
credential is missing, render the honest configuration state and continue; do not mock a success.

### Global requirements

- **Theme:** system default, manual Light / Dark / System toggle, persisted in localStorage, no
  flash on load. Both themes fully designed on every route. `color-scheme` set correctly.
- **Typography:** Archivo + IBM Plex Mono only. Remove Geist and Instrument Serif from the web and
  site layouts. Update the static preview layout too.
- **Tokens:** move the palette, type, radii, spacing, and motion into `globals.css` and Tailwind
  `@theme inline`. No random hex in components.
- **Focus:** visible 2px focus ring with 2px offset on every interactive element.
- **Skip link:** first tab stop, visible on focus.
- **Motion:** CSS-first. One signature moment. Reduced-motion fallback. Remove Lenis if it fights
  the browser.
- **Icons:** Lucide, 1.5px stroke, 16/18/20px. No emoji as icons.
- **No dead controls:** every button and link either works or is explicitly disabled with a reason.
- **No fake data:** no invented counts, names, logos, testimonials, uptime, prices, or clips.
- **Sample labels:** visible, not hidden in alt text.
- **SEO:** real title/description/canonical/OG image per route. No fake ratings or review schema.
- **Performance:** no layout shift from fonts or media. Lazy-load below-fold media. Preload the hero
  poster. Keep JS out of the landing where possible.

### Route map and page specifications

#### `/` - Landing

**Header:** 64px, sticky, solid canvas with a bottom hairline (no glass). Wordmark, nav (Product,
Workflow, Pricing, FAQ), theme toggle, "Sign in", "Start free". Mobile: menu button opens an
accessible full-screen sheet with large nav and the primary CTA.

**Hero:** 5/7 split.

- Left: kicker "AI video repurposing for people who publish"; H1 "Long video in. A week of clips
  out."; subhead "ClipMax finds the moments, crops them to 9:16, and burns word-level captions. One
  recording becomes a week of posts."; intake; proof row; "No card. 30 free credits."
- Right: a labelled sample composition. One 16:9 source frame with duration and a play glyph, a thin
  orange cut line, and three 9:16 clips with timecodes, scores, and hook text. Use real sample
  media. No fake dashboard, no browser chrome.
- Intake: two tabs, "Paste a link" and "Upload a file". Link input with a real placeholder and
  validation against the supported hosts. Upload drop zone with file type/size validation. On
  submit, preserve intent and route to `/signup?source=...` or `/signup?intent=upload`; if already
  signed in, route to `/dashboard` with the same intent. Do not upload before auth.
- Above the fold at 1440 x 1000: header, headline, subhead, intake, and the start of the sample
  composition. At 1280 x 800: headline, subhead, and intake visible. At 390 x 844: headline,
  subhead, intake visible; sample below.

**Proof strip:** one row of facts separated by hairlines: "15 min source", "500 MB max",
"1080 x 1920", "Burned captions", "3 to 5 clips". No icons, no fake logos.

**Section 01 - The rundown:** headline "Four steps. No timeline." A horizontal rail with four steps
and timecodes: Bring the source, Read the room, Find the cut, Render the post. Each step includes a
real UI fragment: an upload/link card, a transcript snippet, a clip card with score and reason, and a
9:16 frame with captions. On mobile, stack vertically with a left rail. No pinned scroll.

**Section 02 - The output:** headline "A score is not a guarantee. The reason is the point." A large
9:16 sample player with controls and a poster, plus a "Why this clip" panel: hook, time range, score,
reasoning, transcript excerpt. Two smaller clip cards below. Label the set "Sample project". This is
the product's differentiator: it explains the cut.

**Section 03 - Who it's for:** headline "One recording. A week of posts." Four rows: Podcast,
Interview, Webinar, Course. Each row has source length, output, a one-sentence outcome, and a
timecode strip. No icon cards.

**Section 04 - The studio:** headline "A desk, not a demo." A large real studio screenshot that
bleeds off the grid, with two or three annotations for real status, credit meter, and clip wall.
Label it "Sample workspace" if the data is sample. No fake browser chrome.

**Section 05 - The system:** headline "Your master file stays private." A simple system diagram:
browser -> signed PUT -> private R2; worker -> signed GET; Supabase -> RLS. Four facts: direct
upload, private bucket, signed URLs, auditable credits. No fake security badges.

**Pricing:** headline "Free to try. $19 when you publish every week." Two cards: Free (30
credits/month) and Starter ($19 / INR 1,499 per month, 150 credits). Show USD and INR. Include the
credit math. If Razorpay is missing, say "Billing is not live in this build. The studio still works
with free credits." If test mode, show "Razorpay test mode." No "most popular" badge without
evidence.

**FAQ:** 7 honest questions, including link support, file privacy, face tracking, caption editing,
failed renders, cancellation, and social posting. Use an accessible disclosure component.

**Final CTA:** "Bring the long version." + intake or "Start free". "30 free credits. No card."

**Footer:** product, studio, legal, system columns. Wordmark, one line, "Private beta", "Built with
Supabase, Cloudflare R2, and FFmpeg", theme toggle, GitHub link. No fake social icons. No "All
rights reserved" boilerplate if a real line is better.

#### `/signup` and `/signup?mode=signin` - Auth

- Split layout. Left: a real sample clip composition (one large 9:16 clip, two smaller) and one
  short line. No testimonial, no fake customer quote.
- Right: auth card, max 440px. Kicker "Private beta / 30 free credits". Title "Start your first cut."
  or "Sign in to your studio." Subhead. Source intent chip if present. Google button. Divider. Email
  field with a persistent label. Button "Send signup link" or "Send sign-in link". Legal line.
  Switch mode link.
- States: idle, sending, sent (show the email, "Check your inbox", "Use a different email"), error
  (config, invalid/expired link, rate limit, network). Inline field errors with `role="alert"`.
- If Supabase env is missing, show a persistent configuration panel and do not pretend to send.
- Preserve `next` safely. No password fields. No fake SSO.
- Theme toggle in the header. Mobile: single column, auth card first, sample composition hidden or
  reduced.

#### Studio shell - `/dashboard/**`

- Auth guard on the server. If Supabase is missing, render a configuration state, not a redirect
  loop. If there is no user, redirect to `/signup?next=...&mode=signin`.
- Desktop: 248px left rail, 56px top bar, main canvas. Mobile: top bar with wordmark, credit chip,
  menu sheet. No fake notification bell or global search.
- Left rail: wordmark + "STUDIO" label, "New project" button, nav (Studio, Projects, Billing,
  Settings, Support), credit meter, user menu. Active state: orange 2px left marker, ink text,
  surface-2 background. No pills.
- Top bar: breadcrumb, theme toggle, credit chip, user menu. Keep it quiet.
- New project: a shared dialog or panel with upload/link tabs, real progress, real errors, and the
  same logic as the landing intake after auth. It must work from any studio page.
- Credit meter: real balance / allowance, thin 4px bar, plan name, "Manage" link. If balance is
  null, show a dash and a configuration note.
- User menu: initials, email, plan, Settings, Sign out (POST `/auth/signout`). No fake avatar
  upload.

#### `/dashboard` - Studio overview

- Page title "Studio" with a real date or a factual status line. Do not use "Welcome back" unless
  the name is real.
- Header actions: credit chip, New project.
- Status strip: one row of four cells separated by hairlines: Credits, In pipeline, Clips ready,
  Projects. Large mono numbers, small labels. Not four floating cards.
- Main grid: left 8 columns = New project panel + Recent projects table; right 4 columns = Latest
  clips monitor wall + "How credits settle" note + Getting started checklist when empty.
- New project panel: tabs, drop zone, link input, real progress, real errors. If not configured,
  show the configuration panel instead of a fake upload.
- Recent projects: table rows with a 9:16 thumbnail, title, source type, duration, status, clips,
  credits held, updated. Click opens the project. On mobile, cards.
- Latest clips: 3-up 9:16 posters with title and timecode. If none, "Your first render will appear
  here." A separate "View sample project" link is allowed only if it is labelled sample.
- Getting started: three steps, only when there are no projects. Account connected, add a source,
  review clips. Thin progress line. No confetti.
- Loading: skeletons that match the layout. Error: specific, actionable.

#### `/dashboard/projects` - Projects

- Header: "Projects", count, search, filters, New project.
- Desktop: a dense table with a header row. Columns: thumbnail, title, source, duration, status,
  clips, credits held, updated. Mobile: cards.
- Filters: All, In pipeline, Completed, Failed. Use URL query params so the state is shareable.
  Search by title. Clear filters.
- Empty states: no projects vs no matches. No fake rows.
- Do not add pagination unless the API supports it. If the API returns the 60 most recent, say so.
- Row click opens the project. Failed rows show the error inline, truncated.

#### `/dashboard/projects/[id]` - Project results

- Header: breadcrumb, title, status badge, source metadata (type, duration, size, created, credits).
  Actions: Retry (failed only), Delete (not while active). No rename unless a PATCH route exists.
- Pipeline rail: four steps with real job status and progress. Upload, Transcribe, Analyze hooks,
  Render. For link sources, label the first step "Fetching source". Show the failed step and the
  real error. No fake ETA.
- Clips: 3 columns desktop, 2 tablet, 1 mobile. Each card:
  - 9:16 video with poster, controls, plays inline, no autoplay.
  - Top overlay: index / 9:16, score if real.
  - Below: time range, duration, render status, title, hook quote, reasoning, transcript link,
    download button.
  - Rendering: a real state panel with spinner and "FFmpeg is rendering." No fake blur.
  - Failed: error and "Retry the project." No fake download.
- Transcript: collapsible panel with the real transcript text, language, and provider. Do not invent
  word timings. If the data has word timestamps, you may highlight; otherwise show the text.
- Polling: every 5 seconds while active. Show a small "Live" label and last updated time. Stop when
  terminal. No fake progress.
- Delete dialog: explain what is deleted (source, renders, thumbnails, transcript). Credits already
  spent are not refunded; say so. Confirm.
- Retry dialog: explain a fresh hold of up to 15 credits and the refund on permanent failure.
  Confirm. Handle insufficient credits.
- 404 for invalid or foreign project. Configuration state if Supabase/R2 is missing.

#### `/dashboard/billing` - Billing

- Header: "Billing" and "The meter, in the open." One summary strip: Plan, Credits, Subscription,
  Period end. Not four cards.
- Upgrade panel: Starter price, features, CTA. Active: "Starter is active" and cancel. Pending:
  "Checkout started, waiting for payment." Past due/paused: explain.
- Razorpay: load Checkout only when needed. Open with the server-created subscription id, key,
  name, description, prefill email, and theme color. Handler posts to `/api/billing/verify`, then
  shows "Payment received. Waiting for the verified webhook to grant credits." Poll/refresh until
  granted. If granted, show success. If not, show "Payment verified, but the credit grant has not
  arrived yet. Refresh in a moment. If it persists, contact support with the payment id." Never fake
  success.
- Test mode badge when the key starts with `rzp_test_`. If billing is not configured, show the
  missing env group and "Checkout is closed."
- Ledger: table with date, reason, delta, project. Human labels for reasons. Link to the full ledger
  and CSV export. No fake rows.
- Cancel: dialog explaining period-end vs immediate. Show scheduled cancellation. Handle errors.
- Plan cards: Free and Starter only. No Pro. USD and INR.

#### `/dashboard/billing/ledger` - Ledger

- Full ledger table, newest first. Date, reason, delta, project, idempotency key (optional,
  monospace). CSV export button. Empty state. No fake entries.

#### `/dashboard/settings` - Settings

- Header: "Settings" and "Your account, on your terms." Sections: Profile, Appearance, Data &
  privacy, Billing summary, Sign-in.
- Profile: display name input, email read-only, save button, success/error. Use
  `PATCH /api/account/profile`. No avatar upload.
- Appearance: System / Light / Dark radio cards with mini previews. Persist. This is required.
- Data: export account JSON, export credit ledger CSV, delete account. Deletion is blocked while a
  subscription is active; explain why and link to billing. Type DELETE to confirm. Explain what is
  deleted and what remains with Razorpay. Sign out.
- Account facts: email, short account id, member since, last sign-in, projects, clips. Real.
- Billing summary: plan, credits, subscription, period end, link.
- Sign-in: Google + magic link, no password. Sign out. No fake sessions.

#### Public pages

- `/privacy`, `/terms`, `/refund`: shared public layout, max 720px measure, table of contents,
  last updated, real content. Do not add fake company details or legal claims.
- `/status`: real checks from `/api/health` and the worker health URL if configured. Distinguish
  "Not configured" from "Down." Show commit and checked time. No fake uptime or incident history.
- `/support`: GitHub Issues, security advisory, optional `SUPPORT_EMAIL`. Real. No fake chat.
- `/not-found`: "This page was cut." Links to home, studio, support.
- Error boundary: "Something broke on this screen." Retry and support. No stack traces.
- Signup error states: config, invalid link, rate limit, network.

#### Static preview - `apps/site`

- Keep the GitHub Pages preview working. It re-exports the landing from `apps/web` and must not
  include auth, API routes, or the studio.
- Update `apps/site/src/app/layout.tsx` for the new fonts, theme tokens, metadata, and theme script.
- The preview bar must remain in-flow and must not overlap content.
- `PAGES_BASE_PATH=/clipmax pnpm --filter @clipmax/site build:pages` must pass.
- Do not add server-only code to the landing that breaks static export.

---

## 7. Data and API contracts

Use the existing backend. Do not invent endpoints or mock responses.

### Auth

- Supabase browser client: `apps/web/src/lib/supabase/client.ts`.
- Server client: `apps/web/src/lib/supabase/server.ts`.
- Callback: `/auth/callback?code=...&next=...`.
- Sign out: `POST /auth/signout`.
- Google + email magic link. Preserve `next` with `safeNextPath`.

### Upload

1. `POST /api/uploads/presign`
   Body: `{ fileName, fileType, fileSize }`
   Response: `{ projectId, storagePath, uploadUrl, method: "PUT", headers, expiresAt, maxCredits }`.
2. Browser `PUT` to `uploadUrl` with the returned headers. Use `XMLHttpRequest` for real progress.
3. `POST /api/projects/:id/initiate`
   Response: `{ projectId, status, jobId }`.

Do not proxy video bytes through the Next.js server.

### Link intake

`POST /api/projects/link`
Body: `{ url }`
Response: `{ projectId, status, jobId }`.

Validate against the supported host allowlist in `packages/shared/src/api.ts`.

### Projects

- `DELETE /api/projects/:id` - delete a project and its stored objects. Blocked while active.
- `POST /api/projects/:id/retry` - retry a failed project with a fresh credit reservation.
- Project data for the results page is loaded server-side through Supabase, as it is today. Do not
  invent a GET route.

### Clips

- `GET /api/clips/:id/download` - 302 to a short-lived signed R2 URL. Use a normal link.
- Clip playback uses signed URLs minted server-side. Do not persist them.

### Billing

- `POST /api/billing/checkout` -> `{ keyId, subscriptionId, planName, credits, testMode }`.
- `POST /api/billing/verify` -> `{ verified, granted }`. Credits are granted by the webhook, not by
  this response.
- `POST /api/billing/cancel` -> cancellation result.
- `GET /api/billing/ledger/export` -> CSV.
- `GET /api/account/export` -> JSON.
- `PATCH /api/account/profile` -> `{ displayName }`.
- `POST /api/account/delete` -> `{ deleted, deletedObjects }`, body `{ confirmation: "DELETE" }`.
- `GET /api/health` -> readiness checks.

### Shared contracts

Use `@clipmax/shared` for statuses, plan data, credit math, error codes, and source validation. Do
not duplicate enums or prices in the UI.

### Error handling

All API errors follow:

```json
{ "error": { "code": "MACHINE_CODE", "message": "Human message", "details": {} } }
```

Switch on `code`, never on message text. Show the human message when it is safe. Do not show raw
Postgres, R2, or Razorpay errors.

---

## 8. Component and state inventory

Build these as reusable components, not one-off markup:

- **Brand:** Wordmark, ClipMark, ThemeToggle, SectionHeader, Timecode, ContactSheetFrame,
  MonitorWall.
- **Forms:** Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Label, FieldError,
  FileDrop, UrlInput.
- **Navigation:** Header, MobileMenu, StudioRail, Breadcrumb, Tabs, Pagination (only if API).
- **Feedback:** Alert, Banner, Toast, Progress, Skeleton, EmptyState, ErrorState, ConfigState,
  StatusBadge, LiveIndicator.
- **Overlays:** Dialog, ConfirmDialog, DropdownMenu, Tooltip.
- **Domain:** SourceIntake, UploadPanel, ProjectTable, ProjectRow, PipelineRail, ClipCard,
  ClipPlayer, TranscriptPanel, CreditMeter, PlanCard, LedgerTable, DeleteProjectDialog,
  RetryProjectDialog, DeleteAccountDialog.
- **Public:** PublicPage, LegalSection, LegalList, StatusCheckList, SupportCards.

States to design for every relevant component:

- Default, hover, active, focus-visible, disabled, loading, empty, error, success, read-only.
- Upload: presigning, uploading with real percent, initiating, queued, error, cancel.
- Project: uploading, ready, processing, completed, failed, retrying.
- Clip: draft, queued, rendering, rendered, failed.
- Billing: not configured, test mode, pending, active, past due, paused, canceled, completed.
- Auth: configured, not configured, sending, sent, invalid link, rate limited, network error.
- Theme: system, light, dark.
- Data: loading skeleton, empty, error, stale.

No fake progress. No fake success. No dead controls.

---

## 9. Copy deck

Use this voice. You may refine the wording, but do not change the facts.

**Voice:** direct, specific, a little dry. Verbs over nouns. No hype. No fake urgency. No em dashes
in UI copy; use a period or colon.

### Landing

- Kicker: `AI video repurposing for people who publish`
- H1: `Long video in. A week of clips out.`
- Sub: `ClipMax finds the moments, crops them to 9:16, and burns word-level captions. One recording becomes a week of posts.`
- Tabs: `Paste a link` / `Upload a file`
- Link placeholder: `https://www.youtube.com/watch?v=...`
- Link CTA: `Get clips`
- Upload: `Drop a video here` / `Choose a file` / `MP4, MOV, or WebM. Up to 500 MB and 15 minutes.`
- Micro: `No card. 30 free credits.`
- Proof: `15 min source` / `500 MB max` / `1080 x 1920` / `Burned captions` / `3 to 5 clips`
- Section 01: `The rundown` / `Four steps. No timeline.` / `Upload or paste a link. The worker does the rest, and every state you see is a real job state.`
- Steps: `Bring the source` / `Read the room` / `Find the cut` / `Render the post`
- Section 02: `The output` / `A score is not a guarantee. The reason is the point.` / `Every clip comes with a hook, a time range, and the reason it was chosen. You decide what is worth posting.`
- Section 03: `Who it's for` / `One recording. A week of posts.` / `Podcasts, interviews, webinars, and courses already contain the short-form. ClipMax gets it out.`
- Section 04: `The studio` / `A desk, not a demo.` / `Upload, watch the queue, review the cut, download the clip. No timeline, no fake progress.`
- Section 05: `The system` / `Your master file stays private.` / `The browser uploads straight to a private R2 bucket with a short-lived signed URL. The app server never proxies the video.`
- Pricing: `Pricing` / `Free to try. $19 when you publish every week.` / `1 credit = 1 minute of source. A 15-minute source costs 15 credits.`
- FAQ: `Questions we would ask too.`
- CTA: `Bring the long version.` / `Start free` / `30 free credits. No card.`
- Footer: `ClipMax. Long video in. A week of clips out.` / `Private beta. Built with Supabase, Cloudflare R2, and FFmpeg.`

### Studio

- Nav: `Studio`, `Projects`, `Billing`, `Settings`, `Support`
- Primary: `New project`
- Overview: `Studio` / `The desk is clear.` or `2 sources in the pipeline.`
- Stats: `Credits`, `In pipeline`, `Clips ready`, `Projects`
- Intake: `Bring the long version.` / `Upload a file or paste a public link. We probe the real duration before charging.`
- Recent: `Recent projects`
- Empty: `No projects yet.` / `Upload a source or paste a public link. Your first project will show its real status here.`
- Clips: `Ready to post` / `Your latest renders`
- Billing: `Billing & credits` / `The meter, in the open.`
- Settings: `Settings` / `Your account, on your terms.`
- Status: `Status` / `What the process can actually prove.`
- Support: `Support` / `A real person reads every report.`

### Error and state copy

- `This file is larger than 500 MB. Choose a smaller source.`
- `Choose an MP4, MOV, or WebM video.`
- `Paste a public YouTube, Instagram, TikTok, Vimeo, X, Facebook, LinkedIn, or Twitch link. Private links are not supported.`
- `This source can use up to 15 credits. You have X. Add credits or choose a shorter source.`
- `The upload did not reach storage. Try again.`
- `The worker could not render this clip. Retry the project; the credit hold will be refunded if it fails permanently.`
- `Billing is not configured. Checkout is closed until the Razorpay keys and plan id are present.`
- `Auth is not configured. Add the Supabase URL and anon key to enable sign-in.`
- `The sign-in link is invalid or expired. Request a new one.`
- `We could not load this project. It may have been deleted, or it belongs to another account.`
- `This project is still in the queue. Delete it after the current job finishes or fails.`
- `Cancel the subscription before deleting the account. Razorpay could otherwise keep charging a closed account.`
- `Payment verified. Waiting for the Razorpay webhook to grant credits. This page will refresh.`
- `Payment verified, but the credit grant has not arrived yet. Refresh in a moment. If it persists, contact support with the payment id.`

### Banned words

`unlock`, `unleash`, `supercharge`, `effortless`, `seamless`, `10x`, `next-generation`,
`world-class`, `best-in-class`, `AI magic`, `trusted by`, `game-changing`, `revolutionary`.

---

## 10. Accessibility, performance, and QA

### Accessibility

- WCAG 2.1 AA. Body text at least 4.5:1, large text 3:1, UI boundaries 3:1.
- Every input has a persistent visible label. Placeholders are examples, not labels.
- Errors are associated with the field, use `role="alert"`, and say what to do next.
- Dialogs trap focus, have a title and description, close on Escape, and restore focus.
- The mobile menu is a dialog with a trigger name and a close affordance.
- Tabs use the correct roles and keyboard behavior. Or use links if they navigate.
- The intake tabs use `aria-pressed` or a proper tab pattern, not fake buttons.
- Video players have labels and a transcript link. No autoplay with sound.
- Upload progress uses `role="progressbar"` or a live region with a real percentage.
- Job state changes use `aria-live="polite"` without spamming.
- Keyboard pass: tab order, focus visible, no traps, skip link, all actions reachable.
- Reduced motion: all non-essential animation disabled; content visible with JS off where possible.
- Test at 200% zoom. No clipped text or horizontal scroll.

### Performance

- Landing LCP under 2.5s on a mid-range mobile connection. CLS under 0.1.
- Lighthouse: 90+ performance, accessibility, best practices, SEO on the landing at 390.
- Studio: 90+ accessibility. Performance is secondary but no jank.
- Self-host fonts, preload the hero poster, lazy-load below-fold media, avoid huge client bundles.
- Do not ship GSAP/Lenis if CSS can do the job. Remove unused dependencies from the landing bundle.
- Use `next/image` where appropriate; use signed R2 URLs with `unoptimized` where necessary.
- No layout shift from video posters. Set aspect ratios.

### QA matrix

Test every route at:

- 390 x 844
- 768 x 1024
- 1024 x 768
- 1280 x 800
- 1440 x 1000
- 1920 x 1080

In both light and dark. At minimum, capture screenshots for the landing, signup, studio, projects,
project results, billing, settings, status, support, 404, and error at 390 and 1440 in both themes.

Check:

- No horizontal scroll.
- No clipped headings or overlapping text.
- No console errors or failed requests.
- Focus visible on every interactive element.
- All buttons and links work or are explicitly disabled with a reason.
- No fake data. Search the code for invented names, counts, logos, prices, testimonials.
- Sample labels are visible.
- Configuration states appear when env vars are missing.
- Auth redirect preserves `next`.
- Upload progress is real.
- Polling stops when the project is terminal.
- Billing never claims success before the webhook grant.
- Theme persists and does not flash.
- Static preview builds and has no API/auth routes.

---

## 11. Deliverables

1. **`FRONTEND_REFERENCES.md`** - the 5 to 10 directions, screenshots, scorecard, recommendation.
2. **`REFERENCE_DECISION.md`** - the chosen direction, rationale, and the non-negotiables it meets.
3. **Production code** in `apps/web`, with the chosen direction applied to every route.
4. **Updated `DESIGN.md`** - palette, type, motion, component rules, and the decision.
5. **`ASSETS.md`** - sample media sources and licenses.
6. **`UI_QA.md`** - screenshots, breakpoints, themes, keyboard pass, Lighthouse, console, overflow,
   and known gaps.
7. **`FRONTEND_HANDOFF.md`** - route map, component inventory, env requirements, commands, and what
   is intentionally not built.
8. **A clean git history** - one commit for the reference sprint, one for the final build, explicit
   paths, no secrets.

### Verification commands

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

All must pass before handoff. If a command fails for a reason unrelated to the frontend, report it;
do not hide it.

---

## 12. Final checklist

- [ ] 5 to 10 coded references exist, with a scorecard and a recommendation.
- [ ] One direction is chosen and documented.
- [ ] The final build uses one direction, not a blend.
- [ ] Light and dark are both fully designed on every route.
- [ ] No serif, no film grain on UI, no gradient orbs, no glass everywhere.
- [ ] No fake data, fake metrics, fake logos, fake testimonials, fake uptime.
- [ ] Every sample project and clip is visibly labelled.
- [ ] The landing hero shows the real source-to-clips transformation, not a fake dashboard.
- [ ] The intake preserves source intent through signup.
- [ ] Studio, projects, results, billing, settings, legal, status, support, 404, and error are built.
- [ ] Real API calls, real states, real configuration errors.
- [ ] Billing never claims success before the webhook grant.
- [ ] Keyboard, screen reader, reduced motion, contrast, 200% zoom pass.
- [ ] No horizontal scroll at any tested width.
- [ ] Lighthouse targets met or the gap is documented.
- [ ] Static GitHub Pages preview still builds under `/clipmax`.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm db:verify`, worker tests, and
      `build:pages` pass.
- [ ] `DESIGN.md`, `ASSETS.md`, `UI_QA.md`, and `FRONTEND_HANDOFF.md` are updated.
- [ ] The public repo and preview remain available.

If you cannot meet a requirement, do not fake it. Build the honest state, document the gap, and
continue with the rest of the app.
