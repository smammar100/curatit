---
name: curatit-design
description: Curatit's design system - tokens, type, motion, and the atoms and molecules every UI must be built from. Use whenever creating or modifying UI in this repo (new pages, sections, components) so the result matches Curatit's visual language.
---

# Curatit design system

The rules live in one place: **`DESIGN.md`** at the repo root. Read it before any UI change, then
the topic file in `docs/design/` for what you're touching:

| File | What it decides |
| --- | --- |
| `docs/design/components.md` | How components are built, the inventory, how to add one |
| `docs/design/colour.md`, `type.md`, `shape.md`, `motion.md`, `layout.md`, `icons.md`, `voice.md` | The foundations |
| `docs/design/actions.md`, `forms.md`, `display.md`, `feedback.md`, `overlays.md`, `navigation.md` | The components, with correct and incorrect examples |

The live reference is `/system` (every token and component rendered in light and dark); its
sources are in `src/components/system/sheets/`.

## The short version

- Since 2026-10-23 the system is built on Fluid Functionalism (fluidfunctionalism.com), vendored
  with the shadcn CLI into `src/components/ui/` (components), `src/lib/` (springs, shape, size,
  surfaces, font-weight, icon-context) and `src/hooks/`, with the owner's settings: pill corners,
  the compact size step (28px controls), Phosphor icons, Radix. `fundations/` wraps it behind the
  site's own APIs; installed files are edited only where marked `Curatit:` (wrap, don't retime).

- Build from the system: atoms in `src/components/fundations/elements/` (Button, Badge, Text,
  Input, Textarea, Checkbox, Switch, Segmented, Avatar, Spinner, Skeleton, Kbd, Separator,
  TextLink), molecules in `src/components/fundations/molecules/` (Field, SearchField, Notice,
  Toast, EmptyState, Card, Menu, Dialog, Tooltip, Tabs). Never hand-roll one.
- Semantic tokens only: the ink `text-foreground`, the muted ink `text-muted-foreground`, the one
  stroke `border-border` / `ring-border`, the overlays `bg-hover` / `bg-active`, the surface
  ladder `bg-surface-N shadow-surface-N`, the 1px focus ring `--focus-ring`; no `base-*`/`accent-*`
  in new code, no Tailwind palette, no hex, no `dark:` for colour or shadow.
- Serif headings through `Text` (regular, never bold); the dashboard uses its six type roles.
- Terracotta only on hovers, focus rings, links and the accent Button.
- Closed sets of variants and sizes; `className` for layout only. Radius and control height come
  from the shape and size providers, never hard-coded; weights through `fontVariationSettings`.
- Motion from the library's springs (`spring.fast/moderate/slow` and their `.exit`), 80ms colour
  changes, one fluid hover highlight per list; transform and opacity; `MotionConfig
  reducedMotion="user"` round each animating molecule; nothing on repeated keys.
- Check light, dark, 375px and the keyboard; run `npx tsc --noEmit -p .` and `npm test`.
