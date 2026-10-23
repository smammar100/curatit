# Motion

Sources: easing and animation tokens in `src/styles/global.css` (@theme), `.dialog-motion`, and
the hooks in `src/lib/motion.ts`. Live, with replayable demos: `/system/motion`.

Motion is feedback: a press landed, where a menu came from, where a selection went. CSS first.

## The closed sets

| What | Value |
| --- | --- |
| Enter, respond, hover, press | `ease-out-quint` |
| Something already on screen moving to a new place | `ease-in-out-quart` |
| Exits | `ease-in-quart` |
| Hover and colour | 150ms |
| Press | 150ms to `scale-[0.97]`, behind `motion-safe:` (Button has it) |
| Enter | 150–200ms |
| Exit | 120–140ms, always shorter than the enter |
| Travel across a surface | 400ms |

Animation utilities: `animate-menu-in` / `-out`, `animate-toast-in` / `-out`, `animate-fade-in` /
`-out`, `animate-rise-in`; exits are `forwards` and held by `usePresence` until they unmount.
Dialogs use `.dialog-motion`.

## Hooks (`src/lib/motion.ts`)

- `useThumb(value)`: a sliding selection thumb (Segmented, Tabs). Snaps on keyboard input, on
  first measure and on resize; until `ready`, the selected option wears the fill itself.
- `useGlide()`: the mouse-only hover highlight that glides between menu rows.
- `usePresence(open, exitMs)`: keeps an element mounted while its exit plays.
- `useReducedMotion()`: one shared media query.

## Rules

- Animate `transform` and `opacity`. Exceptions with reasons: a thumb's width/height, the
  switch's press stretch, the homepage divider's clip-path, the theme icon's blur.
- Name the properties: `transition-colors`, `transition-[translate,opacity]`. Never
  `transition-all` or a bare `transition`; always write the `ease-*` class.
- Nothing on keyboard-repeated input (arrows snap), focus styles are instant.
- Reduced motion: nothing moves or scales; menus, toasts and dialogs appear and go at once.
- Nothing animates because the page loaded (recorded showpieces aside).
- Loops run only on screen and in a visible tab, and stop when the visitor takes over.
- framer-motion only inside homepage islands (`components/home/islands.tsx`), never the hero.

```
Which easing?
 ├── It's leaving → ease-in-quart, shorter than its entrance
 ├── It's already on screen and travelling → ease-in-out-quart
 └── Anything else (entering, hover, press, a thumb) → ease-out-quint
```

```tsx
// Correct
<div className="origin-top-right animate-menu-in data-closing:animate-menu-out motion-reduce:animate-none" />

// Incorrect: transition-all, Tailwind's weak curve, a layout property
<div className="transition-all duration-300 ease-out hover:w-64" />
```
