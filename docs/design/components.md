# Components: how they're built

The contract every atom and molecule follows. If a component breaks one of these, fix the
component, not the call site.

## Where things live

| Layer | Folder | Examples |
| --- | --- | --- |
| Atoms: one element, one job | `src/components/fundations/elements/` | Button, Badge, Text, Input, Textarea, Checkbox, Switch, Segmented, Avatar, Spinner, Skeleton, Kbd, Separator, TextLink |
| Molecules: atoms composed into a pattern | `src/components/fundations/molecules/` | Field, SearchField, Notice, Card, EmptyState, Menu, Dialog, Tooltip, Tabs, Toast |
| Icons | `src/components/fundations/icons/` | Phosphor bold paths on `Icon.tsx` |
| Layout | `src/components/fundations/containers/` | Wrapper |
| Motion hooks | `src/lib/motion.ts` | useReducedMotion, useThumb, useGlide, usePresence |

Keep the folder name `fundations` as spelled.

## Inventory

| Component | File | Client? | Sheet |
| --- | --- | --- | --- |
| Button | elements/Button.tsx | no (loading needs a client parent) | /system/button |
| Badge | elements/Badge.tsx | no | /system/badge |
| Text | elements/Text.tsx | no | /system/type |
| Segmented | elements/Segmented.tsx | yes | /system/controls |
| Switch | elements/Switch.tsx | yes | /system/controls |
| Input | elements/Input.tsx | no | /system/input |
| Textarea | elements/Textarea.tsx | no | /system/textarea |
| Checkbox | elements/Checkbox.tsx | no | /system/checkbox |
| Avatar | elements/Avatar.tsx | yes (image fallback) | /system/avatar |
| Spinner | elements/Spinner.tsx | no | /system/spinner |
| Skeleton | elements/Skeleton.tsx | no | /system/skeleton |
| Kbd | elements/Kbd.tsx | no | /system/kbd |
| Separator | elements/Separator.tsx | no | /system/separator |
| TextLink | elements/TextLink.tsx | no | /system/text-link |
| Field | molecules/Field.tsx | no | /system/field |
| SearchField | molecules/SearchField.tsx | yes | /system/search-field |
| Notice | molecules/Notice.tsx | no | /system/notice |
| Card | molecules/Card.tsx | no | /system/card |
| EmptyState | molecules/EmptyState.tsx | no | /system/empty-state |
| Menu | molecules/Menu.tsx | yes | /system/menu |
| Dialog | molecules/Dialog.tsx | yes | /system/dialog |
| Tooltip | molecules/Tooltip.tsx | yes | /system/tooltip |
| Tabs | molecules/Tabs.tsx | yes | /system/tabs |
| Toast | molecules/Toast.tsx | yes | /system/toast |
| CopyBlock | components/mcp/CopyBlock.tsx | yes | /system/code |

## API conventions

- **One component per file**, PascalCase, default export. Compound parts are named exports of
  the same file (`Menu`, `MenuItem`, `MenuSeparator`).
- **Server by default.** Add `"use client"` only when the component holds state, runs effects or
  attaches handlers it owns. A server atom must not put a function on a DOM element.
- **Prop names:** `variant` (visual style), `size` (`sm` | `md` | `lg`, plus `xs`/`xl` where a real
  use needs it), `shape` (`rounded` | `pill`), `tone` (semantic colour: `neutral`, `brand`,
  `positive`, `warning`, `danger`). Booleans are adjectives (`invalid`, `disabled`, `loading`).
- **Closed unions from literal maps.** `const variants = { … } as const` with full class strings
  (Tailwind only generates classes it can read). Every prop has a default.
- **State:** controlled and uncontrolled the React way: `value` / `defaultValue` /
  `onValueChange`, `checked` / `defaultChecked` / `onCheckedChange`, `open` / `defaultOpen` /
  `onOpenChange`.
- **`className` last, for layout only** (margins, width, grid placement). Never a class for a
  property the component sets (colour, size, radius, padding, shadow): `cx` doesn't merge.
  Need a different look? Add a variant to the component, with a sheet row.
- **Rest props** go on the root element; `ref` passes through (React 19: a plain prop).
- **Accessibility in the types:** icon-only controls require `aria-label` or
  `aria-labelledby`; form controls take `id`/`aria-*` from `Field` automatically.
- **Focus ring:** `focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-brand-border-focus` on every interactive element (inputs use their 2px
  brand shadow ring instead).
- **Touch:** controls under 44px reach it with an invisible `pointer-coarse:after:` area.
- **Motion:** only the easing tokens and `animate-*` utilities; `motion-reduce:` respected.
- **Header comment:** what it is, when to use it, what to use instead. Plain English.

## Adding a component

1. Check the inventory: extend an existing component with a variant before adding a new one.
2. Build it under the conventions above, in `elements/` (atom) or `molecules/` (molecule).
3. Add its sheet: `src/components/system/sheets/<group>/<Name>.tsx`, a topic in
   `src/components/system/topics.ts` and its entry in `sheets/index.ts`.
4. Document it in the group file in `docs/design/` (when to use it, the alternative, the closed
   set and its default, one correct and one incorrect example) and add it to the inventory here.
5. `npx tsc --noEmit -p .`, `npm test`, and look at its sheet in both themes and at 375px.
