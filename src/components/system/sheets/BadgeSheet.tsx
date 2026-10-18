// /system/badge: Badge (src/components/fundations/elements/Badge.tsx), every variant, size and
// shape live in both themes, the places it's used, and when a badge isn't the answer. Every
// class is written out in full (never built from parts), so Tailwind sees it
import type { ComponentProps, ReactNode } from "react";
import Badge from "@/components/fundations/elements/Badge";
import Text from "@/components/fundations/elements/Text";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../SheetParts";

type Variant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

// The six variants (Badge.tsx's `variants`), most used first: their fill and text tokens, and
// where each one is used today
const VARIANTS: { variant: Variant; fill: string; text: string; use: string }[] = [
  {
    variant: "default",
    fill: "bg-component",
    text: "text-secondary-foreground",
    use: "The default, Beta included: both navigations, McpSection, /agents, a client's status on /docs/mcp, a token's scopes, the count in the account menu",
  },
  {
    variant: "outline",
    fill: "ring-border-strong",
    text: "text-secondary-foreground",
    use: "The plain states in a status row, beside inverted and danger ones: Needs review, Not public, Written by AI (review/parts.tsx)",
  },
  {
    variant: "inverted",
    fill: "bg-inverted-solid",
    text: "text-on-inverted-foreground",
    use: "What's settled or live: Approved and Public on the review page; a count standing alone at the end of a row, the insights on a slide (SlideBreakdown.tsx)",
  },
  {
    variant: "danger",
    fill: "bg-danger-subtle",
    text: "text-danger-foreground",
    use: "Something refused or incomplete, said in words: Rejected, Partial: 3 of 7 slides (review/parts.tsx)",
  },
  {
    variant: "brand",
    fill: "bg-brand-subtle",
    text: "text-on-brand-subtle-foreground",
    use: "Not used yet. Kept for a brand moment: Curatit's own news, on the page that announces it, one per screen",
  },
  {
    variant: "transparent",
    fill: "bg-transparent",
    text: "text-secondary-foreground",
    use: "Not used yet: a badge's box and type with no fill",
  },
];

// The three sizes (Badge.tsx's `sizes` and `radius`), each beside the text it sits with in a real use
const SIZES: { size: "sm" | "md" | "lg"; px: string; box: string; type: string; leading: string; radius: string; beside: ReactNode; use: string }[] = [
  {
    size: "sm",
    px: "16px",
    box: "h-4 px-1.5",
    type: "text-caption-base",
    leading: "11 / 16",
    radius: "rounded-sm",
    beside: (
      <span className="inline-flex items-center gap-1.5 text-body-sm whitespace-nowrap text-secondary-foreground">
        AI integration
        <Badge size="sm">Beta</Badge>
      </span>
    ),
    use: "Inside a link or a dense table cell: the navigations' Beta (beside 13px links on the bar and 18px ones in the phone menu, so the chip is the same in both), a token's scopes (ApiTokens.tsx)",
  },
  {
    size: "md",
    px: "20px",
    box: "h-5 px-1.5",
    type: "text-caption-lg",
    leading: "12 / 16",
    radius: "rounded-sm",
    beside: (
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-body-base font-medium text-primary-foreground">Claude Desktop</span>
        <Badge>Through the bridge</Badge>
      </span>
    ),
    use: "The default. Beside 13 to 15px text: the eyebrow on /agents, a client card's title (/docs/mcp), the count in the account menu; or alone above a heading (McpSection.tsx)",
  },
  {
    size: "lg",
    px: "24px",
    box: "h-6 px-2",
    type: "text-body-sm",
    leading: "13 / 20",
    radius: "rounded-md",
    beside: (
      <span className="flex flex-wrap items-center gap-1.5">
        <Badge size="lg" shape="pill" variant="outline">
          Needs review
        </Badge>
        <Badge size="lg" shape="pill" variant="outline">
          Written by AI
        </Badge>
      </span>
    ),
    use: "A status on its own row, with round ends: the review pages (review/parts.tsx's Pill)",
  },
];

// Every place a Badge is used, drawn with the call site's own classes (a link's click and
// hover left out, so the specimens aren't tab stops)
const USES: { file: string; where: string; code: string; specimen: ReactNode }[] = [
  {
    file: "Navigation.tsx",
    where: "The bar's AI integration link",
    code: '<Badge size="sm">Beta</Badge>',
    specimen: (
      <span className="inline-flex min-h-7 items-center gap-1.5 text-body-sm whitespace-nowrap text-secondary-foreground">
        AI integration
        <Badge size="sm">Beta</Badge>
      </span>
    ),
  },
  {
    file: "MobileNav.tsx",
    where: "The same link in the phone menu",
    code: '<Badge size="sm">Beta</Badge>',
    specimen: (
      <span className="flex min-h-11 items-center gap-2 text-body-lg font-medium text-primary-foreground">
        AI integration
        <Badge size="sm">Beta</Badge>
      </span>
    ),
  },
  {
    file: "McpSection.tsx",
    where: "Above the homepage section's heading (h1 there, h5 here)",
    code: "<Badge>Beta</Badge>",
    specimen: (
      <span className="block">
        <Badge>Beta</Badge>
        <Text tag="span" variant="h5" className="mt-6 block text-primary-foreground">
          Find references in your AI assistant.
        </Text>
      </span>
    ),
  },
  {
    file: "agents/page.tsx",
    where: "The page's eyebrow, over its h1",
    code: "<Badge>Beta</Badge>",
    specimen: (
      <span className="flex items-center gap-2 text-body-sm text-secondary-foreground">
        Curatit MCP
        <Badge>Beta</Badge>
      </span>
    ),
  },
  {
    file: "agents/page.tsx",
    where: "The beta note near the foot of the page",
    code: '<Badge className="w-fit">Beta</Badge>',
    specimen: (
      <span className="flex items-center gap-3 rounded-2xl bg-card p-5">
        <Badge className="w-fit">Beta</Badge>
        <span className="text-body-sm text-secondary-foreground">Things may change while we test it.</span>
      </span>
    ),
  },
  {
    file: "docs/mcp/page.tsx",
    where: "A client card's title and how it connects",
    code: "<Badge>{STATUS[client.status]}</Badge>",
    specimen: (
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-body-base font-medium text-primary-foreground">Claude Code</span>
        <Badge>Connects directly</Badge>
      </span>
    ),
  },
  {
    file: "AccountMenu.tsx",
    where: "The count in the Saved posts row",
    code: '<Badge className="font-medium tabular-nums">{savedCount}</Badge>',
    specimen: (
      <span className="flex items-center gap-2 text-subtitle font-medium text-primary-foreground">
        Saved posts
        <Badge className="font-medium tabular-nums">12</Badge>
      </span>
    ),
  },
  {
    file: "ApiTokens.tsx",
    where: "A token's scopes, in the tokens table",
    code: '<Badge size="sm" className="font-mono">{scope}</Badge>',
    specimen: (
      <span className="flex flex-wrap gap-1">
        <Badge size="sm" className="font-mono">
          read
        </Badge>
        <Badge size="sm" className="font-mono">
          brief
        </Badge>
      </span>
    ),
  },
  {
    file: "review/parts.tsx",
    where: "A post's status row on the review page (Pill: outline, inverted or danger)",
    code: '<Badge size="lg" shape="pill" variant="outline">',
    specimen: (
      <span className="flex flex-wrap items-center gap-1.5">
        <Badge size="lg" shape="pill" variant="outline">
          Needs review
        </Badge>
        <Badge size="lg" shape="pill" variant="outline">
          Written by AI
        </Badge>
        <Badge size="lg" shape="pill" variant="inverted">
          Public
        </Badge>
        <Badge size="lg" shape="pill" variant="danger">
          Partial: 3 of 7 slides
        </Badge>
      </span>
    ),
  },
  {
    file: "SlideBreakdown.tsx",
    where: "How many insights rest on a slide, at the end of its row. Its label is an aria-label on the span, which a span with no role may not carry; moving it into a visually hidden span is requested of its owner (see Counts)",
    code: '<Badge variant="inverted" shape="pill" aria-label={`${cited} insights point here`} title={…} className="min-w-5 justify-center tabular-nums">',
    specimen: (
      <span className="flex w-full items-center justify-between gap-3 text-body font-medium text-primary-foreground">
        Gallery frame
        <Badge
          variant="inverted"
          shape="pill"
          aria-label="2 insights point here"
          title="2 insights point here"
          className="min-w-5 justify-center tabular-nums"
        >
          2
        </Badge>
      </span>
    ),
  },
];

export default function BadgeSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Badge">
        A small label for the state of the thing beside it: Beta, a status, a scope. Six variants at
        16, 20 and 24px, with corners or round ends. It never takes a click.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                A short label for the state or kind of the thing beside it: Beta, a client&rsquo;s status, a review
                status, a token&rsquo;s scope, the count in a menu row. A short phrase, five words at most
                (&ldquo;Partial: 3 of 7 slides&rdquo;, &ldquo;AI, edited by an editor&rdquo;), from a set you know in
                advance.
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                Something to press or open is a <Mono>Button</Mono> (<Mono>size=&quot;xxs&quot;</Mono> or{" "}
                <Mono>xs</Mono>, <Mono>variant=&quot;muted&quot;</Mono> for a small one); one choice out of a few is
                a <Mono>Segmented</Mono> option. A trait of open length is a tag; a number on an icon button is the
                count bubble (both below). An error is the field&rsquo;s note or the <Mono>AuthNotice</Mono>{" "}
                panel, with an icon.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                <Mono>{"<Badge>"}</Mono>: the <Mono>default</Mono> variant at <Mono>md</Mono> (20px), radius by size.
                That&rsquo;s the Beta chip on the homepage and /agents. Change only what a rule here names.
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                Variants <Mono>default</Mono>, <Mono>outline</Mono>, <Mono>inverted</Mono>, <Mono>danger</Mono>,{" "}
                <Mono>brand</Mono>, <Mono>transparent</Mono>; sizes <Mono>sm</Mono>, <Mono>md</Mono>,{" "}
                <Mono>lg</Mono>; <Mono>shape=&quot;pill&quot;</Mono> or corners. Nothing else exists: there&rsquo;s
                no warning or success badge, and no size above 24px. An unlisted variant is a bug.
              </>
            ),
          },
          {
            term: "No click",
            text: (
              <>
                Badge is a <Mono>span</Mono> with no hover, press or focus state. It takes a span&rsquo;s
                attributes, so <Mono>onClick</Mono> type-checks, and makes a 16 to 24px target that a keyboard
                can&rsquo;t reach and a thumb barely hits (44px is the touch floor). Inside a link it&rsquo;s part of
                the label, and the link takes the click: the navigations&rsquo; Beta.
              </>
            ),
          },
          {
            term: "Size",
            text: (
              <>
                A badge&rsquo;s text is a step smaller than the text it labels (11, 12 and 13px at <Mono>sm</Mono>,{" "}
                <Mono>md</Mono>, <Mono>lg</Mono>) and its box no taller than that text&rsquo;s line, so it reads as a
                note on the label, not a second label. <Mono>md</Mono> beside 13 to 15px text; <Mono>sm</Mono>{" "}
                inside a link or beside 12px; <Mono>lg</Mono> for a status on its own row.
              </>
            ),
          },
          {
            term: "Brand",
            text: (
              <>
                Only for a brand moment: Curatit&rsquo;s own news, on the page that announces it, one per screen.
                Nothing uses it yet, so the first use is the owner&rsquo;s call. Never for Beta (the Beta chips are
                monochrome, decided on 2026-10-13), a status, a count or a category: terracotta is the interaction
                colour, so a terracotta label beside a link reads as one more link. This is about the Badge
                variant: the header&rsquo;s Saved count bubble (below) is the one deliberate terracotta count, not a
                Badge, on an icon button rather than beside a link. Never on a screen with a danger
                badge either: the two tints share a hue (about 35&deg;) and differ only in strength, so side by side
                they read as two warnings.
              </>
            ),
          },
          {
            term: "Danger",
            text: (
              <>
                Always with words that say what was refused or is missing: &ldquo;Rejected&rdquo;, &ldquo;Partial: 3
                of 7 slides&rdquo;. Never a red number, a dot or an empty badge, and never red for
                &ldquo;important&rdquo;: red alone says something&rsquo;s wrong, not what.
              </>
            ),
          },
          {
            term: "Pill",
            text: (
              <>
                For a status on its own row (the review pages, at <Mono>lg</Mono>) and a count standing alone at
                the end of a row (inverted, <Mono>min-w-5 justify-center</Mono>, so one digit sits in a circle: a
                slide&rsquo;s insights). A count beside the label that names it keeps its corners and the default
                variant (the account menu&rsquo;s Saved posts), and so do the Beta chips.
              </>
            ),
          },
          {
            term: "Counts",
            text: (
              <>
                <Mono>tabular-nums</Mono>, so 9 to 10 doesn&rsquo;t jiggle, and words for a screen reader: the
                row&rsquo;s own label (&ldquo;Saved posts 12&rdquo;) or a visually hidden phrase inside the badge (
                <Mono>{'2<span className="sr-only"> insights point here</span>'}</Mono>, under a positioned parent).
                Not <Mono>aria-label</Mono>: Badge is a span with no role, which ARIA doesn&rsquo;t let carry one. A
                bare number tells a screen reader nothing.
              </>
            ),
          },
          {
            term: "className",
            text: (
              <>
                Layout and figures only: <Mono>w-fit</Mono>, <Mono>min-w-5 justify-center</Mono>,{" "}
                <Mono>tabular-nums</Mono>, <Mono>font-mono</Mono> for a code value, <Mono>font-medium</Mono> on a
                count. Never a colour, height, padding or radius: <Mono>cx</Mono> doesn&rsquo;t merge, so both
                classes land and the stylesheet&rsquo;s order picks one. Never <Mono>dark:</Mono>: the tokens flip.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                Rebuild a badge by hand (the Beta chips once were: 10px type, a solid ring, a status dot). Put a
                long or unknown value in one: it&rsquo;s <Mono>whitespace-nowrap</Mono> and <Mono>shrink-0</Mono>,
                so it widens its row instead of wrapping or truncating.
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which variant?
 ├── Something refused or missing → danger,
 │     with the words (Rejected, Partial: 3 of 7 slides)
 ├── The settled or live state in a status row,
 │   or a count alone at the end of a row
 │   → inverted (a count as a pill)
 │     (Approved, Public, a slide's insights)
 ├── The other states in that row → outline
 │     (Draft, Needs review, Not public)
 ├── Curatit's own news, on the page that
 │   announces it → brand (not used yet: ask first)
 └── Anything else, Beta included → default`}
        />
        <Flow
          tree={`Which size?
 ├── Inside a link, or in a dense table cell → sm
 │     (the navigations' Beta, a token's scopes)
 ├── A status on its own row → lg, shape="pill"
 │     (the review pages)
 └── Beside 13 to 15px text, or alone above
     a heading → md, the default
       (/agents, /docs/mcp, McpSection)`}
        />
      </div>

      <SheetSection
        title="Variants and sizes"
        description="Every variant at every size, with corners and with round ends. The fill and text tokens are under each name; none of them has a hover, press or focus state."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(13rem,max-content)"
              template="repeat(6, max-content) minmax(16rem,1fr)"
              columns={["sm · 16", "md · 20", "lg · 24", "sm · pill", "md · pill", "lg · pill", "use"]}
              rows={VARIANTS.map((v) => ({
                label: v.variant,
                sub: (
                  <>
                    <Mono className="block">{v.fill}</Mono>
                    <Mono className="block">{v.text}</Mono>
                  </>
                ),
                cells: [
                  <Badge key="sm" variant={v.variant} size="sm">
                    Label
                  </Badge>,
                  <Badge key="md" variant={v.variant} size="md">
                    Label
                  </Badge>,
                  <Badge key="lg" variant={v.variant} size="lg">
                    Label
                  </Badge>,
                  <Badge key="sm-pill" variant={v.variant} size="sm" shape="pill">
                    Label
                  </Badge>,
                  <Badge key="md-pill" variant={v.variant} size="md" shape="pill">
                    Label
                  </Badge>,
                  <Badge key="lg-pill" variant={v.variant} size="lg" shape="pill">
                    Label
                  </Badge>,
                  <span key="use" className="text-body-sm text-secondary-foreground">
                    {v.use}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`{/* Beta is monochrome: the default */}
<Badge>Beta</Badge>

{/* Red carries the words that say what's wrong */}
<Badge size="lg" shape="pill" variant="danger">Partial: 3 of 7 slides</Badge>`}
            incorrect={{
              why: "Beta in terracotta, a colour class beside the variant's, and a red number",
              code: `<Badge variant="brand">Beta</Badge>

<Badge className="bg-accent-100 text-accent-700">Beta</Badge>

<Badge variant="danger" shape="pill">3</Badge>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        title="Sizes beside text"
        description="Each size with the text it sits beside in a real use. The badge's type is always a step below its neighbour's, and its box no taller than that line."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(5rem,max-content)"
              template="minmax(7rem,max-content) minmax(9rem,max-content) max-content minmax(16rem,max-content) minmax(16rem,1fr)"
              columns={["box", "type", "radius", "beside", "used on"]}
              rows={SIZES.map((s) => ({
                label: s.size,
                sub: s.px,
                cells: [
                  <Mono key="box">{s.box}</Mono>,
                  <span key="type" className="flex flex-col">
                    <Mono>{s.type}</Mono>
                    <Mono>{s.leading}</Mono>
                  </span>,
                  <Mono key="radius">{s.radius}</Mono>,
                  <span key="beside">{s.beside}</span>,
                  <span key="use" className="text-body-sm text-secondary-foreground">
                    {s.use}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="In use"
        description="Every Badge the site and the dashboard show today, drawn with its call site's classes. The Beta chips are the same default badge everywhere: sm inside the navigations' links, md on a page."
      >
        <Sheet>
          {() => (
            <Matrix
              first="15rem"
              template="20rem minmax(18rem,1fr)"
              align="start"
              columns={["specimen", "written as"]}
              rows={USES.map((u) => ({
                label: u.file,
                sub: u.where,
                cells: [
                  // relative: holds any sr-only phrase in a specimen, which would otherwise escape
                  // the matrix's scroller and widen the page on a phone
                  <span key="s" className="relative block w-full">
                    {u.specimen}
                  </span>,
                  <Mono key="c">{u.code}</Mono>,
                ],
              }))}
            />
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`{/* Navigation.tsx: part of the link's label; the link takes the click */}
<Link href="/agents" className="inline-flex items-center gap-1.5 text-body-sm text-secondary-foreground …">
  AI integration
  {link.beta && <Badge size="sm">Beta</Badge>}
</Link>

{/* McpSection.tsx: the default badge, alone above the heading */}
<Badge>Beta</Badge>
<Text tag="h2" variant="h1" className="mt-6 text-primary-foreground">…</Text>`}
            incorrect={{
              why: "the Beta chips by hand, before Badge: 10px type, solid rings, two looks",
              code: `<Link href="/agents" className="inline-flex items-center gap-1.5 text-xs text-base-600 hover:text-base-900">
  MCP
  <span className="rounded px-1 py-0.5 text-[10px]/none font-medium text-base-600 ring-1 ring-base-200">
    Beta
  </span>
</Link>

<span className="inline-flex items-center gap-2 rounded-md bg-base-50 px-2.5 py-1 text-xs font-medium text-base-900 ring-1 ring-base-200">
  <span className="size-1.5 rounded-full bg-base-400" aria-hidden="true" />
  Beta
</span>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        title="Badge, count or tag"
        description="Three small things that look alike. A badge labels a state, a count is a number, a tag describes; only the badge is this component, and none of them takes a click unless it's built as a button."
      >
        <Flow
          tree={`Badge, count or tag?
 ├── Can it be pressed, or does it open something?
 │    ├── One choice out of a few → Segmented
 │    ├── A chip that runs a search → a button
 │    │     (SearchBox.tsx's Chip, 44px tall)
 │    └── Any other action or link → Button (xxs or xs, muted)
 ├── Is it a number?
 │    ├── On an icon button → the count bubble (Header.tsx),
 │    │     with the number in the button's aria-label
 │    ├── Beside the label that names it → <Badge className="tabular-nums">,
 │    │     default, corners (the account menu's Saved posts)
 │    └── Alone at the end of a row → inverted, shape="pill"
 │          (SlideBreakdown.tsx's insights)
 ├── Is it a value of open length: a trait, an attribute?
 │     → a tag: the breakdown's chip (CreativeBreakdown.tsx,
 │       h-7 rounded-full bg-card text-caption), which truncates
 └── A short, known state of the thing beside it → <Badge>`}
        />
        <div className="mt-6 flex flex-col gap-6">
          <Code
            correct={`{/* A label takes no click */}
<Badge>Through the bridge</Badge>

{/* One choice out of a few */}
<Segmented aria-label="Expires in" value={days} onValueChange={setDays} options={…} />

{/* Something to press, however small */}
<Button size="xxs" variant="muted" onClick={clear}>Clear</Button>`}
            incorrect={{
              why: "a span with a click: no focus, no keyboard, 20px to tap",
              code: `<Badge onClick={clear} className="cursor-pointer hover:bg-component-hover">Clear</Badge>`,
            }}
          />
          <Code
            correct={`{/* AccountMenu.tsx: a count beside the label that says what it counts */}
<span className="flex items-center gap-2">
  Saved posts
  <Badge className="font-medium tabular-nums">{savedCount}</Badge>
</span>

{/* Header.tsx: on an icon button, the count bubble; the button's label carries the number */}
<Button
  iconOnly
  aria-label={savedCount ? \`Saved, \${savedCount} \${savedCount === 1 ? "post" : "posts"}\` : "Saved"}
  …
>
  <BookmarkSimple className="size-4.5" />
  <span className="absolute -top-1 -right-1 … rounded-full bg-brand-solid …">{savedCount}</span>
</Button>`}
            incorrect={{
              why: "a Badge pinned to an icon, and a label that never says the number",
              code: `<Button iconOnly aria-label="Saved" …>
  <BookmarkSimple className="size-4.5" />
  <Badge className="absolute -top-1 -right-1">{savedCount}</Badge>
</Button>`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
