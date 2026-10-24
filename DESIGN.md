# DESIGN.md: Curatit's design system

Read this before you create or change any UI. Since 2026-10-24 Curatit is built on **Glaze**
(design.how), at the owner's request, with three systems kept from **Fluid Functionalism**, the
system before it: **type, motion and surfaces**. The live reference is `/system` (every token and
component in both themes).

**Character.** Black and white around the posts: ink and paper, greys as ink at alphas, colour only
for status, and glass only on the one thing a group asks you to press. The posts are the colour.
Hedvig Letters Serif for page titles and marketing headings, Inter for every other word.

## Where the rules live

1. **`.claude/skills/glaze/SKILL.md`** (also `.agents/skills/glaze/SKILL.md`): Glaze's rules in
   priority order, the anti-slop list, the closed token list, the component index and imports. It
   wins over anything here except the three kept systems below.
2. **A component's page** before you use it: `https://design.how/systems/glaze/components/<name>.md`
   (props, variants, rules, keyboard, edge cases).
3. **`src/styles/glaze-bridge.css`**: how the kept systems meet Glaze. It retunes Glaze's own tokens
   and recipes, so a Glaze component reads Curatit's type, motion and surfaces with no help.
4. **`docs/design/voice.md`**: how Curatit writes (Glaze's voice rules agree: sentence case, a verb
   on every action, no emoji, no em dash, no hype).

## The layers

```
tokens      src/components/glaze/tokens.css (Glaze, scoped to .glaze), retuned by src/styles/glaze-bridge.css;
            src/styles/global.css for the kept systems' own values (FF's type scale, surface ladder, springs' CSS)
components  src/components/glaze/ui/*  (Base UI), src/components/glaze/icon.tsx (the one icon entry)
support     src/lib/glaze/* (utils, portal, overlay, lint)
kept        src/components/fundations/elements/Text.tsx (the marketing type scale),
            src/components/fundations/elements/TextLink.tsx (the inline link Glaze doesn't have),
            src/lib/springs.ts (FF motion; the weights live in the bridge)
features    src/components/<area>/*, built only from the above
pages       src/app/**, compose features
```

The root layout imports Glaze's `styles.css` and the bridge after `global.css`, puts `glaze` on
`<body>` and wraps the app in `GlazePortalProvider`, so menus, dialogs and toasts keep the tokens.
Dark mode is `data-theme="dark"` on `<html>`, set by `global/ThemeScript` and `global/theme.ts`.

## Non-negotiables

1. **Glaze components first.** Import from `@/components/glaze/ui/<name>` before writing markup. Never
   hand-roll a button, field, menu, dialog, tabs, toast or card, never copy a component's classes onto
   another element. Missing one? Install it (`npx shadcn@latest add https://design.how/r/glaze/<name>.json`)
   and read its page. Missing from Glaze altogether? Stop and say so.
2. **Tokens by role, never raw values.** Glaze's colour roles (`text-text-1`, `text-text-2`, `bg-page`,
   `bg-paper`, `bg-shell`, `bg-field`, `border-line-faint`, `bg-hover`, the status roles), the corner
   scale (a one-line control is `rounded-pill`; a box takes the step for its size: 2XS 6px `rounded-tag`,
   XS 12px `rounded-(--corner-xs)`, S 16px `rounded-panel`, M 24px `rounded-(--radius-float)`; a box
   inside another is the outer corner less the gap, `rounded-shell` 19 around a panel 3px in and
   `rounded-(--radius-nested)` 8 for a label 8px inside a tile or a picture 16px inside an M box; see
   `/system/radius`), sizes (`h-(--control)`) and the 4px scale. No hex, no Tailwind palette, no arbitrary px, no `dark:`, no inline styles (a value known only
   at runtime is a custom property read by a class: `style={{'--x': v}}` with `w-(--x)`).
3. **No brand accent.** Emphasis is ink. Coral means failure or a destructive action, green done or
   approval, amber a warning, and each comes with a glyph and a word.
4. **One primary per group,** glass only on what is pressed (Button's primary family and Glaze's
   selection controls draw it; never a card, a badge, a header or a field).
5. **Pills for one-line controls,** the shell and panel for a card, a card only around one thing a
   person acts on, never a card in a card.
6. **Focus is Glaze's 2px ink ring,** drawn by its base styles on every focusable. Don't write your own.
7. **No decoration:** no gradient, blur, glow, texture, status dot, icon in a tinted tile beside a
   heading, small label above a title, capitals or letter-spacing, emoji, em dash in copy, mono except
   for what a person copies. The posts and the product's own illustrations are the exceptions, drawn on
   the tokens.
8. **Accessible by construction:** every icon-only control named, labels wired to fields, focus back
   to the trigger when an overlay closes, touch targets at 44px, nothing moving under reduced motion.

## What stays Fluid Functionalism's

- **Type.** Inter and Hedvig, FF's scale and its three weights (400 text, 550 labels and headings,
  700 strong). In the app, Glaze's type roles are that scale: `type-title` (Hedvig 28/34),
  `type-heading` (16/22), `type-heading-sm` (14/20), `type-body` (14/20), `type-body-sm` (13/20),
  `type-label` (13/20), `type-label-sm` (12/16), `type-caption` (12/16); `font-medium` is 550 and
  `font-semibold` 700. FF's role classes (`text-display`, `-title`, `-subtitle`, `-body`, `-caption`,
  `-micro`) are allowed. Marketing, auth and share pages use `<Text>` (h1 to h6 in Hedvig, body and
  caption sizes); every page's h1 is `Text tag="h1" variant="h1"`.
- **Motion.** FF's tiers as Glaze's motion tokens: 80ms for a press, a hover or a colour
  (`duration-(--dur-state)`, `--dur-press`), 160ms for a selection moving (`--dur-slide`), 240ms for
  something arriving (`--dur-overlay`), each leaving a tier quicker, on FF's curves (`ease-out` is
  ease-out-quint, `ease-in` ease-in-quart). The site's own animations keep `spring` from
  `src/lib/springs.ts` on motion/react. Transform and opacity only; nothing under reduced motion.
- **Surfaces.** FF's eight-step ladder (`bg-surface-N shadow-surface-N`; in dark each step lighter,
  the shadows turned to rings and highlights). Glaze's paper is step 3, a card lifts on step 2, an
  overlay (menu, popover, select, toast) on step 6 with the ladder's ring in place of Glaze's border,
  a dialog or sheet on step 8. Glaze's other shadow classes draw nothing; use the ladder pair where
  something must lift that no Glaze recipe covers.

## Lint

`npx eslint -c glaze.eslint.config.mjs .` is Glaze's lint; every message names the fix. It knows the
kept systems' classes as sanctioned (added to `src/lib/glaze/lint/classes.json`, and `shadow-surface-N`
exempted from its no-shadow rule, both marked `Curatit:`), and it skips the emails (HTML for mail
clients, styled inline) and the vendored lifeline. A reinstall of the lint (`--overwrite`) needs those
two edits re-applied. Run it with `npx tsc --noEmit -p .` and `npm test` before you call UI done, then
look at the screen at 390 and 1280 wide, light and dark, with the keyboard.
