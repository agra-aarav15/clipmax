# ClipMax — Design System

> The design reference for every ClipMax surface. Read this before changing the landing page,
> signup, dashboard, or email. The product truth lives in `PRODUCT.md`; this file is how it looks,
> moves, and speaks.

## 1. The world

**Cutting room after midnight.**

A dark, quiet room with a bright monitor, a timecode in the corner, and one frame that makes you
lean in. The interface should feel like a tool used by someone with taste: precise, editorial,
slightly cinematic, never like a generic AI SaaS template.

The page earns attention with **scale, negative space, and one strong idea per screen**. It does not
earn it with a pile of gradients, fake dashboards, or ten competing animations.

### Visual signatures

- Warm-black canvas, not blue-black.
- One signal colour used sparingly, like a clip marker.
- Oversized display type with tight tracking and a single serif italic emphasis.
- Monospace micro-labels for timecodes, source metadata, and job state.
- Film grain and a masked dot field, both subtle enough to feel like material rather than decoration.
- Product-as-evidence: the cutting-room console shows the real shape of the workflow, labelled as a
  sample when it is a sample.

## 2. Palette

### Locked launch palette

**Cobalt + ice.** Electric cobalt `#155EEF` is the action colour: filled buttons, active states, the
mark. Ice `#9BE7FF` is the readable signal: text accents, focus rings, thin rules, glow, and data
marks.

| Token  | Hex       | Use                                              |
| ------ | --------- | ------------------------------------------------ |
| Cobalt | `#155EEF` | Filled actions, mark, selection, active tab      |
| Ice    | `#9BE7FF` | Serif emphasis, labels, progress, focus, glow    |
| Ink    | `#08090A` | Canvas                                            |
| Paper  | `#F2F1EC` | Primary text                                     |

White text on cobalt passes AA for normal text at this shade; never put white text on ice. Use ink on
ice. The old lime `#CBFF4B` is removed from the landing; do not reintroduce it without a new decision.

### Core tokens

```css
:root {
  /* canvas */
  --background: #08090a;
  --surface-1: #0a0b0c;
  --surface-2: #0e1012;
  --surface-3: #121417;

  /* text */
  --foreground: #f2f1ec;
  --muted-foreground: #a1a1a1;
  --quiet-foreground: #71717a;

  /* signal — cobalt action, ice readable accent */
  --primary: #155eef;
  --primary-foreground: #ffffff;
  --signal: #9be7ff;
  --signal-foreground: #071018;

  /* semantic */
  --destructive: #ef6a6a;
  --success: #7dd3a1;
  --warning: #e7b75c;

  /* lines and focus */
  --border: rgb(255 255 255 / 9%);
  --input: rgb(255 255 255 / 14%);
  --ring: rgb(155 231 255 / 70%);
}
```

Rules:

- Every colour goes through a token or a documented scene colour. No random hex in components.
- Cobalt is for primary actions, active states, and the one thing you want the eye to hit. Do not
  flood a section with it.
- Ice is for glow, secondary highlights, focus rings, and small data marks. It is not a background
  for white text.
- Warm amber/orange may remain inside **video scene art** (skin, practical lights, source footage),
  because it is representing the source material, not the brand.
- No purple-to-blue gradients. No rainbow gradients. No neon glow on every card.

### Contrast

- Body text on `--background` must be at least 4.5:1. Use `--foreground` or zinc-300, not zinc-500,
  for paragraphs.
- White on `#155EEF` passes AA for normal text; verify any custom opacity or overlay.
- Ice on dark is high contrast; ink on ice is the safe pairing.
- Never use colour alone to communicate job state. Pair it with a label and an icon.

## 3. Type

### Families

- **Geist Sans** — UI, display, body. Already loaded through the `geist` package.
- **Geist Mono** — timecodes, labels, metadata, scores, tabular numbers.
- **Instrument Serif** — one italic word or phrase per surface. Used as emphasis, not a second body
  face.

### Scale

| Role            | Size                           | Weight     | Tracking  | Leading |
| --------------- | ------------------------------ | ---------- | --------- | ------- |
| Hero display    | `clamp(2.5rem, 6.6vw, 5.9rem)` | 600        | `-0.06em` | `0.92`  |
| Section display | `clamp(2rem, 4vw, 3.5rem)`     | 600        | `-0.04em` | `0.98`  |
| Section heading | `1.75–2.25rem`                 | 600        | `-0.03em` | `1.05`  |
| Card title      | `1rem–1.25rem`                 | 500        | `-0.02em` | `1.3`   |
| Body            | `15–17px`                      | 400        | `0`       | `1.65`  |
| Small body      | `13–14px`                      | 400        | `0`       | `1.55`  |
| Micro-label     | `8–10px`                       | 500        | `0.14em`  | `1.2`   |
| Serif emphasis  | `1.06em` of parent             | 400 italic | `-0.03em` | `0.8`   |

- Display headings use `text-wrap: balance`; body paragraphs use `text-wrap: pretty`.
- Do not set more than 2 lines of the hero headline on mobile if it can be avoided.
- The serif italic is a scalpel. One word, occasionally two. Never an entire sentence.
- Micro-labels are uppercase mono. They are a deliberate studio signature, not an excuse to label
  every section. Keep them short and factual.

## 4. Space and layout

- Container: `max-width: 1320px` for the landing; `1360px` for the header. At 1920 the gutters grow;
  the measure does not.
- Horizontal padding: 20px mobile, 32px tablet, 48px+ desktop.
- Vertical rhythm: 4px base; use 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Hero: headline, one sentence, intake, proof points, and the console above the fold at 1440×1000.
  At 1280×800 the headline, sentence, and primary action must be visible without scrolling.
- Sections: one idea, one headline, one supporting paragraph. If a section needs three columns of
  explanatory cards, it is probably a docs page, not a landing page.
- Asymmetry is welcome: 0.9fr / 1.1fr splits, offset captions, a console that breaks the grid by a
  few pixels. Perfect symmetry everywhere feels generic.

### Breakpoints

- `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px.
- Test at 390×844, 768×1024, 1024×768, 1280×800, 1440×1000, 1920×1080.
- `overflow-x: clip` on `html` and `body`; no horizontal scroll at any tested width.

## 5. Components

### Header

- 72px tall, sticky, transparent at rest, blurred dark surface after 8px of scroll.
- Wordmark: geometric mark + “ClipMax” + a quiet “Studio” label.
- Desktop nav is a floating pill; mobile nav is a full-screen dialog with large type and a clear
  close affordance.
- Primary CTA is the only filled button in the header. “Start free” on desktop, “Start” on mobile.

### Intake

- One surface, two modes: Link and Upload. Link is the default.
- The submit button is the brightest object in the hero.
- Validation is inline and specific: unsupported file type, file too large, invalid URL, missing file.
- Missing Supabase credentials produce a visible configuration note on signup, never a fake
  “check your email” success.
- Upload selection is validated locally; the file is not persisted across navigation until the
  studio upload flow exists. Say so honestly.

### Cutting-room console

- The hero console is evidence of the workflow, not a fake live dashboard.
- It must carry a visible `Interface preview · sample project, not a live render` label.
- Three panes: source scene (16:9), hook scan, vertical outputs. On mobile they stack; the source
  pane leads.
- Scores, timecodes, and clip titles are sample content. Do not imply they came from the visitor.
- On mobile, do not let the source chip and the 9:16 face-lock label collide. Hide the redundant
  source chip below `sm`, or move it to a non-competing corner.

### Proof strip

- Facts only: source limit, output resolution, caption type.
- No fake logos, no invented customer count, no “trusted by” wall.
- Use check marks or a quiet rule between items; no decorative status dots.

### Pipeline

- Four steps. Each step has a number, a real mechanism, and a one-sentence explanation.
- On desktop, consider a pinned GSAP ScrollTrigger sequence that advances the four steps as the user
  scrolls. On mobile, stack them with simple reveals. Never hide content behind scroll.
- No invented progress percentages. If showing progress, it comes from a real job row.

### Pricing

- Two cards: Free and Starter. Starter is highlighted with a thin primary border, not a giant glowing
  gradient.
- Show USD and INR for the India market. If payments are not live, say “Billing is not live in this
  build” in the section, not in a tiny disclaimer.
- No “most popular” badge unless there is real evidence.

### Signup

- Split layout: product argument on the left, auth card on the right.
- Google OAuth and email magic link are the only methods until the founder chooses Auth0.
- The source/intent query is preserved and explained in one line.
- Error states are specific and actionable.

### Dashboard and studio

- The dashboard is a workspace, not a marketing page. Calm surfaces, strong hierarchy, real status.
- Project rows: title, source duration, status, clip count, updated time.
- Processing view: Uploading → Transcribing → Finding hooks → Framing → Captions → Done. Each state
  comes from the job row.
- Clip cards: 9:16 thumbnail, hook, timestamps, score, download, open editor.
- Empty state: one clear action, a short explanation, and a sample project link labelled “sample”.

## 6. Motion

Motion is part of the material: the feeling of film advancing, a clip snapping into place, a panel
settling. It is not a demo reel.

### Principles

1. **Respond on press.** Buttons scale to `0.99` on `:active`; links get an instant colour change.
2. **Enter once, then rest.** Hero elements rise and clip in. Do not loop the main content.
3. **Scroll should reveal, not hide.** Content is visible with JS off and with reduced motion.
4. **One signature scroll moment.** The pipeline pin or the console parallax, not both at full
   strength.
5. **Respect reduced motion.** Every animation has a `prefers-reduced-motion: reduce` fallback.

### Timing

| Motion          | Duration  | Easing                          |
| --------------- | --------- | ------------------------------- |
| Hero rise       | 800ms     | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Console clip-in | 950ms     | same                            |
| Scroll reveal   | 600–800ms | same                            |
| Hover / colour  | 150–200ms | `ease-out`                      |
| Button press    | 100ms     | `ease-out`                      |
| Ambient glow    | 18s loop  | `ease-in-out`                   |
| Proof marquee   | 42s loop  | `linear`                        |

- Animate `transform` and `opacity` only. Never animate `width`, `height`, `top`, or `left`.
- Never use `transition: all`.
- Lenis smooth scroll is a transport layer, not an animation system. Pair it with GSAP ScrollTrigger
  and clean both up on unmount.
- GSAP and Lenis are client-only. Load them after the hero paint; do not block LCP.
- React Bits is a source of code, not a dependency to dump into the bundle. Fetch the current
  component source, adapt it to ClipMax tokens, and keep only what earns its weight.

### Signature moments

- **Hero:** headline mask/rise, then console clip-in. A slow ambient glow behind the console.
- **Pipeline:** a pinned four-step sequence on desktop, with the active step brightening as the
  console preview advances. On mobile, a simple staggered reveal.
- **Pricing:** the Starter card’s border draws in on scroll. No bouncing price numbers.
- **CTA:** a small click spark or magnetic hover on the primary action, disabled for reduced motion.

## 7. Voice

- Direct, specific, a little dry. “Long video in. A week of clips out.” not “Unlock the power of
  AI-driven content repurposing.”
- Verbs over nouns. “Find the hook” not “hook detection functionality.”
- No fake urgency. No “10x your reach” unless there is evidence.
- Error copy tells the user what happened and what to do next.
- Sample copy is labelled sample. Configuration copy is labelled configuration.
- Avoid em dashes in UI copy where a colon or period is clearer. (This document can use them.)

## 8. Accessibility

- WCAG 2.1 AA: contrast, focus, labels, keyboard, reduced motion.
- Every interactive element has a visible `:focus-visible` state using the ring token.
- The mobile menu is a dialog with a title, description, focus trap, Escape to close, and a trigger
  with an accessible name.
- The intake tabs use `role="group"` and `aria-pressed`.
- Error messages use `role="alert"` and are associated with the input.
- The console is decorative but carries a `role="img"` and a descriptive `aria-label`; it is not a
  tab trap or a fake interactive player.
- Video previews need captions or a transcript link. Do not autoplay with sound.
- Test with keyboard only and with `prefers-reduced-motion: reduce`.

## 9. Anti-slop rules

Do not ship:

- Purple-to-blue gradient heroes, floating orbs, or generic “AI” sparkle clusters.
- A fake browser chrome or a hand-drawn OS window around a product screenshot.
- A card inside a card inside a card.
- Invented metrics, testimonials, customer logos, or “featured in” badges.
- Emoji used as icons.
- Ten micro-labels in one viewport. If everything is a label, nothing is.
- Endless marquees, parallax on every section, or cursor effects that fight the content.
- Glassmorphism on every surface. Use it only where depth is real (sticky header, console).
- “Clean and modern” as a direction. It is not a direction.

## 10. Implementation contract

- Tokens live in `apps/web/src/app/globals.css` and are exposed through Tailwind’s `@theme inline`.
- Components consume semantic classes (`bg-background`, `text-primary`, `border-border`) or CSS
  variables. Scene art may use explicit colours, documented in the component.
- Marketing motion lives in small client components under `components/landing/motion/`. GSAP and
  Lenis are dynamically imported and cleaned up in `useEffect`.
- The landing page must remain server-rendered for copy and metadata. Motion components are leaves.
- No new dependency unless it earns its weight. Ponytail applies: the standard library, native
  platform features, and one line beat a framework.
- Before shipping: `pnpm typecheck`, `pnpm lint`, `SKIP_ENV_VALIDATION=1 pnpm --filter @clipmax/web
build`, and a real browser pass at the breakpoints above.

## 11. Current implementation notes

- Cobalt + ice tokens are applied. Cobalt is `bg-primary`; ice is `text-signal`, `border-signal`,
  `bg-signal`, and the focus ring. Do not use cobalt for small text on dark; it is only 2.36:1.
- The mobile hero console hides the redundant source chip below `sm`; the face-lock label no longer
  collides with it.
- The current hero console sample is labelled. Keep that label.
- The current lower landing sections are still in an older engineering-doc style. They must be
  rebuilt to match this system before launch.
- The current `/dashboard` is a Phase 1 status page. Replace it with the real studio shell before
  pointing the hero CTA at it.
