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

- Build from the system: atoms in `src/components/fundations/elements/` (Button, Badge, Text,
  Input, Textarea, Checkbox, Switch, Segmented, Avatar, Spinner, Skeleton, Kbd, Separator,
  TextLink), molecules in `src/components/fundations/molecules/` (Field, SearchField, Notice,
  Toast, EmptyState, Card, Menu, Dialog, Tooltip, Tabs). Never hand-roll one.
- Semantic tokens only (`bg-card`, `text-secondary-foreground`, `ring-border-default`); no
  `base-*`/`accent-*` in new code, no Tailwind palette, no hex, no `dark:` for colour or shadow.
- Serif headings through `Text` (regular, never bold); the dashboard uses its six type roles.
- Terracotta only on hovers, focus rings, links and the accent Button.
- Closed sets of variants and sizes; `className` for layout only (`cx` doesn't merge).
- Motion from the tokens; transform and opacity; nothing under reduced motion or on repeated keys.
- Check light, dark, 375px and the keyboard; run `npx tsc --noEmit -p .` and `npm test`.
