# Display: Badge, Avatar, Kbd, Separator, Card, Spinner, Skeleton

Components that show something and take no click of their own. Live sheets: `/system/<name>`.
`className` is layout only on all of them: `cx` doesn't merge, so a second colour or size lands too.

## Badge (`elements/Badge.tsx`, server)

A short label for the state of the thing beside it: Beta, a status, a scope, a count in a row.
Something to press is a `Button` (`size="xxs"`, `variant="muted"`); one choice of a few is
`Segmented`; a trait of open length is a tag; an error is a field note or a Notice, with an icon.

Variants `default` (the default), `outline`, `inverted`, `danger`, `brand`, `transparent`; sizes
`sm` 16, `md` 20 (default), `lg` 24; `shape="pill"`. Nothing else exists: no warning or success badge.

- `default`: everything, Beta included (Beta is monochrome, decided 2026-10-13).
- `inverted`: the settled state in a status row (Approved, Public), a count to find on a row.
- `outline`: the other states in that row. `danger`: refused or missing, always in words.
- `brand`: unused; one per screen for Curatit's own news. Never beside a danger badge (same hue).

```tsx
<Badge>Beta</Badge>
<Badge size="lg" shape="pill" variant="danger">Partial: 3 of 7 slides</Badge>
// Incorrect: terracotta Beta, a click on a span, a bare red number
<Badge variant="brand">Beta</Badge>
<Badge onClick={clear}>Clear</Badge>
```

## Avatar (`elements/Avatar.tsx`, client)

A person: their picture, or up to two initials on `bg-brand-subtle` when the picture is missing,
`null` or broken (also when it failed before hydration). A brand's or an app's mark is a plain image
with the edge line, never an Avatar. While the session loads: `<Skeleton shape="circle">`.

Sizes `xs` 20, `sm` 24, `md` 32 (default), `lg` 44; `decorative`. Always a circle; no ring, dot or
square. `name` is required (alt text and initials). `decorative` only when the name is written
beside it; inside a button the button is named and the Avatar is decorative. A plain `img`:
avatar hosts aren't in next.config's image list, so `next/image` answers 400.

```tsx
<Button variant="none" iconOnly shape="pill" size="lg" aria-label="Account menu">
  <Avatar src={user.avatar} name={user.name} decorative />
</Button>
// Incorrect: no alt, no fallback (Google's links expire), and a host next/image refuses
<img src={user.avatar} className="size-8 rounded-full" />
<Image src={user.avatar} alt={user.name} width={32} height={32} />
```

## Kbd (`elements/Kbd.tsx`, server)

A key to press, as a cap. Only for a shortcut that exists. Something to click is a `Button`; a value
to copy is `CopyBlock` or `<code>`.

Sizes `sm` 20, `md` 24 (default). One key as children; a combination as `keys` (`cmd`, `shift`,
`option`, `alt`, `ctrl`, `enter`, `esc`, `tab`, `space`, `backspace`, arrows; letters capitalised),
each key read by name. `hideOnTouch` in controls. ⌘/⌥ are Mac-only: the client component that binds
the shortcut picks the keys. No `onClick` or `tabIndex` in the type.

```
One key → <Kbd>/</Kbd>     Pressed together → keys={["cmd", "k"]}
One after another → two Kbds with "then"     Something to click → Button
```

```tsx
<Kbd hideOnTouch>/</Kbd>
<Kbd keys={isMac ? ["cmd", "k"] : ["ctrl", "k"]} />
// Incorrect: one cap for two keys, read "place of interest sign K"
<Kbd>⌘K</Kbd>
```

## Separator (`elements/Separator.tsx`, server)

A 1px line between two groups that space alone doesn't separate: a menu's groups, a toolbar's halves.
Most of the time use a gap. Rows of a list are `divide-y divide-border-default` on the list. A new
topic is a heading.

`orientation` `horizontal` (default) | `vertical` (stretches in a flex row; elsewhere give it `h-4`);
`tone` `default` 6% (default) | `subtle` 2% (dense tables) | `strong` 15% (on a mat or beside a
cover); `semantic` for `role="separator"` (default `role="none"`). Never 2px: that's the focus ring.

```tsx
<Separator semantic className="my-1.5" />   // between a menu's actions and Delete
// Incorrect: a 2px solid grey, and a line under every row
<hr className="my-4 border-t-2 border-base-200" />
```

## Card (`molecules/Card.tsx`, server)

A grouped surface: one thing and what's said about it (a post, a plan, a client to connect). A
group space can hold is a plain div; floating things are Menu or Dialog; messages are Notice; a
page section is a Wrapper.

`Card`: `variant` `mat` (bg-card, default; under images) | `raised` (bg-container + shadow-xs; text
and controls); `padding` `sm` 8 | `md` 16 | `lg` 24 (default); `tag` div | article | section | li.
Always `rounded-2xl`. Parts: `CardMedia` (`aspect` `8/5` default, `4/5`, `1/1`, `16/9`, `natural`;
next/image inside), `CardTitle` (`size` `sm` default, `md`, `lg` serif; `tag` h3 default; `href`),
`CardMeta` (`uppercase`), `CardDescription`. Spacing between parts is yours (`mt-4` after media,
`mt-1` between words).

- Media corner = 12 − padding: `sm` 4px, `md` square, `lg` its own 4px. Never round the image yourself.
- `CardTitle href` stretches its link over the card: named by the title, ring round the card.
  Meta and description stay selectable; a second control takes `relative z-20`.
- Words under the mat (blog, store): wrap in `<article className="relative isolate">`.

```tsx
<Card tag="article">
  <CardMedia><Image src={cover} alt={alt} width={1920} height={1200} sizes="33vw" /></CardMedia>
  <CardMeta className="mt-4" uppercase>{category}</CardMeta>
  <CardTitle className="mt-1" href={href}>{title}</CardTitle>
</Card>
// Incorrect: an empty overlay link and a hand-rounded image with Tailwind's shadow
<Link href={href} className="absolute inset-0 z-10" />
<img src={cover} className="rounded-xl shadow" />
```

## Spinner (`elements/Spinner.tsx`, server)

An inline wait of a second or two, beside what's waiting. A button's own request is
`<Button loading>`; a region with a known layout is Skeleton; longer work is words.

Sizes `sm` 14, `md` 16 (default), `lg` 20. Exactly one of `label` (a `role="status"`, read once:
"Saving note") or `decorative` (the control around it already says it's busy); a bare `<Spinner />`
doesn't compile. Colour is the text's, never brand. Still under reduced motion. Never under 300ms.

```tsx
<p role="status" className="flex items-center gap-2 text-body-sm text-secondary-foreground">
  <Spinner size="sm" decorative /> Saving note…
</p>
// Incorrect: the notch by hand, and disabled standing in for loading
<Button disabled={saving}><CircleNotch className="size-4 animate-spin" /> Save</Button>
```

## Skeleton (`elements/Skeleton.tsx`, server)

The shape of content on its way, in its exact box so nothing moves when it lands. A wait inside a
control is Spinner; "nothing here" is EmptyState.

`shape` `rect` (default; `radius` `sm` default, `lg`, `2xl`, `full`, `none`; sized by className),
`line` (`width` `full` default … `1/4`; put it inside the text's own type class: box `1lh`, bar
`0.75em`), `circle` (`size` as Avatar's, `md` default). Every block is `aria-hidden`; the region
around them is one `role="status"` with an `aria-label`. Shimmer every 1.6s, still under reduced motion.

```tsx
<div role="status" aria-label="Loading boards">
  <Skeleton className="aspect-8/5 w-full" />
  <div className="mt-4 text-body-sm"><Skeleton shape="line" width="2/3" /></div>
</div>
// Incorrect: Tailwind's grey and pulse, a guessed height, a label on every block
<div role="status" className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
```
