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
- **Images:** the seven cards and three banner slides live in `public/landing/`. Render them with
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
<Landing>                      relative container, bg-white, overflow-x: clip   ← containerRef
  <Blobs />                    fixed z-0 decoration
  {nav}                        site Navigation (fixed, z-20)
  <ScrollCards />              global card overlay, z-5 (see §4)
  <Hero />                     section 1
  <SectionTwo />               section 2, data-section="two"
  …further sections           see §7
</Landing>
<Footer />                     outside the container so it doesn't affect scroll maths
```

**Blobs** (`pointer-events-none fixed inset-0 z-0`): three radial-gradient blurs.
(a) top 5%, left 8%, 300×300, `radial-gradient(circle, rgba(180,180,180,0.12), transparent 70%)`, blur 40px;
(b) top 8%, right 10%, 250×250, the same gradient, blur 40px;
(c) top 30%, left 50% (−50% translate), 600×400, `rgba(160,160,160,0.08)` to transparent at 70%, blur 60px.

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
- Eyebrow: `text-xs font-medium uppercase text-base-500`, letter-spacing 2.5px, text "RESEARCH BOARDS".
  It blurs in on view (`once`, margin −80px).
- `h2` (`font-display font-light`, `clamp(40px, 5vw, 60px)`, line-height 1.05), three lines:
  "Search, save" (`text-base-900`), "& share references" (`text-accent-600`), "for every brief."
  (`text-base-900`). Words blur in with a 0.06s stagger.
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

Four sections, designed from Mobbin references and built from **real library data**. `app/page.tsx` calls
`landingLibrary()` from `lib/services/creatives.ts` (three covers and a count per category, plus one sample
carousel's analysis) and passes it to `<Landing library={…} />`. Nothing here is a static screenshot.

Every section reveals on view: `{ opacity: 0, y: 24, filter: "blur(8px)" }` to rest, 0.6s, `smoothEase`,
`once`, margin −80px. Horizontal padding is `px-8 md:px-16`; content is capped at `max-w-7xl`, centred.

**7.1 How it works** (refs: FLORA numbered panels; Kastle serif header).
- Top padding `pt-40 lg:pt-64`, so the pinned cascade (whose lowest card sits about 250px into this section)
  scrolls past without covering the header.
- Centred header: an outlined eyebrow pill "HOW IT WORKS" (`ring-1 ring-base-200`, uppercase, 2.5px
  tracking), `h2` `displayLG font-display font-light` "From brief to board, *in three steps.*" (the second
  clause in `text-accent-600`), and a one-line `text-base-600` subhead.
- Three columns (`lg:grid-cols-3`, `gap-8`), staggered 0.08s. Each is a `rounded-lg bg-base-50 p-8` panel,
  22rem tall, with a large serif numeral (`text-5xl text-base-300`) above a small slice of real product UI,
  then a `font-medium` title and a `text-sm text-base-600` description underneath:
  - **01 Search by brief:** a search field showing "finance carousels explaining a feature", three accent
    "+ Category / + Media type / + Objective" chips, and three real covers.
  - **02 Understand the pattern:** one real carousel cover beside divided rows (Objective, Structure,
    Style, Narrative) from its analysis, and "Brand — hook" underneath.
  - **03 Build and share the board:** a mini board card with a title, a "Link active · 7 days" chip,
    four covers, and a private-note line.

**7.2 Inside the library** (refs: Melius fanned stack; MasterClass category grid).
- Header row: eyebrow "INSIDE THE LIBRARY", serif `h2` "Six categories, studied closely.", and a right-aligned
  `text-sm` paragraph explaining the narrow-and-deep launch.
- A `sm:grid-cols-2 lg:grid-cols-3` grid of category tiles. Each is a `h-72 rounded-lg bg-base-50` panel
  holding that category's three covers as a fanned stack (`w-32`, rest poses x −18/+18/0 and rotate
  −6°/+6°/0°). On hover or focus it spreads to x −64/+64/0 and rotate −10°/+10°/0°, with the front card
  lifted 6px, using `hoverEase` over 0.35s. Below: the category name and "N references →".
- Links: `/library?category=<id>` when signed in, otherwise `/signup?next=` that URL.
- A small `text-base-400` note under the grid saying the preview uses the demo library of fictional brands.

**7.3 FAQ** (refs: Fiasco / Amigo split layout).
- `lg:grid-cols-[1fr_1.4fr]`. Left: eyebrow "QUESTIONS" and serif `h2` "The ones that tend to crop up."
  Right: native `<details>` rows between `border-y divide-y divide-base-200`, a `text-base` question with a
  `Plus` icon that rotates 45° when open, and a `text-sm text-base-600` answer.
- Reuse the `faqs` array exported from `components/global/Faq.tsx`, so pricing and landing never drift.

**7.4 Closing call to action** (ref: The Leap).
- A `rounded-lg bg-base-900` panel, `py-24`, centred, with a soft `accent-600` radial glow rising from the
  bottom edge (blur-3xl, 40% opacity).
- Two-line serif `h2` (`text-4xl md:text-5xl lg:text-6xl font-light`): "Reference, not copying." in white,
  "Start with your next brief." in `text-base-400`. A `text-sm text-base-300` line about attribution.
- One white button (`h-11 rounded-lg`): "Get access" → `/signup`, or "Open the library" → `/library`.
- Entrance: `y: 40, blur(12px)` to rest, 0.8s.

### 8. Done when

- [ ] `npx tsc --noEmit`, `npm test`, and `npm run build` pass. For verification builds while a dev server
      is running, use `NEXT_DIST_DIR=.next-build npm run build`.
- [ ] At 1440×900 and 1200×700: the deck deals out with no card popping in or out; the fan gathers into one
      card with one shadow; the cascade lands under Section 2's text and scrolls away with the page.
- [ ] Reloading mid-page shows the correct scroll pose immediately, with no replayed intro.
- [ ] With `prefers-reduced-motion: reduce`, the page shows a settled fan and no intro.
- [ ] At 375px wide: no horizontal scroll and nothing overlaps the headline or buttons.
- [ ] Scrolled to the top of §7.1, the lowest cascade card sits above the "How it works" heading.
- [ ] Library tiles show three real covers each and link to the filtered library (or to sign-up).
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
| Section 3 "Gateway to artist people" + autoplay banner | How it works, library showcase, FAQ, closing CTA (§7) | Explains the product with real data instead of stock artwork |
| Third-party banner images | Removed; only the seven hero cards remain | Fewer assets to license before launch |
