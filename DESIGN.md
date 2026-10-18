# DESIGN.md: Curatit's design system

Read this before you create or change any UI. It is short on purpose: the rules here are
absolute, and the files it links hold the detail. The live reference is `/system` (every token
and component rendered in both themes); its sources are `src/components/system/sheets/`.

**Character.** A gallery: the posts are the colour, everything around them is neutral grey and
quiet. Serif headings (Hedvig Letters Serif, one regular weight), Inter for everything else.
Terracotta is an event: hovers, focus rings, links and the accent button, nothing else.

## The layers

```
tokens        src/styles/global.css (@theme)          colour, type, radius, shadow, easing, animation
atoms         src/components/fundations/elements/      Button, Badge, Text, Input, Checkbox, Switch, …
molecules     src/components/fundations/molecules/     Field, Menu, Dialog, Tabs, Toast, Card, …
features      src/components/<area>/                   built only from the two layers above
pages         src/app/**                               compose features; no styling of their own
```

A feature never re-implements an atom or a molecule. If what you need doesn't exist, add it to
the system (component + sheet + docs, see `docs/design/components.md`), then use it.

## Non-negotiables

1. **Tokens only.** Semantic colour classes (`bg-card`, `text-secondary-foreground`,
   `ring-border-default`); never Tailwind's `gray`/`zinc`/`slate`, never hex, never `dark:` for a
   colour or shadow (the tokens flip). The older `base-*`/`accent-*` scales are legacy: don't add them.
2. **Words that carry meaning are at least `text-secondary-foreground`.** Tertiary is for
   placeholders and decoration only (it is under 4.5:1).
3. **Use the component, not its look.** A button is `<Button>`, a field is `<Field>` + `<Input>`,
   a menu is `<Menu>`. Copying a component's classes onto a `<div>` is a bug.
4. **Closed sets.** Variants, sizes and tones are the ones in the component's union. An unlisted
   value is a bug, not an option. Never pass a `className` that sets a property the component
   already sets (`cx` has no tailwind-merge, so both land and the stylesheet order decides).
5. **Type.** Marketing, auth and share pages use `<Text>` (headings `h1`…`h6` are the serif,
   regular, never bold). The dashboard uses its six roles (`text-display`, `-title`, `-subtitle`,
   `-body`, `-caption`, `-micro`). No pixel sizes.
6. **One primary action per view** (`<Button variant="default">`). Accent is not a second primary.
7. **Every state is designed:** hover, focus-visible (the brand ring), pressed, disabled,
   loading, empty, error. Errors are red + an icon + words.
8. **Accessible by construction.** Real `<button>`/`<a>`/`<input>`; icon-only controls have an
   `aria-label` (the types require it); labels are wired to fields; touch targets reach 44px;
   focus returns to the trigger when an overlay closes.
9. **Motion from the tokens:** `ease-out-quint` (enter, respond), `ease-in-out-quart` (move on
   screen), `ease-in-quart` (exit); the `animate-*` utilities; transform and opacity only; named
   transition properties, never `transition-all`; nothing on keyboard-repeated input; nothing
   under reduced motion.
10. **Layout:** `<Wrapper>` sets page width (never nested); sections use `page-start` /
    `section-y`, never `py-*` on a Wrapper; phones keep a 16px gutter.
11. **Icons:** Phosphor bold files in `fundations/icons` only; decorative by default.
12. **Performance:** server components by default; `"use client"` only for state or effects;
    nothing new in the homepage hero's path (see AGENTS.md, Performance).

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
| `docs/design/components.md` | How components are built: API conventions, the inventory, adding one |
| `docs/design/colour.md` | Which colour token for which role |
| `docs/design/type.md` | Text variants, dashboard roles, weights |
| `docs/design/shape.md` | Radius, shadows, borders, elevation |
| `docs/design/motion.md` | Easing, durations, keyframes, the motion hooks |
| `docs/design/layout.md` | Wrapper, gutter, page rhythm, card grids |
| `docs/design/icons.md` | The icon set and how to add one |
| `docs/design/voice.md` | Copy: sentence case, button labels, errors, empty states |
| `docs/design/forms.md` | Input, Textarea, Checkbox, Field, SearchField, Segmented, Switch |
| `docs/design/actions.md` | Button, TextLink |
| `docs/design/display.md` | Badge, Avatar, Kbd, Separator, Card, Spinner, Skeleton |
| `docs/design/feedback.md` | Notice, Toast, EmptyState |
| `docs/design/overlays.md` | Menu, Dialog, Tooltip |
| `docs/design/navigation.md` | Tabs |

## Before you finish UI work

- [ ] Built only from atoms and molecules; no hand-rolled copy of one.
- [ ] Only semantic tokens; checked in light **and** dark (`/system` shows both).
- [ ] Every state; keyboard path works; focus visible and returned.
- [ ] Reads at 375px with no sideways scroll; touch targets 44px.
- [ ] `npx tsc --noEmit -p .` and `npm test` pass.
