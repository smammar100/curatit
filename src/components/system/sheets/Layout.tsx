// /system/layout: the Wrapper's widths, the page gutter, the vertical rhythm (page-start,
// section-y, the footer's margin) and the card anatomy, drawn with the tokens in both themes.
// Sources: fundations/containers/Wrapper.tsx, the two @utility rules in src/styles/global.css,
// global/Footer.tsx (mt-12 lg:mt-16, px-4), blog/BlogCard.tsx and AGENTS.md's page rhythm and
// gutter guardrails
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import Text from "@/components/fundations/elements/Text";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../SheetParts";
import { cx } from "@/lib/cx";

// Hatching marks padding and spacing in every diagram on this sheet. Token colours, so it flips
// with the panel's theme
const HATCH: CSSProperties = {
  backgroundImage: "repeating-linear-gradient(135deg, var(--color-border-strong) 0 1px, transparent 1px 5px)",
};

// A class name in the primary ink. Mono carries text-secondary-foreground, and cx doesn't merge,
// so a second colour class on it would leave the winner to stylesheet order
function Strong({ children }: { children: ReactNode }) {
  return <code className="font-mono text-caption-lg text-primary-foreground">{children}</code>;
}

/* ---------- Widths ---------- */

// The widest Wrapper: standard from 2xl (110rem). Every bar is drawn against it
const WIDEST = 1760;
const GUTTER = 32;

const WIDTHS: {
  label: string;
  sub?: string;
  max: number | null;
  cls: string;
  content: string;
  use: string;
}[] = [
  {
    label: 'variant="standard"',
    sub: "the default",
    max: 1280,
    cls: "max-w-7xl",
    content: "up to 1216px",
    use: "Every marketing section",
  },
  {
    label: 'variant="standard"',
    sub: "from 2xl, 1536px",
    max: 1760,
    cls: "2xl:max-w-[110rem]",
    content: "up to 1696px",
    use: "The same Wrapper on a wide screen. At 1536px its cap lifts from 1280px to 1760px, so it fills the window until the window is 1760px wide",
  },
  {
    label: 'variant="narrow"',
    max: 576,
    cls: "max-w-xl",
    content: "up to 512px",
    use: "A section that is only a short column (the blog and sites tag indexes)",
  },
  {
    label: "<div> column",
    sub: "not a Wrapper",
    max: 576,
    cls: "mx-auto max-w-xl sm:px-8",
    content: "up to 512px",
    use: "A short column under something wider in the same section (the FAQ's questions, a blog post's body)",
  },
  {
    label: 'variant="prose"',
    max: null,
    cls: "prose max-w-none",
    content: "its parent's",
    use: "Markdown bodies (legal pages, blog posts), styled by the typography plugin. Goes inside the page's Wrapper",
  },
];

function WidthBar({ max }: { max: number | null }) {
  if (max === null) return <span className="text-body-sm text-secondary-foreground">No width of its own</span>;
  const gutter = { ...HATCH, width: `${(GUTTER / max) * 100}%` };
  return (
    <div aria-hidden className="flex h-8 w-full items-center justify-center rounded-md bg-card">
      <div className="flex h-6 overflow-hidden rounded-sm bg-component" style={{ width: `${(max / WIDEST) * 100}%` }}>
        <span className="h-full" style={gutter} />
        <span className="flex-1" />
        <span className="h-full" style={gutter} />
      </div>
    </div>
  );
}

/* ---------- Gutter ---------- */

// The two screens are drawn at 45%, so the 640px one still fits a phone's panel
const S = 0.45;

function Screen({ width, gutter, title, note }: { width: number; gutter: number; title: string; note: ReactNode }) {
  const g = gutter * S;
  const inset = 16 * S; // the footer and Vision panels stay px-4 from the window at every width
  return (
    <figure className="flex flex-col gap-3">
      <div
        role="img"
        aria-label={`A ${width}px screen: text and cards ${gutter}px from each edge, a sideways row running to the edge from a first item on the gutter, and the footer panel 16px from the edges`}
        className="pointer-events-none relative overflow-hidden rounded-xl bg-page py-4 shadow-xs select-none"
        style={{ width: width * S }}
      >
        <div className="flex flex-col gap-2" style={{ paddingInline: g }}>
          <span className="block h-3 w-3/4 rounded-sm bg-component-active" />
          <span className="block h-1.5 w-full rounded-sm bg-component" />
          <span className="block h-1.5 w-2/3 rounded-sm bg-component" />
          <div className="mt-2 rounded-md bg-card" style={{ padding: 24 * S }}>
            <span className="block aspect-8/5 rounded-sm bg-component shadow-sm" />
          </div>
          <div className="mt-2 flex gap-1.5 overflow-hidden" style={{ marginInline: -g, paddingInline: g }}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="block h-10 w-16 shrink-0 rounded-sm bg-component" />
            ))}
          </div>
        </div>
        <div className="mt-4 h-10 rounded-md bg-component-active" style={{ marginInline: inset }} />
        <span className="absolute inset-y-0 left-0" style={{ ...HATCH, width: g }} />
        <span className="absolute inset-y-0 right-0" style={{ ...HATCH, width: g }} />
      </div>
      <figcaption className="flex max-w-72 flex-col gap-0.5">
        <Strong>{title}</Strong>
        <span className="text-caption-lg text-secondary-foreground">{note}</span>
      </figcaption>
    </figure>
  );
}

const GUTTERS: { label: string; sub?: string; phone: string; sm: string; cls: ReactNode }[] = [
  { label: "Wrapper", sub: "standard, narrow", phone: "16px", sm: "32px", cls: <Mono>px-4 sm:px-8</Mono> },
  {
    label: "<div> column",
    sub: "inside a standard Wrapper",
    phone: "16px",
    sm: "32px + 32px",
    cls: (
      <span className="text-body-sm text-secondary-foreground">
        The Wrapper&rsquo;s <Mono>px-4</Mono> on phones, then its own <Mono>sm:px-8</Mono>: the same lines as a narrow
        Wrapper
      </span>
    ),
  },
  {
    label: "Wrapper in a Wrapper",
    sub: "never",
    phone: "32px",
    sm: "64px",
    cls: <span className="text-body-sm text-secondary-foreground">Two gutters: phone text starts 32px in</span>,
  },
  {
    label: "Inset panel",
    sub: "footer, Vision",
    phone: "16px",
    sm: "16px",
    cls: (
      <span className="text-body-sm text-secondary-foreground">
        <Mono>px-4</Mono> from the window at every width
      </span>
    ),
  },
  {
    label: "Sideways row",
    sub: "a scroller",
    phone: "to the edge",
    sm: "to the edge",
    cls: (
      <span className="text-body-sm text-secondary-foreground">
        <Mono>-mx-4 px-4 sm:-mx-8 sm:px-8</Mono>: its first item starts on the gutter
      </span>
    ),
  },
];

/* ---------- Vertical rhythm ---------- */

// Spacing is drawn at half size; content blocks are schematic
const RHYTHM = [
  { title: "Under 1024px", top: 112, half: 48, footer: "mt-12", between: 96 },
  { title: "From lg, 1024px", top: 160, half: 64, footer: "lg:mt-16", between: 128 },
];

function Value({ px, name }: { px: number; name: string }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <Strong>{px}</Strong>
      <Mono>{name}</Mono>
    </span>
  );
}

function PageDiagram({ title, top, half, footer, between }: (typeof RHYTHM)[number]) {
  const rows: { h: number; space?: boolean; frame?: ReactNode; label: ReactNode }[] = [
    {
      h: top / 2,
      space: true,
      frame: <span className="absolute inset-x-0 top-0 h-6 rounded-t-lg bg-component" />,
      label: (
        <span className="flex flex-col">
          <Value px={top} name="page-start" />
          <span className="text-caption-lg text-secondary-foreground">the fixed nav sits inside it</span>
        </span>
      ),
    },
    {
      h: 44,
      frame: (
        <span className="mx-2.5 flex flex-1 flex-col gap-1.5 self-start">
          <span className="block h-3 w-4/5 rounded-sm bg-component-active" />
          <span className="block h-1.5 rounded-sm bg-component" />
          <span className="block h-1.5 w-3/5 rounded-sm bg-component" />
        </span>
      ),
      label: <span className="text-caption-lg text-secondary-foreground">h1, the first line</span>,
    },
    { h: half / 2, space: true, label: <Value px={half} name="page-start" /> },
    { h: half / 2, space: true, label: <Value px={half} name="section-y" /> },
    {
      h: 52,
      frame: <span className="mx-2.5 flex-1 self-stretch rounded-sm bg-component" />,
      label: <span className="text-caption-lg text-secondary-foreground">each later section</span>,
    },
    { h: half / 2, space: true, label: <Value px={half} name="section-y" /> },
    { h: half / 2, space: true, label: <Value px={half} name={footer} /> },
    {
      h: 36,
      frame: <span className="mx-1.5 mb-1.5 flex-1 self-stretch rounded-md bg-component-active" />,
      label: <span className="text-caption-lg text-secondary-foreground">footer panel</span>,
    },
  ];
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-caption-lg tracking-wider text-secondary-foreground uppercase">{title}</figcaption>
      <div
        role="img"
        aria-label={`${title}: page-start puts the first line ${top}px from the window's top; sections are ${between}px apart, ${half}px from each side; the footer is ${between}px below the last section`}
        className="pointer-events-none grid grid-cols-[5rem_minmax(0,1fr)_2.75rem] gap-x-3 select-none"
        style={{ gridTemplateRows: rows.map((r) => `${r.h}px`).join(" ") }}
      >
        <span className="col-start-1 row-span-full rounded-lg bg-page shadow-xs" />
        {rows.map((r, i) => (
          <span
            key={`f${i}`}
            className={cx("relative col-start-1 flex", i === 0 && "overflow-hidden rounded-t-lg")}
            style={{ gridRow: `${i + 1}`, ...(r.space ? HATCH : {}) }}
          >
            {r.frame}
          </span>
        ))}
        {rows.map((r, i) => (
          <span key={`l${i}`} className="col-start-2 flex items-center" style={{ gridRow: `${i + 1}` }}>
            {r.label}
          </span>
        ))}
        {["3 / 5", "6 / 8"].map((span) => (
          <span key={span} className="col-start-3 flex items-center gap-1.5" style={{ gridRow: span }}>
            <span className="block h-full w-1.5 rounded-r-xs border-y border-r border-border-strong" />
            <Strong>{between}</Strong>
          </span>
        ))}
      </div>
    </figure>
  );
}

/* ---------- Cards ---------- */

function AnatomyCard() {
  return (
    <article className="relative">
      <div className="rounded-2xl bg-card p-6">
        <div className="aspect-8/5 w-full rounded bg-component shadow-sm" />
      </div>
      <Text variant="captionLG" className="mt-4 tracking-wider text-secondary-foreground uppercase">
        Category · Carousel
      </Text>
      <Text tag="h4" variant="bodySM" className="mt-2 font-medium text-primary-foreground">
        <Link
          href="/library"
          className="transition-colors duration-150 after:absolute after:inset-0 after:rounded-2xl hover:text-brand-foreground focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-brand-border-focus"
        >
          The title is the card&rsquo;s one link
        </Link>
      </Text>
    </article>
  );
}

const PARTS: { name: string; cls: string; why: ReactNode }[] = [
  {
    name: "Mat",
    cls: "rounded-2xl bg-card p-6",
    why: (
      <>
        The grey mat frames any cover, light or dark. A white card is <Mono>bg-container shadow-xs</Mono> instead.
      </>
    ),
  },
  {
    name: "Image",
    cls: "rounded shadow-sm",
    why: (
      <>
        <Mono>next/image</Mono> with <Mono>width</Mono> and <Mono>height</Mono>, cropped to a ratio (
        <Mono>aspect-8/5 object-cover</Mono> on the blog and store cards). Bare <Mono>shadow</Mono> is
        Tailwind&rsquo;s own black drop, not the token, so it misses the dark treatment.
      </>
    ),
  },
  {
    name: "Meta",
    cls: "mt-4 · captionLG uppercase tracking-wider",
    why: <>Category, format or date in <Mono>text-secondary-foreground</Mono>. Uppercase needs the wider tracking.</>,
  },
  {
    name: "Title",
    cls: 'mt-2 · Text tag="h3" variant="bodySM"',
    why: (
      <>
        <Mono>font-medium text-primary-foreground</Mono> (or <Mono>variant=&quot;h6&quot;</Mono> for a larger card).
      </>
    ),
  },
  {
    name: "Link",
    cls: "after:absolute after:inset-0",
    why: (
      <>
        On the title&rsquo;s link, with <Mono>relative</Mono> on the card: the whole card is the target, and a screen
        reader reads the title as the link&rsquo;s name. <Mono>hover:text-brand-foreground</Mono> on the link, and the
        focus ring on the <Mono>::after</Mono> (<Mono>focus-visible:after:outline-brand-border-focus</Mono>) so it
        rings the card, not the title.
      </>
    ),
  },
];

/* ---------- Code ---------- */

const NESTING_CORRECT = `<section>
  <Wrapper className="section-y">
    <Text tag="h2" variant="h1" className="text-center text-primary-foreground">
      Frequently asked questions
    </Text>
    <div className="mx-auto mt-12 max-w-xl sm:px-8">…</div>
  </Wrapper>
</section>`;

const NESTING_INCORRECT = `<section>
  <Wrapper className="section-y">
    <Text tag="h2" variant="h1" className="text-center text-primary-foreground">
      Frequently asked questions
    </Text>
    <Wrapper variant="narrow" className="mt-12">…</Wrapper>
  </Wrapper>
</section>`;

const RHYTHM_CORRECT = `<section>
  <Wrapper className="page-start">…</Wrapper>
</section>
<section>
  <Wrapper className="section-y">…</Wrapper>
</section>`;

const RHYTHM_INCORRECT = `<section>
  <Wrapper className="pt-32 pb-16">…</Wrapper>
</section>
<section>
  <Wrapper className="py-24">…</Wrapper>
</section>`;

const CARD_CORRECT = `<article className="relative">
  <div className="rounded-2xl bg-card p-6">
    <Image
      src={cover}
      alt={alt}
      width={800}
      height={500}
      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
      className="aspect-8/5 w-full rounded object-cover shadow-sm"
    />
  </div>
  <Text
    variant="captionLG"
    className="mt-4 tracking-wider text-secondary-foreground uppercase"
  >
    {category}
  </Text>
  <Text
    tag="h3"
    variant="bodySM"
    className="mt-2 font-medium text-primary-foreground"
  >
    <Link
      href={href}
      className="transition-colors duration-150 after:absolute after:inset-0
        after:rounded-2xl hover:text-brand-foreground focus-visible:outline-none
        focus-visible:after:outline-2 focus-visible:after:outline-offset-4
        focus-visible:after:outline-brand-border-focus"
    >
      {title}
    </Link>
  </Text>
</article>`;

const CARD_INCORRECT = `<article className="relative">
  <Link href={href} title={title} className="absolute inset-0 z-10" />
  <div className="rounded-2xl bg-card p-6">
    <img src={cover} alt={alt} className="w-full rounded shadow" />
  </div>
  …
</article>`;

export default function Layout() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Layout">
        One container, the Wrapper, sets every page&rsquo;s width and its gutter: 16px from the screen&rsquo;s edges on
        phones, 32px from 640px. Two utilities, <Mono>page-start</Mono> and <Mono>section-y</Mono>, set the rhythm down
        the page, so every page&rsquo;s first line and every gap between sections land in the same place.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                <Mono>&lt;section&gt;</Mono> around a <Mono>Wrapper</Mono> (<Mono>fundations/containers/Wrapper</Mono>
                ), the only page-width container. Never rebuild it with <Mono>mx-auto max-w-7xl px-…</Mono>: the next
                change to the gutter would miss that page.
              </>
            ),
          },
          {
            term: "Variants",
            text: (
              <>
                <Mono>standard</Mono> (the default: every marketing section), <Mono>narrow</Mono> (a section that is
                only a short column), <Mono>prose</Mono> (Markdown bodies). Nothing else exists.
              </>
            ),
          },
          {
            term: "Rhythm",
            text: (
              <>
                <Mono>className=&quot;page-start&quot;</Mono> on the first section&rsquo;s Wrapper,{" "}
                <Mono>className=&quot;section-y&quot;</Mono> on every one after. Never <Mono>py-*</Mono> or{" "}
                <Mono>pt-*</Mono> on a section&rsquo;s Wrapper: the two utilities are what keep the first line 112px /
                160px from the top and neighbours 96px / 128px apart on every page.
              </>
            ),
          },
          {
            term: "One Wrapper",
            text: (
              <>
                Never a <Mono>standard</Mono> or <Mono>narrow</Mono> Wrapper inside another: each brings{" "}
                <Mono>px-4 sm:px-8</Mono>, so the phone gutter doubles to 32px. A short column under something wider
                in the same section (a centred heading, a full-width image) is a plain{" "}
                <Mono>mx-auto max-w-xl sm:px-8</Mono> div. <Mono>prose</Mono> is the one Wrapper that nests: it has no
                padding and no max width.
              </>
            ),
          },
          {
            term: "Phones",
            text: (
              <>
                Everything sits 16px from the screen&rsquo;s edges: text, cards and inset panels (the footer and the
                Vision panel are <Mono>px-4</Mono> from the window at every width). A row that scrolls sideways bleeds
                with <Mono>-mx-4 px-4 sm:-mx-8 sm:px-8</Mono>, so it runs to the edge while its first item starts on
                the gutter.
              </>
            ),
          },
          {
            term: "Page title",
            text: (
              <>
                Every marketing <Mono>h1</Mono> is <Mono>Text tag=&quot;h1&quot; variant=&quot;h1&quot;</Mono> (
                <Mono>displayLG</Mono>, the older name, is the same classes) in <Mono>text-primary-foreground</Mono>:
                36px, 44px from 640px, 56px from 1024px. No weight class: the variant sets <Mono>font-normal</Mono>,
                Text joins classes without merging them, and Hedvig has one weight, so a <Mono>font-light</Mono> beside
                it only puts two weights on one element.
              </>
            ),
          },
          {
            term: "Images",
            text: (
              <>
                <Mono>next/image</Mono> with <Mono>width</Mono> and <Mono>height</Mono>, every time, and{" "}
                <Mono>sizes</Mono> to match the grid; for three up,{" "}
                <Mono>(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw</Mono>. Without a size the page jumps as
                each image arrives.
              </>
            ),
          },
          {
            term: "Set by hand",
            text: (
              <>
                The homepage hero (<Mono>pt-28 lg:pt-40</Mono> inside its full-screen frame) and the Vision panel are
                padded by hand to land on page-start&rsquo;s line. They are the two exceptions; don&rsquo;t copy them.
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which container? Take the first that fits
 ├── Markdown from src/content → <Wrapper variant="prose">, inside the section's Wrapper
 ├── A row that scrolls sideways → -mx-4 px-4 sm:-mx-8 sm:px-8 on the scroller
 ├── A short column under something wider in the same section
 │    └── <div className="mx-auto max-w-xl sm:px-8"> inside the standard Wrapper
 ├── A section that is only a short column → <Wrapper variant="narrow">
 └── Any other section → <section><Wrapper> (standard)`}
        />
        <Flow
          tree={`Which vertical space?
 ├── The page's first section → page-start on its Wrapper
 ├── Every section after it → section-y on its Wrapper
 ├── Between major blocks in a section → mt-12
 ├── A section's header row to its grid → mt-8
 ├── A title to its supporting text → mt-2 to mt-4
 └── Between cards in a grid → gap-8`}
        />
      </div>

      <SheetSection
        id="widths"
        title="Widths"
        description="The Wrapper's variants to scale, against a 1760px window. Hatching is the gutter: 32px a side from 640px, 16px below it."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(10rem,max-content)"
              template="minmax(16rem,1.5fr) minmax(9rem,max-content) max-content minmax(16rem,1fr)"
              columns={["to scale", "max width", "content", "use"]}
              rows={WIDTHS.map((w) => ({
                label: w.label,
                sub: w.sub,
                cells: [
                  <WidthBar key="b" max={w.max} />,
                  <span key="m" className="flex flex-col">
                    <Strong>{w.cls}</Strong>
                    {w.max !== null && <span className="text-caption-lg text-secondary-foreground">{w.max}px</span>}
                  </span>,
                  <span key="c" className="text-body-sm text-primary-foreground">
                    {w.content}
                  </span>,
                  <span key="u" className="text-body-sm text-secondary-foreground">
                    {w.use}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={NESTING_CORRECT}
            incorrect={{ code: NESTING_INCORRECT, why: "a second Wrapper doubles the phone gutter" }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="gutter"
        title="Gutter"
        description="A 375px phone beside a 640px screen, drawn at 45%. Text and cards sit on the gutter; the sideways row runs under it to the edge; the footer panel stays 16px in at both."
      >
        <Sheet>
          {() => (
            <div className="grid gap-10 xl:grid-cols-[auto_minmax(0,1fr)] xl:items-start">
              <div className="flex flex-wrap items-start gap-x-10 gap-y-8">
                <Screen width={375} gutter={16} title="375px" note={<>16px gutter: <Mono>px-4</Mono></>} />
                <Screen
                  width={640}
                  gutter={32}
                  title="640px and up"
                  note={
                    <>
                      32px gutter: <Mono>sm:px-8</Mono>. The footer panel keeps its 16px.
                    </>
                  }
                />
              </div>
              <Matrix
                first="minmax(10rem,max-content)"
                template="max-content max-content minmax(14rem,1fr)"
                columns={["under 640px", "from sm", "how"]}
                rows={GUTTERS.map((g) => ({
                  label: g.label,
                  sub: g.sub,
                  cells: [
                    <span key="p" className="text-body-sm text-primary-foreground">
                      {g.phone}
                    </span>,
                    <span key="s" className="text-body-sm text-primary-foreground">
                      {g.sm}
                    </span>,
                    <span key="c">{g.cls}</span>,
                  ],
                }))}
              />
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        id="rhythm"
        title="Vertical rhythm"
        description="One page from the window's top to the footer. Spacing is drawn at half size; the blocks are schematic. Each gap is two halves: the section above gives one, the section below the other."
      >
        <Sheet>
          {() => (
            <div className="grid gap-10 2xl:grid-cols-[auto_minmax(0,1fr)] 2xl:items-start">
              <div className="flex flex-wrap items-start gap-x-16 gap-y-10">
                {RHYTHM.map((r) => (
                  <PageDiagram key={r.title} {...r} />
                ))}
              </div>
              <Matrix
                first="minmax(10rem,max-content)"
                template="max-content max-content minmax(16rem,1fr)"
                columns={["under 1024px", "from lg", "what it does"]}
                rows={[
                  {
                    label: "page-start",
                    sub: "top",
                    cells: ["112px", "160px", "Puts the first line of content this far from the window's top, the fixed nav included"],
                  },
                  {
                    label: "page-start",
                    sub: "bottom",
                    cells: ["48px", "64px", "The first section's half of the gap below it"],
                  },
                  {
                    label: "section-y",
                    sub: "top and bottom",
                    cells: ["48px", "64px", "Every section after the first"],
                  },
                  {
                    label: "two neighbours",
                    sub: "half and half",
                    cells: ["96px", "128px", "The gap between any two sections"],
                  },
                  {
                    label: "mt-12 lg:mt-16",
                    sub: "on the footer",
                    cells: ["48px", "64px", "The footer's half, so the last section ends 96px / 128px above it"],
                  },
                ].map((row) => ({
                  label: row.label,
                  sub: row.sub,
                  cells: row.cells.map((c, i) => (
                    <span
                      key={i}
                      className={i < 2 ? "text-body-sm text-primary-foreground" : "text-body-sm text-secondary-foreground"}
                    >
                      {c}
                    </span>
                  )),
                }))}
              />
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={RHYTHM_CORRECT}
            incorrect={{ code: RHYTHM_INCORRECT, why: "hand-set padding moves this page off the shared lines" }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="cards"
        title="Cards"
        description="A card is a mat, an image, a meta line and a title whose link covers the card. Point at the card or tab to it: the whole card is one target."
      >
        <Sheet>
          {() => (
            <div className="grid items-start gap-10 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
              <AnatomyCard />
              <ol className="flex flex-col gap-4">
                {PARTS.map((part, i) => (
                  <li key={part.name} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2">
                    <span aria-hidden className="font-mono text-caption-lg text-secondary-foreground">
                      {i + 1}
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-body-sm font-medium text-primary-foreground">{part.name}</span>
                        <Mono>{part.cls}</Mono>
                      </span>
                      <span className="text-body-sm text-secondary-foreground">{part.why}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Sheet>
            {() => (
              <div className="flex flex-col gap-5">
                <p className="flex flex-wrap items-baseline gap-x-2 text-body-sm text-secondary-foreground">
                  <Strong>grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3</Strong>
                  <span>One column under 768px, two from md, three from lg; 32px both ways.</span>
                </p>
                <div
                  role="img"
                  aria-label="A card grid with 32px gaps: one column under 768px, two from 768px, three from 1024px"
                  className="pointer-events-none grid grid-cols-1 gap-8 select-none md:grid-cols-2 lg:grid-cols-3"
                >
                  {[0, 1, 2].map((i) => (
                    <div key={i}>
                      <div className="rounded-2xl bg-card p-6">
                        <div className="aspect-8/5 rounded bg-component shadow-sm" />
                      </div>
                      <span className="mt-4 block h-2 w-24 rounded-sm bg-component" />
                      <span className="mt-3 block h-3 w-3/4 rounded-sm bg-component-active" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Sheet>
        </div>
        <div className="mt-6">
          <Code
            correct={CARD_CORRECT}
            incorrect={{ code: CARD_INCORRECT, why: "an empty link and an image with no size" }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
