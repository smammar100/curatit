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

## Button (`elements/Button.tsx`, wraps `ui/button`)

Since 2026-10-23 Fluid Functionalism's button behind the site's API. Every action, and with
`isLink` + `href` a next/link (the library's `asChild`) for a link that is the page's next step.
Never a hand-made `<button>` styled like one: it misses the ring, the press, the touch area. What
the library gives it: the surface sits 1px inside the button and a same-colour shadow fills it
out, so a press shrinks it by exactly 1px a side at any width (no `scale`); a label never wraps;
colour changes take 80ms; the corners and height come from the shape and size providers.

Variants, and nothing else (no `primary`, `ghost`, `outline`, `destructive`; the type refuses
them). Each is one of the library's four looks:

- `default` (the default): the ink (the library's primary). One per view: two solids leave no next step.
- `muted`: a see-through tint of whatever it sits on (the library's secondary): the other choice
  beside the default. `secondary`: a hairline ring, a tint on hover (the library's tertiary): a
  dashboard control on its own (Create, Saved, Share, More, Copy token). `transparent`: words
  alone until hovered (ghost): quiet, inside something (Sign in, Close).
- `accent`: the primary look with the ink swapped for the brand (`--foreground` set to
  `--color-brand-solid` on the button alone), rare, never beside a default. `danger`: the same
  with the danger colour; confirms what can't be undone. `dangerSubtle`: the tinted look with the
  danger tint and red words; starts something destructive that asks first. `none`: the ghost
  look for a trigger that brings its own picture (an avatar).

```
Which variant?
 ├── The one next step in this view → default
 ├── Confirms what can't be undone → danger
 ├── Starts something destructive that asks first → dangerSubtle
 ├── The other choice beside the default → muted
 ├── A dashboard control on its own → secondary
 ├── Quiet, inside something else → transparent
 └── Brings its own picture (an avatar trigger) → none
```

Sizes are the site's seven names, every one on the library's compact step: `xxs`, `xs`, `sm`,
`base` (default), `md`, `lg` and `xl` all render the same 28px button with 12/18 text and 14px
icons. The names are kept for call sites (the hero's calls and the dashboard header say `lg`, a
dialog's submit `xl`), and they change nothing. A button reaches 44px on touch screens through
an invisible `::after`. `shape` is accepted for older call sites and ignored: every button is a
pill.

```
Which size?
 └── Anywhere → base (28px); lg and xl are accepted aliases, kept for call sites
```

- `iconOnly`: a 28px square; children are the icon, sized by the
  button (14px). Requires `aria-label` or `aria-labelledby` (it doesn't compile without
  one), saying what it does: "Close", never "icon".
- `leftIcon` / `rightIcon`: icon slots beside the label, set 4px closer to the edge than the
  words; `gap` widens the space between them (`xs` … `lg`).
- `loading`: the library's figure-eight spinner over the label, which stays mounted at opacity 0
  so the width holds. The button is disabled meanwhile (the library's way): it can't be pressed
  again and leaves the tab order, so for a long wait say what's happening in words nearby.
  Client components only.
- `disabled`: only while it can't act yet (no name typed). Never for a request in flight.
- Width is decided per use: a standalone CTA `w-fit`, a form's submit `w-full`, a row nothing.
- No `border`, `ring-*`, `outline-*`, `rounded-*` or `h-*` in className; the press is built in,
  never add `active:scale`.

```tsx
<div className="flex flex-wrap gap-3">
  <Button isLink size="lg" href="/signup">Start your swipe file</Button>
  <Button isLink size="lg" variant="muted" href="/#how-it-works">See how it works</Button>
</div>
<Button variant="transparent" iconOnly size="sm" aria-label="Clear search" onClick={clear}>
  <Close className="size-3.5" />
</Button>
<Button size="xl" className="w-full" loading={saving} type="submit">Create board</Button>
// Incorrect: variants that don't exist, two solids in one row, a pill or a height by className
<Button variant="primary">Create account</Button>
<Button variant="default">Submit a site</Button><Button variant="accent">Skip the line</Button>
<Button className="h-10 rounded-full">Share</Button>
```

## TextLink (`elements/TextLink.tsx`, server)

A link that is words, on next/link (internal links navigate in place and prefetch). An action is a
Button even when it looks quiet (`variant="transparent"`); a next step drawn as a button is
`Button isLink`; markdown bodies keep the prose links (`Wrapper variant="prose"`).

Variants `inline` (default) and `quiet`, plus `external`. Nothing else: no brand-at-rest link, no
bold link.

- `inline`: inside a sentence. The sentence's colour, a 1px underline in the one stroke
  (`decoration-border`) 2px below; words and line turn `brand-foreground` on hover, in 80ms.
  The underline never comes off (colour alone fails WCAG 1.4.1).
- `quiet`: on its own or in a list (Forgot password?, Back to Saved). The muted ink, no
  underline, the ink on hover. Reaches 44px on touch through `::after`: space a list of them
  44px apart.
- `external`: new tab, `rel="noreferrer"` (your `rel` is kept), the ArrowUpRight glyph held to the
  last word, "(opens in a new tab)" for screen readers.
- Focus is the 1px ring on a 4px corner, on keyboard focus only.
- Link words name the destination and make sense alone: never "click here" or a bare URL.

```tsx
<p className="text-body-sm text-muted-foreground">
  Tokens stay in your environment. <TextLink href="/docs/mcp">Read the setup guide</TextLink>.
</p>
<TextLink variant="quiet" href="/forgot-password">Forgot password?</TextLink>
<TextLink href="https://modelcontextprotocol.io" external>The MCP spec</TextLink>
// Incorrect: brand at rest with the underline only on hover; a new tab nobody is told about
<Link href="/signin" className="font-medium text-brand-foreground hover:underline">Sign in</Link>
<a href={href} target="_blank" className="font-medium hover:underline">{url}</a>
```
