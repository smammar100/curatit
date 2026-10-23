# Icons

Sources: `src/components/fundations/icons/` (one file per icon on the shared `Icon.tsx` shell)
and `src/lib/icon-context.tsx` (the slots the vendored library reads). Live, every icon:
`/system/icons`.

**One library: Phosphor, bold weight.** Never Lucide, Untitled UI, Heroicons or inline SVG paths
in a feature. `components.json` still says `"iconLibrary": "lucide"` for the shadcn CLI; nothing
imports it, and it must stay out of every bundle.

## Using one

- Size from the shell's scale (`size="xs"` 12 … `"xl"` 32) or a class: `size-3.5` beside a
  compact control's 12px text (the library's 14px icon step), `size-4` beside 13px, `size-5`
  beside 16px. Colour is `currentColor`: set the text colour on the parent.
- Icons are **decorative by default** (`aria-hidden`, `focusable="false"`). Pass `aria-label`
  only when the icon alone carries meaning.
- An icon-only control names the control, not the icon: `<Button iconOnly aria-label="Close">`.
- One icon, one job across the product (Plus creates, Close dismisses, ArrowUpRight leaves the
  site).

## The icon context (the library's icons)

The vendored components never import an icon: they look one up by the role it plays
(`useIcons()["chevron-down"]`, `"x"`, `"check"`, `"loader"`, …) in `src/lib/icon-context.tsx`.
Its default set is the site's own Phosphor icons, adapted to the library's `{ size, className }`
contract (a `Curatit:` patch, 2026-10-23), so no `IconProvider` is needed and Lucide never
loads. Phosphor draws filled paths, so the library's `strokeWidth` and its 1.5 → 2 hover cue are
ignored. A slot no installed component reads yet is a dot (`DotOutline`); when a component that
reads one is installed, give the slot its Phosphor icon (below) rather than leaving the dot. The
site's atoms pass an icon as an element (`leftIcon={<Plus />}`); the wrappers turn it into the
component the library wants.

## Adding one

1. `npm pack @phosphor-icons/core` into a scratch folder (never into the repo) and open
   `assets/bold/<name>-bold.svg`.
2. Create `src/components/fundations/icons/<Name>.tsx` on the Icon shell with that one path (copy
   `Check.tsx`).
3. Add it to the icon grid in `src/components/system/sheets/Icons.tsx`.
4. If it fills a library slot, map it in `defaultIcons` in `src/lib/icon-context.tsx`
   (`"pencil": adapt(Pencil)`).

```tsx
// Correct
<Button size="sm" variant="muted" leftIcon={<Plus className="size-3.5" />}>New board</Button>

// Incorrect: another icon library, and an icon-only control with no name
import { Plus } from "lucide-react";
<button><Plus /></button>
```
