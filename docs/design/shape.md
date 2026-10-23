# Shape and depth

Sources: `src/lib/shape-context.tsx` (the corners), `src/lib/surface-context.tsx`,
`surface-classes.ts` and `elevated.tsx` (the depth ladder), and the `--surface-*` / `--shadow-*`
variables in `src/styles/global.css`. Live: `/system/shape`.

## Radius: the shape context

Corners are not chosen per element. `global/FluidRoot` sets `<ShapeProvider defaultShape="pill">`
for the whole site (the owner's setting, 2026-10-23), and every system component reads
`useShape()`:

| `useShape()` key | Class | Used for |
| --- | --- | --- |
| `button`, `input`, `item`, `bg` | `rounded-[20px]` | Buttons, fields, the Segmented and Tabs pills, tooltips, toasts, a `rect` Skeleton at `radius="lg"` |
| `container` | `rounded-[24px]` | Dialogs, cards, textareas, the Notice, a Skeleton at `radius="2xl"` |
| `focusRing` | `rounded-[22px]` | The focus ring 2px outside a pill, so the two stay concentric |
| `mergedBg` | `rounded-[16px]` | The joined fill of neighbouring checked menu rows |

Two deliberate exceptions inside the library: the menu popup keeps the `rounded` shape (a 12px
container with 8px rows: at that scale a pill distorts the padding), and the checkbox is a 4/5px
square. Small corners that are the site's own: `rounded-[4px]` on a text link's and a card
title's focus ring, `rounded-[5px]` on a Kbd cap.

**Nested radius:** inner = outer − inset (`nestedRadius()` in `shape-context.tsx`). A 24px card
with 8px of padding holds 16px media; with 16px, 8px; with 24px, 4px (`CardMedia` does this
through `--card-media-radius`). Never the same radius inside and out. Never a radius class on a
control: if a component's corner looks wrong, the provider or the component is wrong, not the
call site. Interfere's `--radius-*` scale (`rounded-sm` 4 … `rounded-5xl` 24) remains for
features that still use it; new system code reads the context.

## Depth: one ladder

Eight surfaces, each with a shadow recipe: `bg-surface-N shadow-surface-N`
(`surfaceClasses(level)`). In light every surface is white and the shadow alone says how high it
sits (a 1px ring of 6% black, then stacked drops that double each step); in dark each surface is
a step lighter than the page (`#222` to `#4c4c4c`) and the shadow is an inset highlight, an inset
ring and drops. `useSurface()` says what level a component sits on (the page is 1); `Elevated`
adds an offset and provides the new level to what's inside, so stacking walks up by itself.

| What | Level | Shadow |
| --- | --- | --- |
| The page | 1 | none |
| A white card (`Card variant="raised"`), a focused field | 3 | `shadow-surface-2` (the card), none (the field) |
| A menu or popover | substrate + 2 | `shadow-surface-3`, whatever it opens over |
| A toast | — (the ink) | `shadow-surface-4` |
| A dialog | substrate + 4 | its level's |

Tailwind's shadow names are steps of the same ladder, so older code shares it: `shadow-xs` = 1
(a hairline), `shadow-sm` and the bare `shadow` = 2, `shadow-md` = 3, `shadow-lg` = 4,
`shadow-xl` = 6, `shadow-2xl` = 8. Never `shadow-[…]` for depth, never `dark:ring-*` to stand in
for a shadow. The one arbitrary shadow allowed is a selection line, not depth:
`shadow-[inset_0_-2px_0_currentColor]`, the `/system` nav's underline (the Checkbox's 1.5px
stroke is also a box-shadow, so it can go transparent when checked).

## The stroke

One: `--border`, 12% of the ink. `ring-1 ring-border` on fields and the secondary button,
`bg-border` for a Separator, `outline-border` inside an image, `divide-border-default` on a list
(the older names resolve to the same value). No `border-2`; a selected outline is the pressed
pill (`bg-active`), not a ring.

```tsx
// Correct: the card's corner from the system, the menu's depth from the component
<Card variant="raised" padding="md"><CardMedia>…</CardMedia></Card>
<Menu label="Board actions" trigger={…}>…</Menu>

// Incorrect: ad-hoc shadow, a dark: ring standing in for it, a pill by hand, the same radius inside and out
<div className="rounded-full bg-white p-1.5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.3)] dark:ring-1">
  <button className="rounded-full …">Rename</button>
</div>
```
