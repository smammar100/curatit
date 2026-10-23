# Motion

Sources: `src/lib/springs.ts` (the tiers), `src/hooks/use-fluid-hover.ts` and
`src/components/fluid-hover-highlight.tsx` (the hover highlight), the vendored components in
`src/components/ui/`, and, for what still uses them, the easing and animation tokens in
`src/styles/global.css` and the hooks in `src/lib/motion.ts`. Live, with replayable demos:
`/system/motion`.

Motion is feedback: a press landed, where a menu came from, where a selection went. Since
2026-10-23 the system components animate with `motion/react` on three spring tiers; features
still use CSS first.

## The closed sets

| Tier | Enter | Exit | Bounce | Used for |
| --- | --- | --- | --- | --- |
| `spring.fast` | 80ms | 60ms | 0 | A hover pill following the pointer, the focus ring springing between options, a tooltip (a 4px slide), a menu opening from its trigger's side |
| `spring.moderate` | 160ms | 120ms | 0 | A selection pill travelling (Segmented, Tabs), the switch's thumb, a toast rising 8px, a menu's selected fill moving to the next choice |
| `spring.slow` | 240ms | 160ms | 0.12 | A dialog (scale 0.97 and fade, the overlay fading with it), a Notice growing in |

An exit is always one tier quicker than its entrance. Colour changes (hover, a label brightening,
a link) take 80ms: `transition-colors duration-80`. Small drawn marks are tweens: the checkbox's
check draws in 80ms and retracts in 40ms. Durations and bounces are the tokens' values, never a
number written in a component.

## Where it comes from

- **One hover highlight.** A list (menu rows, tabs, segmented options) renders one absolutely
  positioned fill that `useFluidHover` moves to the item nearest the pointer; the items stay
  transparent. A click in a gap lands on the lit item. Don't add `hover:bg-*` to a row of a
  system list: there is already a highlight, and two would fight.
- **Weight without reflow.** A chosen label gets heavier by `fontVariationSettings`; the width
  of the heavier label is reserved, so nothing beside it moves.
- **Presence.** A popup stays mounted until its exit has played (the library's
  `exitFallbackMs()` force-unmounts it if a background tab stalls the animation).
- **Reduced motion.** Each molecule that animates wraps its own
  `<MotionConfig reducedMotion="user">`, so `prefers-reduced-motion` turns transforms off and
  keeps fades. There is no root MotionConfig: it would put `motion/react` in the homepage hero's
  path. The homepage islands' `MotionProvider` (framer-motion's `LazyMotion`) is no longer
  `strict`, because a Segmented or a Switch inside a section renders `motion.*` itself.

## The older set (kept for what still uses it)

The easing tokens `ease-out-quint` (enter, respond), `ease-in-out-quart` (move on screen) and
`ease-in-quart` (exit), the `animate-menu-in` / `-out`, `animate-toast-in` / `-out`,
`animate-fade-in` / `-out` and `animate-rise-in` utilities, `.dialog-motion` for a native
`<dialog>`, and the hooks in `src/lib/motion.ts`: `useThumb` (a sliding thumb), `useGlide` (a
mouse-only hover glide), `usePresence(open, exitMs)` (holds an element through its exit; Toast
still uses it) and `useReducedMotion()`. The dashboard's `usePopover`, the demos and the
marketing pages are on these. Don't put them on a system component; when a feature moves onto
the system, its hand-rolled motion goes with it.

## Rules

- Animate `transform` and `opacity`. Exceptions with reasons: a thumb's width (the switch's
  stretch and squash), a selection pill's size, the homepage divider's clip-path, the theme
  icon's blur.
- Name the properties: `transition-colors`, `transition-[background-color,box-shadow]`. Never
  `transition-all` or a bare `transition`.
- Nothing on keyboard-repeated input, focus styles are instant (the focus ring springs between
  options inside one control, but never delays).
- Nothing animates because the page loaded (recorded showpieces aside).
- Loops run only on screen and in a visible tab, and stop when the visitor takes over.
- `motion/react` only through the system components; framer-motion only inside homepage islands
  (`components/home/islands.tsx`), never the hero.

```
Which tier?
 ├── It follows the pointer or opens from a trigger → spring.fast
 ├── It's already on screen and travelling to a new place → spring.moderate
 └── It takes the whole screen → spring.slow
```

```tsx
// Correct (inside a molecule)
<MotionConfig reducedMotion="user">
  <motion.div animate={{ opacity: 1, y: 0 }} transition={spring.moderate} />
</MotionConfig>

// Incorrect: transition-all, Tailwind's weak curve, a layout property, a number of its own
<div className="transition-all duration-300 ease-out hover:w-64" />
<motion.div transition={{ type: "spring", duration: 0.3 }} />
```
