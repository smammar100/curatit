---
name: curatit-design
description: Curatit's design system - Fluid Functionalism components, springs, fluid hover, surface elevation, Inter weights, serif headings and voice. Use whenever creating or modifying UI (pages, sections, components) so the result matches the system.
---

# Curatit design system

Curatit is built on [Fluid Functionalism](https://www.fluidfunctionalism.com) (FF, MIT, Micka Touillaud):
a shadcn/ui registry where every transition makes a state change legible. It uses springs instead of
durations, one hover highlight that glides to the item nearest the cursor, and labels that get heavier
without shifting the layout. Curatit keeps its own serif for headings, its asterisk symbol and one
terracotta brand hue.

The live reference (tokens, 31 components with working previews, brand book) is the Curatit Design
System artifact: https://claude.ai/artifact/RzecpfcQfhP6svWnbzVpku. This file is the rulebook for the code.

## Where things live

- FF components are installed in `components/ui/` (Radix flavour), with their libs in `lib/`
  (`springs`, `font-weight`, `elevated`, `surface-*`, `shape-context`, `size-context`, `popup`,
  `icon-context`, `utils`) and hooks in `hooks/`. The MIT notice is `components/ui/LICENSE-fluid-functionalism.txt`.
- Tokens, the serif heading utilities (`heading-hero`, `heading-display`, `heading-section`) and the
  base styles are in `app/globals.css`. Inter is self-hosted from `public/fonts/InterVariable.ttf`.
- `components/providers.tsx` wraps the app: `MotionConfig reducedMotion="user"`, `ShapeProvider`, `TooltipProvider`.
- Screens start with `PageHeader` (`components/fundations/containers/PageHeader.tsx`) inside `Wrapper`
  (standard `max-w-6xl px-6`, narrow `max-w-sm`, prose). `Text` maps its variants onto the new roles; in
  new code prefer plain elements with the role classes.
- The header nav (`components/navigation/NavLinks.tsx`) and the library grid
  (`components/product/LibraryGrid.tsx`) show the fluid hover patterns for a strip and a grid. Keep the
  folder name `fundations` as spelled.

## Install

- Add the registry once: `npx shadcn@latest registry add @fluid` (needs a `components.json`; create
  one with `npx shadcn@latest init` if missing).
- Install components by name, Radix flavour: `npx shadcn@latest add @fluid/button`. Pass
  `--overwrite` when a same-named file exists. Shared libs and hooks (`springs`, `font-weight`,
  `use-fluid-hover`, `surface-context`, `elevated`, `shape-context`, `size-context`) come along.
- `framer-motion` and `lucide-react` are already dependencies. Don't add another icon set or motion
  library.
- Wrap the app root once: `MotionConfig reducedMotion="user"`, then `ShapeProvider defaultShape="rounded"`,
  `SizeProvider`, and `TooltipProvider`.

## Tokens (`app/globals.css`)

Adopt FF's token block: each colour written once as `light-dark(light, dark)`, with `color-scheme`
driving the theme. Map them to Tailwind in `@theme inline`, as FF's `globals.css` does.

- **Surfaces.** `--surface-1..8`: light `#FAFAFA, #FCFCFC`, then `#FFFFFF`; dark `#171717, #1E1E1E,
  #252525, #2C2C2C, #333333, #3A3A3A, #414141, #484848`. `--background` is `surface-1`, `--card` is
  `surface-3`.
- **Text.** `--foreground` `#171717 / #F5F5F5`. `--muted-foreground` `#737373 / #A3A3A3`.
- **Fills.** `--muted` `#F4F4F5 / #1E1E1E`. `--accent` `#E5E5E5 / #525252` is the pressed state, not a
  brand colour. `--selected` `#D4D4D4 / #525252`.
- **Tints.** `--hover` is black 4% or white 6%. `--active` is black 7% or white 10%.
- **Lines.** `--border` is `color-mix(in oklab, var(--foreground) 12%, transparent)`. `--ring` and
  `--input` are `#E5E5E5 / #404040`.
- **Errors.** `--destructive` `#EF4444 / #F87171`, `--destructive-light` `#FEF2F2 / #450A0A`.
- **Focus.** `--focus-ring` `#6B97FF`: a 1px ring, 2px offset, radius 2px larger than the element's.
- **Shadows.** `--shadow-1..8` pair 1:1 with the surfaces. Light stacks halving drops of
  `rgb(0 0 0 / .06)`. Dark adds an inset top highlight and ring over drops of `rgba(0,0,0,.18)`. Copy
  FF's recipes exactly. Utilities: `bg-surface-N`, `shadow-surface-N`.
- **Brand (Curatit only).** `--brand` `#C54120 / #DC5431`, `--brand-soft` `#FDF3F0 / #2B120B`,
  `--brand-text` `#9C3318 / #F2957A`, `--on-brand` `#FFFFFF / #171717`. Use it for the saved state and
  text selection only.
- **Known gaps** (kept as FF ships them): in light theme, `destructive` on white is 3.8:1, the focus
  ring on the page is 2.7:1, and `muted-foreground` on `muted` is 4.3:1. Always pair an error with a
  sentence, and keep secondary text off `muted` fills.

## Typography

- **Inter** is the only interface face. Load `public/fonts/InterVariable.ttf` with both the `wght` and
  `opsz` axes. Set weights through `fontWeights` (`@/lib/font-weight`): normal `'wght' 400, 'opsz' 14`,
  medium `450/15`, semibold `550/18`, bold `700/25`, applied with `font-variation-settings`. Don't use
  `font-semibold` or `font-bold` on UI labels.
- **Roles.** `text-display` 28px (22px on mobile), `text-title` 16px, `text-subtitle` 14px,
  `text-body` 13px (the default for controls, rows and copy), `text-caption` 12px.
- **Serif for headings only.** Hedvig Letters Serif (`font-serif`, weight 400) is for the page title
  (28px, 22px mobile), section headings (22px), the landing hero (48px, 34px mobile), EmptyState
  titles and the wordmark. Never on buttons, labels, card titles or body copy.
- **Details.** `tabular-nums` wherever numbers line up. `text-wrap: balance` on headings, `pretty` on
  paragraphs.

## Elevation

- **Wrap floating things in `Elevated`** with an offset, never a fixed `bg-surface-N`. Offset 2 is for
  dropdowns, selects and popovers. Offset 4 is for dialogs. Offset 1 nests a panel inside a panel. It
  clamps at 8.
- **Every Elevated provides its level** through `SurfaceProvider`, so the same popover lands at the
  right depth on the page or inside a dialog with no props passed.
- **`shadowLevel` pins a shadow** so an object reads the same at any depth. Dropdowns keep shadow-3.
  Toast: offset 2 with shadow-5. Marketing AppWindow: offset 2 with shadow-6.
- **Borderless by default.** Groups split with `border` hairlines at 60%, and table rows with `accent`
  at 40%. Don't box sections or nest cards.

## Shape and size

- **Rounded** (the default): items, buttons, inputs, rows and the hover highlight use `rounded-lg` (8px).
  Popups, cards, dialogs and groups use `rounded-xl` (12px). The focus ring is 10px. Images inside cards
  are 2px. Code and Kbd are 4px. Pill is an app-wide `ShapeProvider` switch, never mixed per component.
  Read radii from `useShape()`.
- **Two sizes.** Default 36px controls (`h-9`, 13px text, 16px icons). Compact 28px (`h-7`, 12px text,
  14px icons) for toolbars, filter bars, table headers and card buttons. Read them from `useSize()`.
  A popup row matches its trigger's height.

## Motion

- **Springs only** (`@/lib/springs`), never a hand-written duration:
  - `spring.fast` (0.08s): hover, focus, fades, tooltips, checkbox, radio, table rows, card grid,
    popups opening, accordion.
  - `spring.moderate` (0.16s): tab and dropdown indicators, the switch thumb, toasts, drawers, merged
    selection.
  - `spring.slow` (0.24s, bounce 0.12): dialogs.
- **Exits** use `spring.<tier>.exit` tweens, one tier quicker.
- **Animate `transform` and `opacity`**, never `top`, `left`, `width` or `height`.
- **Popups grow from the side they land on** with a 4px slide (`popupMotionClass`).
- **Icon swaps** (copy to check) crossfade 2 glyphs in one cell: blur 4px and scale 0.6, arriving on
  0.08s and leaving on 0.06s.
- **Weight without reflow.** A selected or current label gets a hidden ghost copy at the heavier
  weight, so neighbours never shift.
- **Nothing plays on its own.** No scroll-triggered reveals, no auto-advancing carousels. Reduced motion
  keeps fades and drops movement.

## Fluid hover

One highlight per list. Use `useFluidHover(containerRef, { axis })` with `<FluidHoverHighlight hover={hover} />`,
and register rows with `useRegisterFluidHoverItem`. Never hand-roll the overlay.

- **Axes.** `y` for lists, `x` for strips (the header nav, TabsSubtle), `xy` for grids.
- **The winner.** A containing item wins, otherwise the nearest centre. A click in a gap lands on the
  lit row.
- **Only click targets register.** Disabled rows stay in the list and are skipped.
- **One list per group.** A divider between different kinds of rows starts a new list.

## Components

- **Use FF parts** before writing anything: Button, Accordion, Badge, Card and CardGroup, CheckboxGroup,
  RadioGroup, Switch, InputGroup, InputCopy, Select, Combobox, Slider, Tabs, TabsSubtle, Dropdown and
  MenuItem, Tooltip, Dialog, CommandMenu, Table.
- **Curatit's own**, built on the same primitives:
  - **Header:** the serif wordmark, a nav strip on `axis: "x"` fluid hover, a semibold ghost-span for
    the current page, 56px tall.
  - **CreativeCard:** an FF `Card` in a `CardGroup columns={3|4} separated`, 4:5 art at 2px radius, a
    1/N counter, brand as `CardTitle`, hook as `CardDescription`, and a compact Save `CardButton` that
    turns primary as "Saved".
  - **Also:** Toast (Elevated, `spring.moderate`), Note, EmptyState (serif title), Pagination, Link,
    Avatar, Kbd, Skeleton (flat `muted`, no shimmer) and AppWindow.
- **Badges.** One palette colour per category everywhere: Food & drink orange, Sports blue,
  Entertainment violet, Beauty pink, Tech cyan, formats gray. Use the `dot` variant for states, always
  in words.
- **Icons.** Lucide at `strokeWidth` 1.5 (2 when active), 16px default and 14px compact,
  `currentColor`. No decoration, no coloured tiles, no emoji.
- **Imagery.** Post artwork never moves, scales or dims on hover. The highlight is the only signal.

## Voice

FF's tone rules, in Curatit's words:

- **One line per intro.** A fragment is fine.
- **Count first:** "24 posts", "Saved to 2 boards."
- **Say what it does for the reader**, not what the feature is called.
- **Instruct the hand:** "Press ⌘K to search."
- **Present tense, active voice, second person.**
- **No em dashes anywhere.**
- **Plain words:** no "seamless", "powerful" or "beautiful". Numbers stay numeric.
- **Sentence case everywhere.**

## Before finishing a UI change

1. Colours, radii, sizes and motion come from tokens, `useShape()`, `useSize()` and `spring`. There's
   no hex in markup and no hand-written duration.
2. Floating surfaces use `Elevated`. Lists with hover use `useFluidHover` and `FluidHoverHighlight`.
3. Headings use the serif, and everything else uses Inter through `fontWeights`.
4. The change works in light and dark, at 36px and 28px, and with reduced motion on.
