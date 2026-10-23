# Colour

Source: `src/styles/global.css` (@theme and the `:root` / `:root[data-theme="dark"]` blocks).
Live: `/system/colour`.

**The rule:** components use semantic tokens. Never primitives (`--gray-a3`), never raw values,
never Tailwind's palette, never `dark:` for a colour: every semantic token flips with the theme,
so one class is right in both. The older `base-*` / `accent-*` scales are legacy (the same
values, solid instead of alpha); don't add new uses.

## Which background?

```
The page itself                         → bg-page
A grey mat under images or cards        → bg-card
A white card with a hairline            → bg-container + shadow-xs
A menu, popover, dialog, toast surface  → bg-modal (+ shadow-lg; dialogs shadow-xl)
A white control on a white surface      → bg-component-on-container-subtle (inputs, secondary button)
A chip, track or quiet control          → bg-component (hover: -hover, press: -active)
A row or ghost control on hover         → bg-transparent-hover (press: bg-transparent-active)
The one primary action / a dark pill    → bg-inverted-solid (+ text-on-inverted-foreground)
A rare dark surface (code blocks)       → bg-standout (+ text-on-standout-primary-foreground)
A disabled control                      → bg-disabled (+ text-disabled-foreground)
```

## Which text colour?

```
Headings, body, labels that lead        → text-primary-foreground
Leads, meta, captions, help, counts     → text-secondary-foreground   (anything that carries meaning)
Placeholders, decorative glyphs only    → text-tertiary-foreground     (under 4.5:1: never meaning)
Disabled                                → text-disabled-foreground
On the primary button / inverted fill   → text-on-inverted-foreground
Over a photo (must stay white)          → text-paper                    (white never flips; --color-white does)
A link on hover                         → text-brand-foreground
An error                                → text-danger-foreground + an icon + words
```

## Brand, status, borders

- **Brand (terracotta)** is an event: `text-brand-foreground` on link hovers,
  `outline-brand-border-focus` on every focus ring, `bg-brand-solid` on the accent Button,
  `bg-brand-subtle` for the brand Badge. Never on headings, body copy or panels.
- **Status:** `danger`, `positive`, `warning`, each `-solid`, `-subtle`, `-foreground`
  (danger also `-border-default`). Red is for errors only.
- **Borders** are alpha tints: `ring-1 ring-border-default` (rings, dividers),
  `ring-border-subtle` (faint), `ring-border-strong` (outline badge). `edge` is the 1px line
  inside images. Never `border-2`, never a solid grey border.

## Exceptions (recorded, don't extend)

The footer's `--f-*` palette and the Vision page's `.vision-night` (both invert the page), the
`/agents` gradient (`.mcp-gradient`), the dashboard search's BorderBeam, category hues through
`light-dark()` from `src/lib/categories.ts`, and measured post colours shown as inline styles.

## Examples

```tsx
// Correct
<p className="text-caption-lg text-secondary-foreground">Saved 2 days ago</p>
<div className="rounded-2xl bg-card p-6">…</div>

// Incorrect: legacy scale, a meaning-carrying word in tertiary, and dark: for colour
<p className="text-base-400">Saved 2 days ago</p>
<div className="bg-gray-50 dark:bg-gray-900">…</div>
```
