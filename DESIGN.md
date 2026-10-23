# DESIGN.md: Curatit's design system

Read this before you create or change any UI. It is short on purpose: the rules here are
absolute, and the files it links hold the detail. The live reference is `/system` (every token
and component rendered in both themes); its sources are `src/components/system/sheets/`.

**Character.** A gallery: the posts are the colour, everything around them is neutral grey and
quiet. Serif headings (Hedvig Letters Serif, one regular weight), Inter for everything else.
Since 2026-10-23 the controls are Fluid Functionalism's (fluidfunctionalism.com), with the
owner's settings: pill corners, the compact size step, Phosphor icons, Radix. Its craft is the
site's now: motion on three spring tiers, one hover highlight that glides to the row nearest the
pointer, labels that get heavier when chosen without moving their neighbours, a press that shrinks
a button by exactly 1px a side, one ink (`--foreground`) for text, the primary button, the switch's
on-track, tooltips and toasts, one stroke (`--border`) for every hairline, and depth from one
eight-step ladder. Terracotta is still an event: focus rings, link hovers and the accent button,
nothing else (one named exception: Avatar initials sit on `bg-brand-subtle`).

## The layers

```
tokens        src/styles/global.css (@theme, :root)   colour, surfaces, shadows, type roles, radius, springs' CSS
library       src/components/ui/ + src/lib/* + src/hooks/   Fluid Functionalism, installed with the shadcn CLI
atoms         src/components/fundations/elements/      Button, Badge, Text, Input, Checkbox, Switch, …
molecules     src/components/fundations/molecules/     Field, Menu, Dialog, Tabs, Toast, Card, …
features      src/components/<area>/                   built only from atoms and molecules
pages         src/app/**                               compose features; no styling of their own
```

The library layer is vendored: `src/components/ui/` (button, badge, switch, tabs, tabs-subtle,
tooltip, dialog, dropdown, menu-item, card, banner, …), its systems in `src/lib/` (`springs.ts`,
`shape-context.tsx`, `size-context.tsx`, `surface-context.tsx`, `surface-classes.ts`,
`elevated.tsx`, `font-weight.ts`, `icon-context.tsx`, `popup.ts`, `omit.ts`) and `src/hooks/`
(`use-fluid-hover.ts`, `use-merge-split.tsx`, `use-touch-primary.tsx`). Features never import
from `src/components/ui/`: every library component is used through the atom or molecule that
wraps it. Local changes to a vendored file are marked `Curatit:` in the code, and there are few.
Don't edit an installed component to retime or recolour it: wrap it, or set its variables on the
wrapper (`docs/design/components.md`, "The vendored library").

A feature never re-implements an atom or a molecule. If what you need doesn't exist, add it to
the system (component + sheet + docs, see `docs/design/components.md`), then use it.

## Non-negotiables

1. **Tokens only.** Semantic colour classes: the library's names (`bg-background`,
   `text-foreground`, `text-muted-foreground`, `bg-muted`, `ring-border`, `bg-hover`, `bg-active`,
   `bg-surface-N` + `shadow-surface-N`, `text-destructive`) and Interfere's (`bg-card`,
   `text-secondary-foreground`, `ring-border-default`), which now resolve to the same ink, stroke
   and depth. Never Tailwind's `gray`/`zinc`/`slate`, never hex, never `dark:` for a colour or
   shadow (the tokens flip). One stroke: `--border`, 12% of the ink, whichever name draws it. One
   depth ladder: Tailwind's shadow names are its steps (`shadow-xs` = 1, `shadow-sm` = 2, `md` = 3,
   `lg` = 4, `xl` = 6, `2xl` = 8). The older `base-*`/`accent-*` scales are legacy: don't add them.
2. **Words that carry meaning are at least `text-muted-foreground`** (= `text-secondary-foreground`).
   Tertiary is for placeholders and decoration only (it is under 4.5:1).
3. **Use the component, not its look.** A button is `<Button>`, a field is `<Field>` + `<Input>`,
   a menu is `<Menu>`. Copying a component's classes onto a `<div>` is a bug.
4. **Closed sets.** Variants, sizes and tones are the ones in the component's union. An unlisted
   value is a bug, not an option. `className` is for layout only, even though the wrappers use
   `cn` (which merges): a colour or size there is still a second look the sheet doesn't show.
5. **Type.** Marketing, auth and share pages use `<Text>` (headings `h1`…`h6` are the serif,
   regular, never bold). The dashboard uses its six roles (`text-display`, `-title`, `-subtitle`,
   `-body`, `-caption`, `-micro`); compact is the site's step, so controls read 12/18. Weight is
   one of the library's three, set as `style={{ fontVariationSettings: fontWeights.normal |
   semibold | bold }}` (`src/lib/font-weight.ts`); no Tailwind `font-*` in new code. No pixel sizes.
6. **One primary action per view** (`<Button variant="default">`). Accent is not a second primary.
7. **Every state is designed:** hover, focus-visible, pressed, disabled, loading, empty, error.
   Errors are red + an icon + words. Focus is one ring everywhere: a 1px `--focus-ring` outline
   (terracotta), offset 2px, on keyboard focus only.
8. **Accessible by construction.** Real `<button>`/`<a>`/`<input>`; icon-only controls have an
   `aria-label` (the types require it); labels are wired to fields; touch targets reach 44px;
   focus returns to the trigger when an overlay closes.
9. **Motion from the springs** (`src/lib/springs.ts`): `spring.fast` 80ms (hover, tooltips,
   menus), `spring.moderate` 160ms (a selection travelling, toasts, the switch), `spring.slow`
   240ms (dialogs), each with an `.exit` one tier quicker; colour changes 80ms (`duration-80`);
   transform and opacity only; every molecule that animates wraps its own
   `<MotionConfig reducedMotion="user">`, so reduced motion is honoured without a root provider.
   The older easing tokens (`ease-out-quint`, `ease-in-out-quart`, `ease-in-quart`) and
   `animate-*` utilities stay for what still uses them (features, the hooks in `src/lib/motion.ts`);
   don't put them on a system component.
10. **Shape and size come from the providers** (`global/FluidRoot`: `ShapeProvider` pill,
    `SizeProvider` compact). A control is `rounded-[20px]`, a container (dialog, card, textarea)
    `rounded-[24px]`, nested corners concentric (outer − inset). Every control is 28px tall with
    12px text, whatever its size name: `lg`/`xl` buttons and `lg` fields are the same compact step,
    the names kept for call sites. Never hard-code a radius or a
    control height: read `useShape()` / `useSize()` inside the system, and use a component outside it.
11. **Layout:** `<Wrapper>` sets page width (never nested); sections use `page-start` /
    `section-y`, never `py-*` on a Wrapper; phones keep a 16px gutter.
12. **Icons:** Phosphor bold files in `fundations/icons` only; decorative by default. The library
    reads the same set through `src/lib/icon-context.tsx`.
13. **Performance:** server components by default; `"use client"` only for state or effects;
    nothing new in the homepage hero's path (see AGENTS.md, Performance). Most atoms are client
    components now (`docs/design/components.md` lists them); a page can still render them.

## Which component?

```
Does it perform an action?        → Button (a link that looks like an action: Button isLink)
Navigates inside running text?    → TextLink
One of 2–5 short options, now?    → Segmented        On or off?            → Switch
Several independent options?      → Checkbox         Text entry?           → Field + Input / Textarea / SearchField
A list of actions from a trigger? → Menu             Views of one thing?    → Tabs
Needs the whole screen's focus?   → Dialog           Extra words on hover?  → Tooltip (never holds controls)
Tells the user something?         → inline: Notice   after an action: Toast  nothing here yet: EmptyState
A label beside something?         → Badge            A key to press?        → Kbd
A picture of a person?            → Avatar           Loading?               → Skeleton (layout) / Spinner (inline)
A grouped surface?                → Card             A line between things? → Separator
```

## Index

| File | What it decides |
| --- | --- |
| `docs/design/components.md` | How components are built: the inventory, API conventions, the vendored library, adding one |
| `docs/design/colour.md` | Which colour token for which role; the surface ladder |
| `docs/design/type.md` | Text variants, dashboard roles, the three weights |
| `docs/design/shape.md` | The shape context, shadows, the one stroke, elevation |
| `docs/design/motion.md` | The spring tiers, 80ms colour, reduced motion, the older hooks |
| `docs/design/layout.md` | Wrapper, gutter, page rhythm, card grids |
| `docs/design/icons.md` | The icon set, the icon context and how to add one |
| `docs/design/voice.md` | Copy: sentence case, button labels, errors, empty states |
| `docs/design/forms.md` | Input, Textarea, Checkbox, Field, SearchField, Segmented, Switch |
| `docs/design/actions.md` | Button, TextLink |
| `docs/design/display.md` | Badge, Avatar, Kbd, Separator, Card, Spinner, Skeleton |
| `docs/design/feedback.md` | Notice, Toast, EmptyState |
| `docs/design/overlays.md` | Menu, Dialog, Tooltip |
| `docs/design/navigation.md` | Tabs |

## Before you finish UI work

- [ ] Built only from atoms and molecules; nothing imported from `src/components/ui/` directly.
- [ ] Only semantic tokens; checked in light **and** dark (`/system` shows both; menus, tooltips
      and dialogs render in a portal, so there they take the site's theme, not the panel's).
- [ ] Every state; keyboard path works; focus visible and returned.
- [ ] No hard-coded radius or control height: the shape and size come from the providers.
- [ ] Reads at 375px with no sideways scroll; touch targets 44px.
- [ ] `npx tsc --noEmit -p .` and `npm test` pass.
