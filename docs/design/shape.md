# Shape and depth

Source: the `--radius-*` and `--shadow-*` tokens in `src/styles/global.css`. Live: `/system/shape`.

## Radius (Interfere's scale)

| Class | px | Used for |
| --- | --- | --- |
| `rounded-sm` | 4 | Badges at sm/md |
| `rounded-md` | 6 | Small buttons, menu rows, the segmented thumb |
| `rounded-lg` | 8 | Buttons, inputs, notices |
| `rounded-xl` | 10 | The dashboard's 44px inputs and buttons |
| `rounded-2xl` | 12 | Cards, mats, menus, the auth card |
| `rounded-3xl` | 16 | Dialogs |
| `rounded-4xl` / `rounded-5xl` | 20 / 24 | The footer panel |
| `rounded-full` | | Pills (`shape="pill"`), avatars, switches |

**Nested radius:** inner = outer − padding (a `rounded-2xl p-1.5` menu has `rounded-md` rows).
Never more than `rounded-2xl` on a card. Arbitrary radii only where AGENTS.md records them (the
dashboard's 28px dialog and account menu).

## Shadows

| Class | Use |
| --- | --- |
| `shadow-xs` | A hairline: the edge of a white card (`bg-container`) |
| `shadow-sm` (= bare `shadow`) | Default: inputs, the secondary button, the segmented thumb, images on a mat |
| `shadow-lg` | Menus, popovers, toasts |
| `shadow-xl` | Dialogs, the auth card, large floating cards |

Each has its own dark treatment (drops fade, an inner highlight takes over), so **never** add
`dark:ring-*` to stand in for a shadow and never write `shadow-[…]` for depth. The one arbitrary
shadow allowed is a selection line, not depth: `shadow-[inset_0_-2px_0_currentColor]`, the 2px
underline under the selected tab (Tabs' underline variant, the `/system` nav), because
`border-b-2` would shift the row's layout.

## Borders and elevation

- Rings and dividers: `ring-1 ring-border-default`, `divide-y divide-border-default`; strong:
  `ring-border-strong`. No `border-2`; a selected outline is `ring-primary-foreground`.
- Elevation order, low to high: `bg-page` → `bg-card` (mat) → `bg-container` + `shadow-xs` →
  `bg-modal` + `shadow-lg` / `shadow-xl`. In dark mode each step is lighter, not darker.

```tsx
// Correct
<div className="rounded-2xl bg-modal p-1.5 shadow-lg"><button className="rounded-md …">Rename</button></div>

// Incorrect: ad-hoc shadow, a dark: ring standing in for it, the same radius inside and out
<div className="rounded-2xl bg-white p-1.5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.3)] dark:ring-1">
  <button className="rounded-2xl …">Rename</button>
</div>
```
