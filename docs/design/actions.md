# Actions: Button and TextLink

An action is a `Button`; somewhere to go, named in words, is a `TextLink`. Live sheets:
`/system/button`, `/system/text-link`.

```
Which control?
 ├── An action (Save, Copy token, Sign out) → Button
 ├── The page's next step drawn as a button (Create account) → Button isLink
 ├── A whole card opens → CardTitle href
 ├── Somewhere to go, inside a sentence → TextLink (inline)
 ├── Somewhere to go, on its own or in a list → TextLink variant="quiet"
 ├── One value of two to five → Segmented      On or off → Switch
 └── Several actions behind one trigger → Menu (the trigger is a Button)
```

## Button (`elements/Button.tsx`, server; `loading` needs a client parent)

Every action, and with `isLink` + `href` a next/link for a link that is the page's next step. Never
a hand-made `<button>` styled like one: it misses the ring, the press, the touch area.

Variants, and nothing else (no `primary`, `ghost`, `outline`, `destructive`; the type refuses them):

- `default` (the default): the one next step in a view. One per view: two solids leave no next step.
- `muted`: the other choice beside the default. `secondary`: a dashboard control on its own
  (Create, Saved, Share, More, Copy token). `transparent`: quiet, inside something (Sign in, Close).
- `accent`: the brand fill, rare, never beside a default. `danger`: confirms what can't be undone.
  `dangerSubtle`: starts something destructive that asks first. `none`: brings its own colours.

```
Which variant?
 ├── The one next step in this view → default
 ├── Confirms what can't be undone → danger
 ├── Starts something destructive that asks first → dangerSubtle
 ├── The other choice beside the default → muted
 ├── A dashboard control on its own → secondary
 ├── Quiet, inside something else → transparent
 └── Brings its own colours (an avatar trigger) → none
```

Sizes: `xxs` 24, `xs` 28, `sm` 32, `base` 40 (default; `md` is the same), `lg` 44, `xl` 48. The
label is 13px medium up to `base`, 14px (the dashboard's subtitle role) at `lg` and `xl`. `lg`, `xl`
and `shape="pill"` are the dashboard's (header pills, toolbars, the post panel, a dialog's submit at
`xl w-full`); the marketing site stays on `xxs` to `base` with the size's own radius (6px to `xs`,
8px from `sm`, 10px at `lg`/`xl`). `xxs` and `xs` reach 44px on touch through an invisible `::after`.

```
Which size?
 ├── Inline in a dense editor (+ Add) → xxs
 ├── The site header, beside the nav → xs
 ├── An action in a card, a menu, a small empty state → sm
 ├── A page's call to action, a form's submit → base (default)
 ├── Dashboard header, toolbars, post panel → lg, shape="pill"
 └── A dashboard dialog's submit → xl, shape="pill", w-full
```

- `shape`: `rounded` (the size's radius, default) or `pill`. Never `rounded-full` in className.
- `iconOnly`: a square of the size's height; children are the icon. Requires `aria-label` or
  `aria-labelledby` (it doesn't compile without one), saying what it does: "Close", never "icon".
- `leftIcon` / `rightIcon`: icon slots beside the label; `gap` widens them (`xs` … `lg`).
- `loading`: a spinner over the invisible label (the width holds); `aria-busy` + `aria-disabled`,
  focus kept, clicks ignored. Client components only (the click guard is a function). Put what's
  happening in the label ("Signing in…").
- `disabled`: only while it can't act yet (no name typed). Never for a request in flight.
- Width is decided per use: a standalone CTA `w-fit`, a form's submit `w-full`, a row nothing.
- No `border`, `ring-*` or `outline-*` in className; press is built in (0.97), never add `active:scale`.

```tsx
<div className="flex flex-wrap gap-3">
  <Button isLink href="/signup">Start your swipe file</Button>
  <Button isLink variant="muted" href="/#how-it-works">See how it works</Button>
</div>
<Button variant="transparent" iconOnly size="sm" aria-label="Clear search" onClick={clear}>
  <Close className="size-3.5" />
</Button>
<Button size="xl" shape="pill" className="w-full" loading={saving} type="submit">Create board</Button>
// Incorrect: variants that don't exist, two solids in one row, a pill by className
<Button variant="primary">Create account</Button>
<Button variant="default">Submit a site</Button><Button variant="accent">Skip the line</Button>
<Button className="rounded-full">Share</Button>
```

## TextLink (`elements/TextLink.tsx`, server)

A link that is words, on next/link (internal links navigate in place and prefetch). An action is a
Button even when it looks quiet (`variant="transparent"`); a next step drawn as a button is
`Button isLink`; markdown bodies keep the prose links (`Wrapper variant="prose"`).

Variants `inline` (default) and `quiet`, plus `external`. Nothing else: no brand-at-rest link, no
bold link.

- `inline`: inside a sentence. The sentence's colour, a 1px `border-strong` underline 2px below;
  words and line turn `brand-foreground` on hover. The underline never comes off (colour alone
  fails WCAG 1.4.1).
- `quiet`: on its own or in a list (Forgot password?, Back to Saved). Secondary ink, no underline,
  primary on hover. Reaches 44px on touch through `::after`: space a list of them 44px apart.
- `external`: new tab, `rel="noreferrer"` (your `rel` is kept), the ArrowUpRight glyph held to the
  last word, "(opens in a new tab)" for screen readers.
- Link words name the destination and make sense alone: never "click here" or a bare URL.

```tsx
<p className="text-body-sm text-secondary-foreground">
  Tokens stay in your environment. <TextLink href="/docs/mcp">Read the setup guide</TextLink>.
</p>
<TextLink variant="quiet" href="/forgot-password">Forgot password?</TextLink>
<TextLink href="https://modelcontextprotocol.io" external>The MCP spec</TextLink>
// Incorrect: brand at rest with the underline only on hover; a new tab nobody is told about
<Link href="/signin" className="font-medium text-brand-foreground hover:underline">Sign in</Link>
<a href={href} target="_blank" className="font-medium hover:underline">{url}</a>
```
