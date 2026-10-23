# Colour

Source: `src/styles/global.css` (the `@theme inline` block, and the `:root` /
`:root[data-theme="dark"]` blocks, where Fluid Functionalism's variables are set on Curatit's
primitives since 2026-10-23). Live: `/system/colour`.

**The rule:** components use semantic tokens. Never primitives (`--gray-a3`), never raw values,
never Tailwind's palette, never `dark:` for a colour: every semantic token flips with the theme,
so one class is right in both. Two vocabularies name the same values: the library's
(`foreground`, `muted`, `border`, `hover`, `surface-N`) and Interfere's (`primary-foreground`,
`card`, `border-default`). Either is right; the library's is what the system components use. The
older `base-*` / `accent-*` scales are legacy; don't add new uses.

## The ink, the ground, the stroke

- `--foreground` (`text-foreground`, `bg-foreground`): the ink. Primary text, the primary button's
  fill, the Switch's on-track, the tooltip and the toast surface. White in dark mode.
- `--background` (`bg-background`, `text-background`): the page, and the text on the ink.
- `--border` (`ring-border`, `border-border`, `outline-border`, `decoration-border`): the one
  stroke, 12% of the ink. `border-default`, `border-subtle`, `border-strong` and `edge` all
  resolve to it now, so every hairline, ring and divider is the same line.
- `--focus-ring`: terracotta, the focus ring's colour and the one place the library's blue is replaced.

## Which background?

```
The page itself                         → bg-background (= bg-page, surface 1)
A grey mat under images or cards        → bg-card
A white card with a hairline            → bg-surface-3 shadow-surface-2 (Card variant="raised")
A menu or popover                       → two steps up the ladder, shadow-surface-3 (Menu does it)
A dialog                                → four steps up (Dialog does it); a toast: bg-foreground
A track, a tile, an icon's plate        → bg-muted (the Segmented track, EmptyState's tile)
A neutral badge fill, the switch off    → the --accent variable (grey; the Badge draws it)
A row or ghost control on hover         → bg-hover (4% ink; press: bg-active, 7%)
A see-through control fill              → the --tint variable (the muted Button)
The one primary action / a dark pill    → bg-foreground + text-background
A disabled control                      → the control at opacity 50 (built in), never a grey fill
```

Surfaces are the eight-step ladder `--surface-1..8` with `--shadow-1..8`: in light every surface
is white and the shadow carries the depth; in dark each step is a shade lighter than the page.
Raised components read their level from `useSurface()` and add to it (`Elevated offset`), so a
menu inside a dialog lands a step above the dialog. Outside the system, use the components.

## Which text colour?

```
Headings, body, labels that lead        → text-foreground (= text-primary-foreground)
Leads, meta, captions, help, counts     → text-muted-foreground (= text-secondary-foreground; anything that carries meaning)
Placeholders, decorative glyphs only    → text-tertiary-foreground     (under 4.5:1: never meaning)
Disabled                                → the control at opacity 50
On the primary button, a toast, a tooltip → text-background
Over a photo (must stay white)          → text-paper                    (paper never flips; --background does)
A link on hover                         → text-brand-foreground
An error                                → text-destructive + an icon + words
```

## Brand, status, borders

- **Brand (terracotta)** is an event: `--focus-ring` on every focus ring, `text-brand-foreground`
  on link hovers, the accent Button (the primary look with `--foreground` swapped to
  `--color-brand-solid`), the brand Badge (15% of the brand mixed into the page), Avatar initials
  on `bg-brand-subtle`. Never on headings, body copy or panels.
- **Status:** `--destructive` (danger-500; `text-destructive`, `ring-destructive/50` on an invalid
  field), `--success`, `--warning`, `--info` for the Notice's washes and glyphs. Red is for errors
  only. The Interfere scales (`danger-*`, `positive-*`, `warning-*`) remain for what still uses them.
- **Borders** are the one stroke: `ring-1 ring-border` (rings, dividers), `bg-border` (Separator;
  `bg-border/60` for the quiet line inside a menu). Never `border-2`, never a solid grey border.

## Exceptions (recorded, don't extend)

The footer's `--f-*` palette and the Vision page's `.vision-night` (both invert the page), the
`/agents` gradient (`.mcp-gradient`), the dashboard search's BorderBeam, category hues through
`light-dark()` from `src/lib/categories.ts`, and measured post colours shown as inline styles.

## Examples

```tsx
// Correct
<p className="text-caption-lg text-muted-foreground">Saved 2 days ago</p>
<div className="rounded-[24px] bg-card p-6">…</div>

// Incorrect: legacy scale, a meaning-carrying word in tertiary, and dark: for colour
<p className="text-base-400">Saved 2 days ago</p>
<div className="bg-gray-50 dark:bg-gray-900">…</div>
```
