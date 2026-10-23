# Icons

Source: `src/components/fundations/icons/` (one file per icon on the shared `Icon.tsx` shell).
Live, every icon: `/system/icons`.

**One library: Phosphor, bold weight.** Never Lucide, Untitled UI, Heroicons or inline SVG paths
in a feature (that's why Fluid Functionalism's setup wasn't installed).

## Using one

- Size from the shell's scale (`size="xs"` 12 … `"xl"` 32) or `size-4` beside 13px text,
  `size-5` beside 16px. Colour is `currentColor`: set the text colour on the parent.
- Icons are **decorative by default** (`aria-hidden`, `focusable="false"`). Pass `aria-label`
  only when the icon alone carries meaning.
- An icon-only control names the control, not the icon: `<Button iconOnly aria-label="Close">`.
- One icon, one job across the product (Plus creates, Close dismisses, ArrowUpRight leaves the
  site).

## Adding one

1. `npm pack @phosphor-icons/core` into a scratch folder (never into the repo) and open
   `assets/bold/<name>-bold.svg`.
2. Create `src/components/fundations/icons/<Name>.tsx` on the Icon shell with that one path (copy
   `Check.tsx`).
3. Add it to the icon grid in `src/components/system/sheets/Icons.tsx`.

```tsx
// Correct
<Button size="sm" variant="muted" leftIcon={<Plus className="size-4" />}>New board</Button>

// Incorrect: another icon library, and an icon-only control with no name
import { Plus } from "lucide-react";
<button><Plus /></button>
```
