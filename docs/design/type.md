# Type

Sources: `src/components/fundations/elements/Text.tsx`, the `--text-*` tokens in
`src/styles/global.css`, `src/lib/type-scale.ts` (dashboard roles), fonts in `src/app/layout.tsx`.
Live: `/system/type`.

**Two families.** Hedvig Letters Serif (`font-display`) for headings, the wordmark and the
dashboard's display role: one regular weight, never bold (`html` has
`font-synthesis-weight: none`). Inter (`font-sans`) for everything else. Never another font.

## Marketing, auth, share and docs pages: `<Text>`

| Variant | Size / leading (phone → lg) | Use |
| --- | --- | --- |
| `h1` | 36 → 44 → 56 | Page titles; every homepage section heading |
| `h2` | 28 → 36 → 44 | Section headings elsewhere |
| `h3` | 24 → 28 → 36 | Sub-sections, sheet titles |
| `h4` | 24 → 28 | Panel titles |
| `h5` | 20 → 24 | Card groups, the auth card title |
| `h6` | 20 | Card titles |
| `bodyLG` / `body` (default) / `bodySM` | 18/24, 15/24, 13/20 | Leads, running text, UI text |
| `captionLG` / `caption` / `captionSM` / `captionXS` | 12, 11, 10 on 16; 8/12 | Meta, small print |

Old names (`displayLG`, `textBase`, …) still map onto these; write the new names. Heading variants
already set `font-display font-normal`: never add a weight or font class to them.

```
Which variant?
 ├── The page's title → tag="h1" variant="h1"
 ├── A homepage section → tag="h2" variant="h1"
 ├── A section elsewhere → tag="h2" variant="h2" (or h3)
 ├── A card title → tag="h3" variant="h6", or bodySM + font-medium
 ├── Running text → body, in text-secondary-foreground for leads
 └── Meta under a card → captionLG (uppercase adds tracking-wider)
```

## Dashboard, review and onboarding: the six roles

`text-display` 28/34 (serif, light), `text-title` 16/22, `text-subtitle` 14/20 (primary buttons,
menu items), `text-body` 13/20 (the default inherited), `text-caption` 12/16, `text-micro` 11/14.
Compact steps exist through `useSize("compact")`. Fields add `pointer-coarse:text-[16px]` so iOS
doesn't zoom. No Tailwind `text-sm`/`text-xs` and no pixel sizes.

## Rules

- Weights: `font-normal` 400, `font-semimedium` 450, `font-medium` 500, `font-semibold` 600.
  Labels and buttons are medium; never bold body copy for emphasis in a paragraph's flow.
- Headings balance and paragraphs wrap `pretty` by default (no widows): don't fight it.
- Running text is at most 65ch wide.
- Uppercase labels always add `tracking-wider`.
- Numbers are tabular by default (`tnum` on `:root`); Hedvig has no tabular figures.

```tsx
// Correct
<Text tag="h2" variant="h1" className="text-primary-foreground">Find the post that works.</Text>

// Incorrect: raw tag with ad-hoc size, and a bold serif
<h2 className="font-display text-5xl font-bold">Find the post that works.</h2>
```
