# Prompt: Curatit scroll-driven landing page

A Claude Code prompt for building (or rebuilding) the landing page at `/` in this repository. It adapts the
"Pallet Ross" card-animation prompt to Curatit and the Carbon theme, fixes the parts of the original that
don't work in practice, and describes the hero motion shown in the reference video.

Copy everything under **The prompt** into Claude Code from the repository root.

---

## The prompt

> Build the landing page at `/` for **Curatit**: a scroll-driven page whose hero cards deal out of a deck,
> gather into a single stack as you scroll, and settle as a pinned diagonal cascade in the second section.
> Work inside this repository and follow its conventions. Don't start a new project.

### 1. Context and constraints

- **Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, `framer-motion` 12, `lucide-react`.
  All of these are already installed. Don't add Vite, new fonts, or a UI kit.
- **Where it lives:** `app/page.tsx` stays a server component. It reads the session with `getViewer()` from
  `lib/auth.ts` and renders `<Landing signedIn nav={<Navigation />} />` followed by `<Footer />`. Put client
  components in `components/landing/`. The landing sits outside the `app/(site)` route group, so it renders
  its own chrome.
- **Design system — use the semantic tokens in `app/globals.css`** (`@theme inline`), never palette steps or hex
  where a token exists: surfaces `bg-surface` / `bg-surface-sunken` / `bg-surface-inset`; text `text-ink` /
  `text-ink-muted` / `text-ink-subtle`; lines `border-line` / `ring-line` (alpha, so they recede);
  brand `bg-brand` / `hover:bg-brand-hover` (derived with `color-mix`) / `bg-brand-soft`; depth `shadow-card`
  and `shadow-window` (layered, never one big shadow); disabled `bg-disabled` / `text-disabled-ink` (a token,
  not opacity). Headings get `text-wrap: balance` and focus rings come from `:focus-visible` globally.
- **Motion rules (from the marketing-pages and unslop skills):**
  - No scroll-triggered fade-ins, anywhere. The only scroll-linked motion is the card choreography, which maps 1:1
    to scroll position and reverses with it.
  - No auto-advancing carousels or auto-playing demos. Every demo moves only when the visitor acts.
  - The hero intro plays once per session: `useIntroSkipped()` in `components/landing/useIntro.ts` (sessionStorage,
    decided once per page load and shared by the hero text and the cards).
  - Hover transitions 150ms ease-out on listed properties; buttons have a pressed state (`active:scale-[0.97]`);
    popovers scale from their trigger; exits are faster than entrances.
- **Theme — use Carbon, never hard-coded colours or fonts:**
  - Type: headings use `font-display` (Hedvig Letters Serif) at `font-light`; body text uses the default
    sans (InterVariable). Use `Text` from `components/fundations/elements/Text.tsx` for body copy.
  - Colour: take tokens from `app/globals.css`. Page background `bg-white` (the theme's warm white),
    primary text `text-base-900`, secondary text `text-base-600`, eyebrows `text-base-500`, highlight
    `text-accent-600`, dark surfaces `bg-base-800` / `bg-base-900`, panels `bg-base-50`. In inline styles,
    use `var(--color-…)`.
  - Buttons: `Button` from `components/fundations/elements/Button.tsx` (`variant="default" | "muted" | "accent"`,
    `size="base"`, `isLink` for navigation). No pill buttons.
  - Layout: `Wrapper` (`variant="standard"`) where the content isn't anchored to the viewport; panels are
    `rounded-lg bg-base-50 p-8`.
  - Navigation and footer: the existing `components/navigation/Navigation.tsx` and
    `components/global/Footer.tsx`. Don't build a separate navbar.
- **Copy:** Curatit's own words (below). Every button links to a real route, so there are no dead controls.
- **Images:** the seven hero cards live in `public/landing/`. Render them with
  `next/image` (`fill`, correct `sizes`), `alt=""` because they're decorative, and `draggable={false}`.
  They're third-party artwork (qclay.design): keep the licence note in `components/landing/tokens.ts`.
- **Motion tokens** (`components/landing/tokens.ts`): `smoothEase = [0.22, 1, 0.36, 1]`,
  `hoverEase = [0.34, 1.56, 0.64, 1]`, and `dealSpring = { type: "spring", stiffness: 260, damping: 28, mass: 0.9 }`.
- **Accessibility and robustness (required):**
  - Wrap the page in `<MotionConfig reducedMotion="user">`. With reduced motion, skip the intro and show
    the settled fan.
  - Skip the intro when the page loads already scrolled (`scrollY > 10`) or the visitor scrolls during it.
  - All card layers are `aria-hidden` and non-interactive except for hover.
  - No horizontal page scroll: the outer container uses `overflow-x: clip` (not `hidden`, which would
    break `position: sticky` and scroll measurement).
  - Measure layout (hero row, section 2 top, scrollable height) on mount, on resize, after `document.fonts.ready`,
    and 300 ms after mount. Never hard-code the hero row's y. It depends on the serif's line height and on
    wrapping.

### 2. Page structure

```
<Landing>                      relative container, bg-surface, overflow-x: clip   ← containerRef
  {nav}                        site Navigation (fixed, z-20)
  <ScrollCards />              global card overlay, z-5 (see §4)
  <Hero />                     section 1
  <SectionTwo />               section 2, data-section="two"
  <FeatureRows />              §7.1
  <Details />                  §7.2
  <LibraryShowcase />          §7.3
  <LandingFaq />               §7.4
  <ClosingCta />               §7.5
</Landing>
<Footer />                     outside the container so it doesn't affect scroll maths
```

No decorative blobs or glows: nothing floats behind the hero.

### 3. Section 1 — Hero

- `section`: `relative min-h-screen overflow-hidden`, centred column, `pt-[140px]`, `px-8`.
- `h1` (`font-display font-light text-base-900 text-balance`, `font-size: clamp(44px, 7.5vw, 96px)`,
  `line-height: 1`, max-width 1100px), two lines: **"Find the brand posts" / "worth studying."**
- **Headline reveal:** each word is an inline-block `motion.span` (`margin-right: 0.25em`) that goes from
  `{ opacity: 0, y: 16, filter: "blur(8px)" }` to `{ opacity: 1, y: 0, filter: "blur(0px)" }`, taking
  0.5s with `smoothEase`, delayed `0.15 + index × 0.06`s, counting across both lines.
- **Card row spacer:** `div[data-hero-row]`, 260px tall, full width, `mt-10`. The cards render in the
  overlay, centred on this element's vertical middle + 20px.
- **Tags** (chat-bubble labels with a 10px triangular tail, `rounded-full`, `font-medium text-white`,
  `padding: 8px 18px`, 15px):
  - `#product-launch`, background `var(--color-accent-600)`, at `left: max(8px, calc(50% − 320px))`,
    `top: −12px`, tail bottom-left.
  - `#editorial`, background `var(--color-base-800)`, at `right: max(8px, calc(50% − 420px))`, `top: −20px`,
    tail bottom-right.
  - Entrance: a jelly squash-and-stretch (`opacity [0, 1]`, `scaleX [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1]`,
    `scaleY [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1]`, 0.8s) as soon as the deal settles (≈ 2.0s and 2.15s).
- **Paragraph** (`Text` `textBase text-base-600`, max-width 480px, `mt-12`): "Real organic brand posts,
  reviewed by editors. Search by brief, save the best references to private boards, and share them with
  your client." Reveal it word by word with the same blur as the headline, stagger 0.02s, starting at 1.6s.
- **Buttons** (`mt-7`, `gap-2`, `pb-20`, fade up at 1.9s): `Button default` "Get access" → `/signup`, or
  "Open the library" → `/library` when signed in; `Button muted` "Read more" → `#how-it-works`.

#### Hero card motion — "deal from the deck"

This replaces the original fly-right-then-sweep-left sequence, which read as mechanical. The reference
motion is a deck that forms under a lead card and then deals out in one continuous spring.

**Fan layout** (7 cards, 200px squares at ≥1280px wide, scaled by `k = clamp(vw / 1280, 0.42, 1)`),
relative to the viewport centre (x) and the hero row (y). Tight overlap, shallow arc, right cards on top:

| slot | x | y | rotate | z |
| ---: | ---: | ---: | ---: | ---: |
| 0 | −390 | 14 | −9° | 1 |
| 1 | −260 | 6 | −6° | 2 |
| 2 | −130 | 2 | −3° | 3 |
| 3 | 0 | 0 | 0° | 4 |
| 4 | 130 | 2 | 3° | 5 |
| 5 | 260 | 6 | 6° | 6 |
| 6 | 390 | 14 | 9° | 7 |

Card *i* uses image `card-(i+1)`. The lead card is card 7, which ends in slot 6 on top of the deck.

**Timeline:**

1. **Lead rises (0.35s → 0.95s).** The lead card appears at the viewport centre on the hero row, going
   from `{ y: +60, scale: 0.85, rotate: −4, opacity: 0 }` to `{ y: 0, scale: 1, rotate: 0, opacity: 1 }`
   with `smoothEase`.
2. **Deck forms (0.75s → 1.05s).** The other six fade in *under* the lead at the same centre, each offset
   by `(2i px, 2i px)` and rotated `±1.5°` alternately, so the deck edges show. Stagger 0.03s, opacity
   and a 0.96 → 1 scale.
3. **Deal (from 1.1s).** Every card springs (`dealSpring`) from its deck pose to its fan slot. The delay
   grows with travel: `delay = 1.1 + (6 − slot) × 0.035`s. The lead card travels to slot 6 while slot 0
   travels furthest left. Cards keep their z-order the whole time, so nothing pops.
4. **Settle.** When the last spring settles (after `onAnimationComplete` for slot 0), hand over to the
   scroll-linked state (§4). The poses are identical at scroll progress 0, so there is no visible jump.

**Hover** (after the intro): lift the card with `y: −8` and `rotate: 0`, bring it to z-index 30, and
transition with `hoverEase` over 0.25s.

### 4. Scroll-linked card overlay

`ScrollCards` (client) owns all seven cards for the whole page.

- `useScroll({ target: containerRef, offset: ["start start", "end end"] })` gives the page progress.
- Measure `containerTop`, `scrollableHeight = container.scrollHeight − innerHeight`, and the top of
  `[data-section="two"]`, then set `lockProgress = clamp((sectionTwoTop − containerTop) / scrollableHeight, 0.05, 0.99)`.
- `clamped = useTransform(progress, v => Math.min(v, lockProgress))`. Poses never change past the lock.
- Keyframes at `0, p1 = lp × 0.33, p2 = lp × 0.66, lp`:
  - `x`: fan slot → viewport centre → viewport centre → cascade slot
  - `y`: fan slot → viewport centre → cascade y → cascade y
  - `rotate`: fan → 0 (at p1) → cascade rotate (at lp); `scale`: 1 → 1 → 1
  - z-index: fan z until `p1 / 2`, then cascade z (leftmost on top)
  - Between 0 and p1 all seven share one pose, so they read as a single card with one shadow.
- **Cascade** (7-step ladder, upper-left to lower-right): `top = 300 + 70i`, `left = 20 + 150i`,
  `rotate = −3 + 3i`, `z = 7 − i`, relative to `cascadeLeft = vw × 0.4` (16px on screens below 768px).
- **Pinning:** the wrapper is `position: fixed; inset: 0` until `progress ≥ lockProgress`. After that it's
  `position: absolute; top: lockProgress × scrollableHeight; height: 100vh`, so the cascade scrolls away
  with the document. The seven card components keep stable keys and are never remounted; only the
  wrapper's style changes.
- Each card: `size × size` with `rounded-[18px]`, `overflow-hidden`, `box-shadow: 0 20px 60px rgba(0,0,0,0.2)`,
  rendered inside a zero-size `motion.div` whose `x`/`y` is the card centre, so rotation pivots in the middle.

### 5. Section 2 — Research boards

- `section#how-it-works[data-section="two"]`: `relative flex items-start overflow-hidden px-8 md:px-16 pt-20`,
  `min-height: calc(100vh − 30px)`. The left text column is 520px wide (`pt-8`); the right side stays empty
  for the cascade.
- Eyebrow: `text-xs font-medium uppercase tracking-[0.2em] text-ink-subtle`, text "Research boards". Static:
  no scroll fade.
- `h2` (`font-display font-light`, `clamp(40px, 5vw, 60px)`, line-height 1.05), three lines:
  "Search, save" (`text-base-900`), "& share references" (`text-accent-600`), "for every brief."
  (`text-base-900`). Static text.
- Paragraph (`text-sm text-base-600`, max-width 340px): "Collect posts for a campaign, note what to adapt,
  and send a read-only link your client can open without an account."
- Buttons: `Button default` "Get access" → `/signup` (signed in: "Open your boards" → `/boards`);
  `Button muted` "See pricing" → `/pricing`.
- Tags over the cascade, shown only when the section is ≥ 95% in view (`useInView`, amount 0.95), going
  from scale 0.6 to 1:
  - `#carousel`, background `var(--color-accent-500)`, `top: 260px`, `left: calc(40% + 340px)`, centred tail.
  - `#bold-type`, background `var(--color-base-900)`, `top: 430px`,
    `left: min(calc(40% + 680px), calc(100% − 150px))` so it stays on screen at ~1200px.
  - Hide both below `md`.

### 6. Copy and links checklist

| Element | Text | Route |
| :-- | :-- | :-- |
| Hero primary | Get access / Open the library | `/signup` / `/library` |
| Hero secondary | Read more | `#how-it-works` |
| Section 2 primary | Get access / Open your boards | `/signup` / `/boards` |
| Section 2 secondary | See pricing | `/pricing` |

### 7. After Section 2

Everything below Section 2 shows **the real product with real library data**, built from references to
Cursor's and ElevenLabs' landing pages (via Mobbin). `app/page.tsx` calls `landingLibrary()` from
`lib/services/creatives.ts`, which returns: three example briefs with the results Curatit actually returns
for each, one carousel's slides and analysis, three board references, per-category covers and counts, and a
mosaic of covers for backdrops.

Shared pieces:
- **`Backdrop`**: the art behind product windows, painted from the library's own covers (a 3×2 grid enlarged,
  `blur-2xl`, slightly desaturated, under a `bg-surface/35` veil with a data-URI paper grain). The palette comes
  from the content; there is no arbitrary gradient anywhere on the page.
- **`AppWindow`**: `rounded-xl bg-surface shadow-window ring-1 ring-line`, with a 36px title bar holding three
  neutral dots and a centred `text-[11px] text-ink-subtle` title. Contents are real-size UI (12–14px text),
  never thumbnail-scale mock-ups.
- **The signature motif:** the hero's chat-bubble tag with a triangular tail reappears as the annotation in
  the detail demo. Use it only there and in the hero and Section 2.

**7.1 Feature rows** (Cursor-style). `pt-40 lg:pt-64` so the pinned cascade scrolls clear. Three rows with
unequal treatment, because the features are unequal:
- Each row has a statement in serif `text-2xl md:text-3xl font-light`: the claim in `text-ink` followed by
  the explanation in `text-ink-subtle` at the same size, then a `text-brand` link with "→".
- The visual is a `rounded-2xl` stage with a `Backdrop` and an `AppWindow` inside (`p-5 sm:p-10 lg:p-14`),
  wrapped in `role="group"` with an `aria-label`.
1. **Search by brief** (full width; statement above, window `max-w-3xl` centred). `SearchDemo`: a search
   field, "Read as" chips (`bg-brand-soft`), and a 3×2 grid of real results with "Brand — hook" captions.
   A footer bar offers the three briefs as pill buttons. Choosing one types it into the field (22ms per
   character), then chips and results fade in with a 40ms stagger. Nothing happens until the visitor clicks.
2. **See why it works** (window left 7fr, statement right 4fr). `DetailDemo`: slide viewer on
   `bg-surface-sunken` with previous/next buttons and a tabular "n / N" counter. The current step's name
   appears as a `bg-brand` chat-bubble annotation. The right pane has clickable narrative steps (the current
   one is dark) and analysis rows (Objective, Format, Structure, Visual style, Why it's here).
3. **Hand over a board** (statement left 4fr, window right 7fr). `BoardDemo`: board title in serif, a
   private/shared status line, and three references with notes. The Share button opens a popover that scales
   from its top-right origin (exit faster, ease-in): "Create link · 7 days" → a link field plus a copy button
   that shows a check for 1.5s → "Revoke link" returns the board to private.

**7.2 Details** (a compact list, not cards). Top border and `pt-16`; a narrow serif heading "Safe to share
with clients." beside a 2×2 list. Each item is the actual UI fragment at real size (a Private pill, an
"Expires in 7 days" pill, an attribution link, a "Removed · hidden everywhere" pill; each `role="img"` with an
`aria-label`, no pointer events) over one sentence: the bold claim, then the detail.

**7.3 Inside the library** (ElevenLabs-style cards). A header row with the serif `h2` "Six categories, studied
closely." and a right-aligned paragraph. Cards are `rounded-xl bg-surface shadow-card ring-1 ring-line`: a
240px art area (a `Backdrop` from that category's covers, plus three covers fanned at rest and spreading on
hover with `hoverEase`), then a footer with the serif name, "N references · N objectives" (`tabular-nums`),
and a single "Browse →" link stretched over the card with `after:absolute after:inset-0` (don't wrap the whole
card in `<a>`). Links go to `/library?category=…`, or sign-up with `next`. Add a small demo-library note.

**7.4 FAQ.** `lg:grid-cols-[1fr_2fr]`: serif "Questions that tend to crop up." and native `<details>` rows
(`divide-line`, a Plus icon rotating 45° when open, answers capped at 65ch). Reuse `faqs` from
`components/global/Faq.tsx`.

**7.5 Closing card** (Cursor-style). A `rounded-2xl bg-surface-sunken ring-1 ring-line` card, 5fr/7fr: serif
"Start with your next brief.", one line of copy, then one primary button (Get access / Open the library) and a
quiet secondary (See pricing, on `bg-surface` because the card is sunken). On the right, a decorative
`AppWindow` library grid on a `Backdrop` (`role="img"`, labelled, no pointer events).

### 8. Done when

- [ ] `npx tsc --noEmit`, `npm test`, and `npm run build` pass. For verification builds while a dev server
      is running, use `NEXT_DIST_DIR=.next-build npm run build`.
- [ ] At 1440×900 and 1200×700: the deck deals out with no card popping in or out; the fan gathers into one
      card with one shadow; the cascade lands under Section 2's text and scrolls away with the page.
- [ ] Reloading mid-page shows the correct scroll pose immediately, with no replayed intro.
- [ ] With `prefers-reduced-motion: reduce`, the page shows a settled fan and no intro.
- [ ] At 375px wide: no horizontal scroll and nothing overlaps the headline or buttons.
- [ ] Scrolled to the top of §7.1, the lowest cascade card sits above the "How it works" heading.
- [ ] Library cards show three real covers each and link to the filtered library (or to sign-up).
- [ ] No element on the page animates because it scrolled into view; demos move only when clicked.
- [ ] Reloading within the same tab session shows the hero settled, with no intro replay.
- [ ] `grep -rn "#[0-9a-fA-F]\{6\}\|rgba(" components/landing` finds nothing except inside `SlideArt` data.
- [ ] The page uses no hard-coded hex colours or non-theme fonts (search `components/landing` for `#` and `font-`).

---

## What changed from the original prompt

| Original | Here | Why |
| :-- | :-- | :-- |
| New Vite project | This Next.js repo, existing components | One codebase, shared auth, nav, footer |
| Inter Tight, hex colours | Carbon tokens: Hedvig + Inter, base/accent palette | Brand consistency |
| Custom navbar with dead buttons | Site `Navigation`; every CTA routes somewhere | No dead controls |
| Fixed `HERO_ROW_Y = 522` | Measured from `[data-hero-row]` | Depends on font metrics and wrapping |
| Fly right, sweep left, cards blink on | Deck forms, then spring deal-out | Matches the reference motion; reads as physical |
| Fan spread ±480px, mixed scales | Tighter ±390px fan, overlapping, right on top | Matches the reference; less empty space |
| Up/down scroll buttons | Removed | Duplicates native scrolling; visual noise |
| `overflow: hidden` implied | `overflow-x: clip` | Keeps scroll measurement and sticky working |
| No reduced-motion or mid-page reload handling | Both specified | Accessibility and robustness |
| Section 3 "Gateway to artist people" + autoplay banner | Feature rows with live demos, details list, library cards, FAQ, closing card (§7) | Shows the real product instead of stock artwork |
| Scroll fade-ins on every section, background blobs | None | Motion must map to input; decoration standing in for content |
| Illustrations as thumbnail-scale mock-ups | Real-size app windows on backdrops painted from the library's covers | Show the product; derive the palette from content |
| Third-party banner images | Removed; only the seven hero cards remain | Fewer assets to license before launch |
