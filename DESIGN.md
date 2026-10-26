# ClipMax — Design System

> **Status 26 October 2026.** The cobalt + ice system and the six `/lab` directions are **retired**.
> The working direction is **The Rundown**: a light-first broadcast edit desk, warm paper and ink,
> one safety-orange signal, hard rules, timecode rails, and real clips. The full visual, functional,
> and QA contract is [`FRONTEND_PROMPT.md`](FRONTEND_PROMPT.md); this file is the durable summary.
>
> The frontend is owned by an **external builder**. The current `apps/web` and `apps/site`
> presentation is still the rejected cobalt/ice implementation and must not be used as a reference.
> The builder runs a coded reference sprint first, then one full-app build. If the founder picks a
> different direction from that sprint, this file is rewritten before the build continues.

## 1. The world

**A working edit desk, not a mood board.**

Warm paper under a desk lamp, a monitor wall of vertical clips, a timecode in the corner, and one
orange mark where the cut happens. The interface should feel like a tool used by someone with taste
on a deadline: precise, calm, dense where it needs to be, and honest about what the system is doing.

The page earns attention with **hierarchy, real footage, and one strong idea per screen**. It does
not earn it with gradients, glass, serif decoration, fake dashboards, or ten competing animations.

### Visual signatures

- **Paper and ink:** warm off-white canvas, near-black ink. No blue-black.
- **One signal:** safety orange for the cut marker, active state, focus, and the one number that
  matters. It is never a background wash.
- **Hard rules:** 1px hairlines. Sections meet at rules, not floating cards.
- **Timecode rail:** a thin left rail with section numbers, timecodes, or pipeline steps. It is a
  navigation and rhythm device, not decoration on every card.
- **Contact sheet:** frames in a strip with clean sprocket-like spacing, not a skeuomorphic film
  strip.
- **Monitor wall:** 9:16 clips in a row or grid, each with a timecode and a status.
- **Lower-third type:** expanded uppercase mono labels for metadata, used sparingly.
- **Video is the only rich surface:** clips can be dark, cinematic, and colourful. The UI around them
  stays flat and quiet.

## 2. Palette

Use the tokens exactly. No random hex in components. The full token block lives in
`FRONTEND_PROMPT.md` §4 and will be implemented in `apps/web/src/app/globals.css`.

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

- Primary buttons are ink in light mode and paper in dark mode. Orange is a signal, not a giant
  filled button on every screen.
- Links and small accent text use `--signal-strong` in light mode and `--signal` in dark mode.
- Filled orange chips use `--signal-strong` with `--on-signal` text. Never white on `--signal`.
- Semantic colours are for state only, never decoration.
- No gradients, no glass, no coloured glows, no colour outside the token file.
- Video surfaces may use their own colours. Document any scene colour in the component.

### Contrast

- Body text at least 4.5:1, large text 3:1, UI boundaries 3:1.
- Never use colour alone for job state. Pair it with a label and an icon.
- Check every token pair in both themes, not just the default.

## 3. Type

### Families

- **Archivo** — display, UI, body. Variable, weights 400 to 800.
- **IBM Plex Mono** — metadata, timecodes, scores, file sizes, table numbers. Weights 400 and 500.
- **No serif. No second display face. No handwritten fonts.**

Self-host through `next/font/google` with `display: swap`. Preload only the weights used. Set
`font-synthesis: none` and `font-variant-numeric: tabular-nums` for data.

### Scale

| Role       | Size                           | Weight | Tracking   | Leading |
| ---------- | ------------------------------ | ------ | ---------- | ------- |
| Hero       | `clamp(3.4rem, 7.4vw, 7.2rem)` | 750    | `-0.055em` | `0.88`  |
| Section    | `clamp(2.2rem, 4.6vw, 4.2rem)` | 700    | `-0.045em` | `0.92`  |
| Page title | `clamp(1.9rem, 3.2vw, 2.8rem)` | 700    | `-0.04em`  | `0.96`  |
| Card title | `1rem – 1.25rem`               | 600    | `-0.02em`  | `1.25`  |
| Body       | `15px – 17px`                  | 400    | `-0.01em`  | `1.6`   |
| UI         | `13px – 14px`                  | 450    | `0`        | `1.45`  |
| Mono data  | `11px – 12px`                  | 500    | `0.02em`   | `1.4`   |
| Mono label | `10px – 11px`                  | 500    | `0.08em`   | `1.2`   |

Rules:

- No body text below 12px. No metadata below 10px. **8px text is banned.**
- Uppercase only for short labels, never paragraphs.
- `text-wrap: balance` on headings, `pretty` on paragraphs.
- No serif italic word inside a headline. Use weight, a rule, or the signal colour for emphasis.

## 4. Space, grid, shape

- Marketing container: max 1440px, 12 columns, 24px gap, 24/32/48px gutters.
- Studio: max 1440px, 248px left rail, 32/40px main padding.
- Spacing base 4px. Use 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128.
- Section padding: 96–128px desktop, 64–80px mobile.
- Radii: 2px, 4px, 6px, 10px, 14px. Buttons 6px, inputs 6px, cards 10px, dialogs 14px.
  Pills only for status badges and avatars.
- Borders: 1px hairlines. Shadows only on dialogs and popovers, never on every card.
- Asymmetry is required: 5/7 or 4/8 splits, an image that bleeds off the grid, a rail that starts
  before the headline. Perfect symmetry everywhere is generic.

### Breakpoints

`sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536. Test at 390×844, 768×1024, 1024×768,
1280×800, 1440×1000, 1920×1080. `overflow-x: clip` on `html` and `body`; no horizontal scroll.

## 5. Components

The full inventory is in `FRONTEND_PROMPT.md` §8. These are the non-negotiables.

### Header

- 64px, sticky, solid canvas with a bottom hairline. No glass.
- Wordmark, nav (Product, Workflow, Pricing, FAQ), theme toggle, Sign in, Start free.
- Mobile: accessible full-screen sheet with large nav and the primary CTA.

### Intake

- One surface, two tabs: Paste a link / Upload a file. Link is the default.
- Validate locally against the supported host allowlist and the 500 MB / 15 min limits.
- On submit, preserve intent to `/signup?source=...` or `/signup?intent=upload`; if signed in,
  route to `/dashboard` with the same intent. Never upload before auth.
- Missing Supabase credentials produce a visible configuration note, never a fake success.

### Hero composition

- 5/7 split. Left: kicker, headline, subhead, intake, proof row. Right: one labelled 16:9 source
  frame with duration, a thin orange cut line, and three 9:16 clips with timecodes, scores, and hook
  text.
- Use real sample media. No fake dashboard, no browser chrome.
- Above the fold at 1440×1000: header, headline, subhead, intake, start of the composition.

### Proof strip

- One row of facts separated by hairlines: 15 min source, 500 MB max, 1080×1920, burned captions,
  3–5 clips. No icons, no fake logos.

### Pipeline

- Four steps with timecodes: Bring the source, Read the room, Find the cut, Render the post.
- Each step includes a real UI fragment, not an icon card. On mobile, stack with a left rail.
- No invented progress percentages. Real job rows only.

### Studio

- 248px left rail, 56px top bar, main canvas. Mobile: top bar with wordmark, credit chip, menu sheet.
- Rail: wordmark + STUDIO label, New project, nav (Studio, Projects, Billing, Settings, Support),
  credit meter, user menu. Active state: orange 2px left marker, ink text, surface-2 background.
- No fake notification bell or global search.
- Credit meter: real balance / allowance, thin 4px bar, plan name, Manage link. Null balance shows a
  dash and a configuration note.

### Project rows and clip cards

- Table rows: 9:16 thumbnail, title, source type, duration, status, clips, credits held, updated.
- Clip cards: 9:16 video with poster and controls, timecode, score if real, title, hook, reasoning,
  transcript link, download. No autoplay.
- Rendering and failed states are real panels with real errors. No fake blur or fake download.

### Pricing

- Two cards: Free (30 credits/month) and Starter ($19 / ₹1,499, 150 credits). Show both currencies
  and the credit math.
- No Pro. No "most popular" badge without evidence. If Razorpay is missing, say checkout is closed.

### Auth

- Split layout: real sample composition on the left, auth card on the right (max 440px).
- Google and email magic link only. No passwords, no fake SSO.
- Preserve `next` safely. Configuration, sending, sent, invalid link, rate limit, and network states
  are all designed.

## 6. Motion

**Hard cuts, not soft fades.** Motion is the feeling of a clip snapping into place, not a demo reel.

- 120ms hover, 180ms state, 240ms panels, 500ms for the one hero entrance.
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- One signature moment: the hero source frame cuts into three vertical clips, or the rundown rail
  snaps its markers into place. Choose one, not both.
- No Lenis. No scroll-jacking. No parallax on every section. No looping ambient animation.
- Animate `transform` and `opacity` only. Never `width`, `height`, `top`, `left`, or
  `transition: all`.
- `prefers-reduced-motion: reduce` disables every non-essential animation and keeps all content
  visible.

## 7. Voice

- Direct, specific, a little dry. Verbs over nouns.
- "Long video in. A week of clips out." Not "Unlock the power of AI-driven content repurposing."
- No hype, no fake urgency, no "10x", no "trusted by", no "AI magic".
- Error copy says what happened and what to do next.
- Sample content is labelled sample. Configuration states are labelled configuration.
- No em dashes in UI copy; use a period or colon.

The full copy deck is in `FRONTEND_PROMPT.md` §9. Do not change the facts.

## 8. Accessibility

- WCAG 2.1 AA: contrast, focus, labels, keyboard, reduced motion, 200% zoom.
- Visible 2px focus ring with 2px offset on every interactive element.
- Skip link is the first tab stop.
- Every input has a persistent visible label. Placeholders are examples, not labels.
- Errors are associated with the field, use `role="alert"`, and say what to do next.
- Dialogs trap focus, have a title and description, close on Escape, and restore focus.
- Tabs use the correct roles and keyboard behaviour, or links if they navigate.
- Upload progress uses `role="progressbar"` or a live region with a real percentage.
- Job state changes use `aria-live="polite"` without spamming.
- Video players have labels and a transcript link. No autoplay with sound.
- Test keyboard-only, screen reader, reduced motion, and 200% zoom.

## 9. Anti-slop rules

Do not ship:

- Purple-to-blue gradients, floating orbs, or generic AI sparkle clusters.
- Film grain, dot fields, or ambient glows on UI surfaces.
- A serif italic word inside a sans headline.
- A centered hero followed by three feature cards and a pricing table.
- A fake dashboard with invented numbers, fake clips, or browser chrome.
- Cards inside cards inside cards. Glassmorphism on every panel.
- Tiny 8px mono labels everywhere. If everything is a label, nothing is.
- Endless marquees, parallax on every section, cursor effects, or scroll-jacking.
- Fake logos, testimonials, metrics, uptime, prices, or "trusted by" walls.
- Dead controls that imply a feature exists. Disabled controls must state the reason.
- "Clean and modern" as a direction. It is not a direction.

## 10. Implementation contract

- Tokens live in `apps/web/src/app/globals.css` and are exposed through Tailwind `@theme inline`.
- Components consume semantic classes or CSS variables. Scene art may use explicit colours,
  documented in the component.
- Archivo + IBM Plex Mono replace Geist and Instrument Serif in both `apps/web` and `apps/site`.
- The landing stays server-rendered for copy and metadata. Motion is a leaf client component.
- The static GitHub Pages preview re-exports the landing from `apps/web`; it must not include auth,
  API routes, or the studio. `PAGES_BASE_PATH=/clipmax pnpm --filter @clipmax/site build:pages`
  must pass.
- No new dependency unless it earns its weight. CSS first. Remove GSAP/Lenis if CSS can do the job.
- Before shipping: `pnpm typecheck`, `pnpm lint`, the web production build, `pnpm db:verify`, worker
  tests, and the Pages export. Then a real browser pass at every breakpoint in both themes.

## 11. Current implementation notes

- **The code still runs the retired cobalt/ice system.** Do not use it as a reference.
- `apps/web/src/app/globals.css` is dark-only and must be replaced with the light/dark token set.
- The current landing uses Instrument Serif, film grain, GSAP, and Lenis. All four are out.
- The current `/dashboard` is a working studio shell, but its visual system is being replaced. The
  API routes, Supabase queries, and state handling behind it are the parts that stay.
- The four `/lab` pages and the `/directions` board remain live as history. They are not candidates.
- The external builder owns the rewrite. The backend agent reviews integration and protects the
  contracts; it does not rebuild the UI in parallel.
