---
name: curatit-design
description: Curatit's design system - Glaze, with Fluid Functionalism's type, motion and surfaces. Use whenever creating or modifying UI in this repo (new pages, sections, components) so the result matches Curatit's visual language.
---

# Curatit design system

Curatit is built on Glaze (design.how), with three systems kept from Fluid Functionalism: type,
motion and surfaces. Read, in order:

1. **`DESIGN.md`** at the repo root: the layers, the non-negotiables, what stays Fluid
   Functionalism's and how.
2. **`.agents/skills/glaze/SKILL.md`**: Glaze's rules in priority order, the anti-slop list, the
   closed token list and the component index with imports.
3. The page of each Glaze component you use: `https://design.how/systems/glaze/components/<name>.md`.
4. **`src/styles/glaze-bridge.css`**: how the kept type, motion and surfaces meet Glaze's tokens.
5. **`docs/design/voice.md`** for copy.

The live reference is `/system` (every token and component in light and dark).

## The short version

- Glaze components from `@/components/glaze/ui/*`, icons through `<Icon icon={X}/>` from
  `@/components/glaze/icon`. Never hand-roll a control or copy a component's classes.
- Tokens by role: `text-text-1/2/3`, `bg-page/paper/shell/field`, `border-line-*`, status roles,
  corners by size (pill for one-line controls; 2XS 6 `rounded-tag`, XS 12 `rounded-(--corner-xs)`, S 16
  `rounded-panel`, M 24 `rounded-(--radius-float)`) and nested as outer less gap (`/system/radius`), the
  4px scale. No hex, palette, arbitrary px, `dark:` or
  inline styles. No brand accent.
- Type: Glaze's `type-*` roles (on FF's scale), `<Text>` on marketing pages. Motion: Glaze's motion
  tokens (FF's tiers), `spring` from `src/lib/springs.ts`. Surfaces: Glaze's recipes (on FF's ladder),
  `bg-surface-N shadow-surface-N` where nothing else fits.
- `npx eslint -c glaze.eslint.config.mjs .`, `npx tsc --noEmit -p .` and `npm test` before done;
  then look at it at 390 and 1280, light and dark.
