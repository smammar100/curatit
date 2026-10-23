# Components: how they're built

The contract every atom and molecule follows. If a component breaks one of these, fix the
component, not the call site.

## Where things live

| Layer | Folder | Examples |
| --- | --- | --- |
| Atoms: one element, one job | `src/components/fundations/elements/` | Button, Badge, Text, Input, Textarea, Checkbox, Switch, Segmented, Avatar, Spinner, Skeleton, Kbd, Separator, TextLink |
| Molecules: atoms composed into a pattern | `src/components/fundations/molecules/` | Field, SearchField, Notice, Card, EmptyState, Menu, Dialog, Tooltip, Tabs, Toast |
| The vendored library (Fluid Functionalism) | `src/components/ui/`, `src/lib/`, `src/hooks/` | button, badge, switch, tabs, tabs-subtle, tooltip, dialog, dropdown, menu-item, card, banner, checkbox-group, scroll-area; springs, shape, size, surface, font-weight, icon-context; use-fluid-hover |
| Icons | `src/components/fundations/icons/` | Phosphor bold paths on `Icon.tsx` (Info, CircleNotch, …) |
| Layout | `src/components/fundations/containers/` | Wrapper |
| Older motion hooks | `src/lib/motion.ts` | useReducedMotion, useThumb, useGlide, usePresence (Toast and the dashboard's usePopover still use them) |

Keep the folder name `fundations` as spelled. Features import atoms and molecules, never
`src/components/ui/`.

## Inventory

"Wraps" is the library component behind the site's API; "—" means the atom is the site's own,
drawn on the library's tokens and systems.

| Component | File | Client? | Wraps | Sheet |
| --- | --- | --- | --- | --- |
| Button | elements/Button.tsx | no file directive; renders `ui/button` (client) | ui/button | /system/button |
| Badge | elements/Badge.tsx | no file directive; renders `ui/badge` (client) | ui/badge | /system/badge |
| Text | elements/Text.tsx | no | — | /system/type |
| Segmented | elements/Segmented.tsx | yes | ui/tabs (the segmented control) | /system/controls |
| Switch | elements/Switch.tsx | yes | ui/switch | /system/controls |
| Input | elements/Input.tsx | yes (reads the shape and size providers) | — (the library's field recipe) | /system/input |
| Textarea | elements/Textarea.tsx | yes | — (Input's recipe) | /system/textarea |
| Checkbox | elements/Checkbox.tsx | yes | — (drawn like ui/checkbox-group's square) | /system/checkbox |
| Avatar | elements/Avatar.tsx | yes (image fallback) | — | /system/avatar |
| Spinner | elements/Spinner.tsx | no | — (the library's figure-eight path) | /system/spinner |
| Skeleton | elements/Skeleton.tsx | no | — | /system/skeleton |
| Kbd | elements/Kbd.tsx | no | — | /system/kbd |
| Separator | elements/Separator.tsx | no | — | /system/separator |
| TextLink | elements/TextLink.tsx | no | — | /system/text-link |
| Field (+ FieldGroup) | molecules/Field.tsx | no | — | /system/field |
| SearchField | molecules/SearchField.tsx | yes | — (Input, Button, Kbd) | /system/search-field |
| Tabs (+ TabList, Tab, TabPanel) | molecules/Tabs.tsx | yes | ui/tabs-subtle | /system/tabs |
| Notice | molecules/Notice.tsx | yes | ui/banner | /system/notice |
| Card (+ CardMedia, CardTitle, CardMeta, CardDescription) | molecules/Card.tsx | yes | ui/card (the root only) | /system/card |
| EmptyState | molecules/EmptyState.tsx | no | — | /system/empty-state |
| Menu (+ items) | molecules/Menu.tsx | yes | ui/dropdown + ui/menu-item | /system/menu |
| Dialog | molecules/Dialog.tsx | yes | ui/dialog | /system/dialog |
| Tooltip | molecules/Tooltip.tsx | yes | ui/tooltip | /system/tooltip |
| Toast | molecules/Toast.tsx | yes | — (motion/react on the springs) | /system/toast |
| CopyBlock | components/mcp/CopyBlock.tsx | yes | — | /system/code |

A server page can render any of these; "client" only means the component's code ships to the
browser. Button and Badge have no `"use client"` of their own, but the library root they render
does, so they hydrate too.

## API conventions

- **One component per file**, PascalCase, default export. Compound parts are named exports of
  the same file (`Menu`, `MenuItem`, `MenuSeparator`).
- **Wrappers, not forks.** An atom that stands on a library component keeps the site's prop names
  and maps them onto the library's (`variant="muted"` → the library's `secondary`), so call sites
  never see the library's API. A prop the site no longer honours is still accepted and ignored,
  named in the component's docs (`shape` on Button and Badge, `tone` on Segmented, `radius` on
  Dialog, `tag` on Card, …), so older call sites compile.
- **Sizes are one step.** Every one of the site's size names maps onto the library's `compact`
  step (28px controls, 12/18 text, 14px icons); `lg` and `xl` are the same step, kept as names
  for call sites. The library's `default` step (36px, 13/20, 16px) exists in `src/lib/size-context.tsx`
  but no site component uses it. The step's classes come from `useSize()`, never a hard-coded `h-*`.
- **Shape from context.** Corners come from `useShape()` (`shape.button`, `shape.input`,
  `shape.container`, …), set once by `global/FluidRoot` (`ShapeProvider defaultShape="pill"`).
  Never `rounded-full` or a radius class on a control.
- **Weight by `fontVariationSettings`.** `style={{ fontVariationSettings: fontWeights.semibold }}`
  from `src/lib/font-weight.ts` (normal 400, semibold 550, bold 700, each with its `opsz`). Not a
  Tailwind `font-*` class: the library changes weight without reflow by reserving the heavier width.
- **Prop names:** `variant` (visual style), `size`, `tone` (semantic colour: `neutral`, `danger`,
  …). Booleans are adjectives (`invalid`, `disabled`, `loading`).
- **Closed unions from literal maps.** `const variants = { … } as const` with full class strings
  (Tailwind only generates classes it can read). Every prop has a default.
- **State:** controlled and uncontrolled the React way: `value` / `defaultValue` /
  `onValueChange`, `checked` / `defaultChecked` / `onCheckedChange`, `open` / `defaultOpen` /
  `onOpenChange`. Switch, MenuItemCheckbox and MenuRadioGroup are controlled only.
- **`className` last, for layout only** (margins, width, grid placement). The wrappers join
  classes with `cn` from `@/lib/utils` (clsx + tailwind-merge), so a later class does win, but a
  colour, size, radius or shadow there is still a second look the sheet doesn't show: add a variant
  instead. `cx` (`@/lib/cx`), with no merge, remains in features.
- **Rest props** go on the root element; `ref` passes through (React 19: a plain prop).
- **Accessibility in the types:** icon-only controls require `aria-label` or
  `aria-labelledby`; form controls take `id`/`aria-*` from `Field` automatically; Switch requires
  a `label`.
- **Focus ring:** one ring everywhere, 1px of `--focus-ring` (terracotta) 2px outside the
  element: `focus-visible:outline-1 focus-visible:outline-offset-2
  focus-visible:outline-[color:var(--focus-ring)]`, or the library's own
  `focus-visible:ring-1 ring-[color:var(--focus-ring)]`. The base `:focus-visible` rule in
  `global.css` draws the same ring on anything else, with the shape's radius
  (`--shape-input-radius`, 20px, set on `<html>` by the ShapeProvider).
- **Touch:** controls under 44px reach it with an invisible `pointer-coarse:after:` area.
- **Motion:** the springs (`src/lib/springs.ts`), `duration-80` for colour; each molecule that
  animates wraps its own `<MotionConfig reducedMotion="user">` (there is no root MotionConfig,
  which keeps `motion/react` out of the homepage hero's path).
- **Header comment:** what it is, when to use it, what to use instead, what changed on
  2026-10-23. Plain English.

## The vendored library

Fluid Functionalism ships no package: each piece is a shadcn registry item copied into the repo
on 2026-10-23 with

```
npx shadcn@latest add https://www.fluidfunctionalism.com/r/<name>.json --overwrite
```

(`components.json` points the CLI at `src/styles/global.css` and the `@/` aliases; `--overwrite`
replaces a file that is already there, which is why a re-install must be diffed first). An item
writes its component into `src/components/ui/`, its systems into `src/lib/` and `src/hooks/`, and
its variables into `global.css`. The variables were then set on Curatit's own primitives (the
`:root` and `:root[data-theme="dark"]` blocks), and the older tokens remapped onto them in
`@theme`, so the library and the rest of the site share one ink, stroke and depth. After changing
the tokens run `node scripts/theme-scopes.mjs`, which regenerates the scoped copies `/system`
uses to show both themes side by side.

Local patches, each marked `Curatit:` in the file, and why:

- `src/lib/shape-context.tsx`: the radii written in px (`rounded-[20px]`, `rounded-[24px]`),
  because the site's `rounded-*` names are Interfere's scale, not Tailwind's.
- `src/lib/icon-context.tsx`: the default icon set is the site's Phosphor icons, so Lucide never
  enters a bundle (`docs/design/icons.md`).
- `ui/switch.tsx`: the on-track is `--foreground` (the ink, not blue), the thumb `bg-background`,
  and a `labelHidden` prop for a switch whose words a Field draws.
- `ui/card.tsx`: the library's `bg-card` became `bg-surface-3` (on the site `bg-card` is the
  grey mat), and its `bg-accent` the raw variable `bg-[var(--accent)]`, since the site's
  `accent-*` classes are terracotta.
- `ui/tabs-subtle.tsx`: a tab's label is a ReactNode (so a count can follow it) and `disabled` is
  forwarded.
- `ui/dropdown.tsx`: `DropdownContent` takes `aria-label`, `aria-labelledby` and
  `onCloseAutoFocus`, which Menu needs for its name and its `returnFocus` rule.

To update a piece: run the `add` command without `--overwrite` into a scratch folder, or diff
the new file against the vendored one, re-apply the `Curatit:` patches by hand, run the sheets in
both themes, then `npx tsc --noEmit -p .` and `npm test`. Don't edit a vendored file to change a
timing, a colour or a radius for one use: wrap it, or set its variables on the wrapper the way
Button's accent variant does (`[--foreground:var(--color-brand-solid)]`).

## Adding a component

1. Check the inventory: extend an existing component with a variant before adding a new one.
2. Prefer the library's component: if fluidfunctionalism.com has it, install it with the command
   above, then wrap it in `elements/` (atom) or `molecules/` (molecule) behind a site API under
   the conventions here. Only build from scratch when the library has nothing for the job.
3. Add its sheet: `src/components/system/sheets/<group>/<Name>.tsx`, a topic in
   `src/components/system/topics.ts` and its entry in `sheets/index.ts`. A component that renders
   in a portal shows the site's theme on the side-by-side panels, not the panel's; say so in the
   sheet.
4. Document it in the group file in `docs/design/` (when to use it, the alternative, the closed
   set and its default, one correct and one incorrect example) and add it to the inventory here.
5. `npx tsc --noEmit -p .`, `npm test`, and look at its sheet in both themes and at 375px.
