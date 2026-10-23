// /system/shape: the radius scale, the shadows and the borders in src/styles/global.css, live in
// both themes. Every class is written out in full (never built from parts), so Tailwind sees it
import Image from "next/image";
import Badge from "@/components/fundations/elements/Badge";
import { cx } from "@/lib/cx";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../SheetParts";

// The radius scale (--radius-* in @theme), with one real use per step
const RADII: { cls: string; px: string; use: string }[] = [
  { cls: "rounded-xs", px: "2px", use: "Not used yet: the inner corner of a rounded-xl p-2 nest" },
  { cls: "rounded-sm", px: "4px", use: "Badge at sm and md (Badge.tsx), brand marks (BrandName.tsx), chips" },
  { cls: "rounded", px: "4px", use: "Images inside mats, with the edge line (the share page's covers, s/[token]/page.tsx). Tailwind's own default, the same 4px as rounded-sm" },
  { cls: "rounded-md", px: "6px", use: "Button at xxs and xs, Badge at lg (Button.tsx, Badge.tsx)" },
  { cls: "rounded-lg", px: "8px", use: "Button from sm up, every field (inputClass in AuthParts.tsx), the error notice" },
  { cls: "rounded-xl", px: "10px", use: "An inset panel inside a card: the consent screen's summary (OAuthConsent.tsx)" },
  { cls: "rounded-2xl", px: "12px", use: "Cards, mats and floating cards: the auth card ((auth)/layout.tsx), the pricing plan, these panels" },
  { cls: "rounded-3xl", px: "16px", use: "The review page's post stage (ReviewPost.tsx). Never a card" },
  { cls: "rounded-4xl", px: "20px", use: "The footer panel on phones (Footer.tsx)" },
  { cls: "rounded-5xl", px: "24px", use: "The footer panel from sm up (Footer.tsx)" },
  { cls: "rounded-full", px: "pill", use: "Pills (shape=\"pill\" on Button and Badge), avatars, round icon buttons" },
];

// Outer radius down, padding across: the inner radius that keeps the gap even. Where outer minus
// padding is zero or less the inner corner is square; the last column (24px) is where the two
// surfaces read apart and each keeps its own radius
type Nest = { box: string; inner: string };
const PADS = ["p-1 · 4px", "p-1.5 · 6px", "p-2 · 8px", "p-3 · 12px", "p-6 · 24px"];
const NESTS: { outer: string; px: string; cells: Nest[] }[] = [
  {
    outer: "rounded-lg",
    px: "8px",
    cells: [
      { box: "rounded-lg p-1", inner: "rounded-sm" },
      { box: "rounded-lg p-1.5", inner: "rounded-xs" },
      { box: "rounded-lg p-2", inner: "rounded-none" },
      { box: "rounded-lg p-3", inner: "rounded-none" },
    ],
  },
  {
    outer: "rounded-xl",
    px: "10px",
    cells: [
      { box: "rounded-xl p-1", inner: "rounded-md" },
      { box: "rounded-xl p-1.5", inner: "rounded-sm" },
      { box: "rounded-xl p-2", inner: "rounded-xs" },
      { box: "rounded-xl p-3", inner: "rounded-none" },
    ],
  },
  {
    outer: "rounded-2xl",
    px: "12px",
    cells: [
      { box: "rounded-2xl p-1", inner: "rounded-lg" },
      { box: "rounded-2xl p-1.5", inner: "rounded-md" },
      { box: "rounded-2xl p-2", inner: "rounded-sm" },
      { box: "rounded-2xl p-3", inner: "rounded-none" },
    ],
  },
  {
    outer: "rounded-3xl",
    px: "16px",
    cells: [
      { box: "rounded-3xl p-1", inner: "rounded-2xl" },
      { box: "rounded-3xl p-1.5", inner: "rounded-xl" },
      { box: "rounded-3xl p-2", inner: "rounded-lg" },
      { box: "rounded-3xl p-3", inner: "rounded-sm" },
    ],
  },
];

// The shadows (--shadow-* in @theme), described as each theme draws them: their colours are the
// --shadow-* and alpha-grey primitives, which flip in dark mode
const SHADOWS: { cls: string; same?: string; light: string; dark: string; job: string }[] = [
  {
    cls: "shadow-2xs",
    same: "same as xs",
    light: "A 1px ring, black at 7%",
    dark: "The same ring in white at 7%",
    job: "Interfere's other name for shadow-xs. Write xs",
  },
  {
    cls: "shadow-xs",
    light: "A 1px ring, black at 7%",
    dark: "The same ring in white at 7%",
    job: "The edge of a white card (bg-container): the pricing plan, these panels",
  },
  {
    cls: "shadow-sm",
    light: "A half-pixel ring at 6% and two short drops, black at 10% and 5%",
    dark: "Ring and drops gone; a half-pixel inner highlight, white at 7%",
    job: "The default lift for a white control: every field (inputClass), the secondary Button, a label over a cover",
  },
  {
    cls: "shadow-md",
    same: "same as lg",
    light: "A half-pixel ring and a short drop at 6%, then two wide drops, black at 10% and 5%",
    dark: "The ring and short drop turn white at 7%; the black drops stay, faint on the dark page",
    job: "Interfere's other name for shadow-lg. Write lg",
  },
  {
    cls: "shadow-lg",
    light: "A half-pixel ring and a short drop at 6%, then two wide drops, black at 10% and 5%",
    dark: "The ring and short drop turn white at 7%; the black drops stay, faint on the dark page",
    job: "Floating over content: menus and popovers (bg-modal), the toast",
  },
  {
    cls: "shadow-xl",
    light: "A half-pixel ring at 6% and two deep drops, black at 5% (40px blur) and 15% (32px)",
    dark: "The ring gives way to a half-pixel inner highlight, white at 7%; the black drops stay",
    job: "The top layer: the auth card, dialogs",
  },
  {
    cls: "shadow-2xl",
    same: "same as xl",
    light: "A half-pixel ring at 6% and two deep drops, black at 5% (40px blur) and 15% (32px)",
    dark: "The ring gives way to a half-pixel inner highlight, white at 7%; the black drops stay",
    job: "Interfere's other name for shadow-xl. Write xl",
  },
  {
    cls: "shadow",
    same: "not a token",
    light: "Tailwind's own default: two drops, black at 10%",
    dark: "No dark treatment: the same black drops, barely visible",
    job: "Images in the template's cards (rounded shadow, SiteCard.tsx). Write shadow-sm for the default; on an image, the edge line",
  },
];

// A labelled layer of the elevation stack
function Layer({ className, step, token, edge }: { className: string; step: string; token: string; edge: string }) {
  return (
    <div className={cx("rounded-2xl p-3", className)}>
      <code className="block font-mono text-caption-lg text-primary-foreground">
        {step} · {token}
      </code>
      <code className="block font-mono text-caption-lg text-secondary-foreground">{edge}</code>
    </div>
  );
}

// The same screenshot with and without the edge line: its top edge is white, so without the line
// it melts into a light page
function EdgeSample({ edge }: { edge: boolean }) {
  return (
    <figure className="flex flex-col gap-1.5">
      <Image
        src="/images/sites/1.png"
        alt="A website screenshot whose top edge is white"
        width={1920}
        height={1200}
        sizes="112px"
        className={edge ? "h-auto w-28 rounded outline-1 -outline-offset-1 outline-edge" : "h-auto w-28 rounded"}
      />
      <figcaption className="font-mono text-caption-lg text-secondary-foreground">{edge ? "edge" : "none"}</figcaption>
    </figure>
  );
}

const ROWS_SAMPLE = ["Composition", "Typography", "Colour"];

export default function Shape() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Shape and depth">
        Interfere&rsquo;s radius scale, its layered shadows and the alpha borders. Corners nest by
        subtraction, and every shadow has its own dark treatment, so the classes never change
        between themes.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                A radius from the scale below, one of four shadows (<Mono>shadow-xs</Mono>, <Mono>shadow-sm</Mono>,{" "}
                <Mono>shadow-lg</Mono>, <Mono>shadow-xl</Mono>) and the border tokens. Nothing else: a value in square brackets, like{" "}
                <Mono>rounded-[28px]</Mono>, falls off the scale, and an arbitrary shadow has no dark treatment.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                A card or a mat is <Mono>rounded-2xl</Mono>. A white card&rsquo;s edge is <Mono>shadow-xs</Mono>; a
                grey mat (<Mono>bg-card</Mono>) has none, its tint is the edge. The one grey block with a line is a
                field inside a white card, like the light code block (CopyBlock.tsx): it takes{" "}
                <Mono>ring-1 ring-border-default</Mono>, as the snippet you copy. Button, Badge and{" "}
                <Mono>inputClass</Mono> carry their own radius and shadow: don&rsquo;t add one.
              </>
            ),
          },
          {
            term: "Nesting",
            text: (
              <>
                Inner radius = outer radius &minus; padding, so the gap stays even round the corner:{" "}
                <Mono>rounded-2xl p-2</Mono> holds <Mono>rounded-sm</Mono> (12 &minus; 8 = 4). When the padding
                reaches the radius the sum is zero or less and the inner corner is square (<Mono>rounded-none</Mono>):
                any curve there opens the corner wider than the sides. From 24px of padding (<Mono>p-6</Mono>) the two
                surfaces read apart and each keeps its own radius: the auth card&rsquo;s <Mono>rounded-2xl p-6</Mono>{" "}
                holds <Mono>rounded-lg</Mono> fields.
              </>
            ),
          },
          {
            term: "One name each",
            text: (
              <>
                <Mono>shadow-2xs</Mono> is <Mono>shadow-xs</Mono>, <Mono>shadow-md</Mono> is <Mono>shadow-lg</Mono>{" "}
                and <Mono>shadow-2xl</Mono> is <Mono>shadow-xl</Mono>, value for value. Write the four above, so a
                look has one name to search for.
              </>
            ),
          },
          {
            term: "Lines",
            text: (
              <>
                Alpha tints, black in light and white in dark (the border tokens a touch stronger there): <Mono>border-subtle</Mono> 2%,{" "}
                <Mono>border-default</Mono> 6%, <Mono>border-strong</Mono> 15%, <Mono>edge</Mono> 10%, as{" "}
                <Mono>ring-1</Mono> or <Mono>divide-y</Mono>. A tint mixes with whatever is under it, so one token
                reads on the page, a mat and a cover; a solid grey like <Mono>ring-base-200</Mono> is tuned to one
                ground.
              </>
            ),
          },
          {
            term: "Bare classes",
            text: (
              <>
                <Mono>rounded</Mono> is Tailwind&rsquo;s 4px, the same as <Mono>rounded-sm</Mono>.{" "}
                <Mono>shadow</Mono> is Tailwind&rsquo;s own two black drops, not <Mono>shadow-sm</Mono>: it
                doesn&rsquo;t change in dark mode. Write <Mono>shadow-sm</Mono> when you mean the default.
              </>
            ),
          },
          {
            term: "Images",
            text: (
              <>
                An image is <Mono>rounded outline-1 -outline-offset-1 outline-edge</Mono>, with no shadow (the share
                page&rsquo;s covers, s/[token]/page.tsx). An outline is drawn over the pixels, so the edge holds in both
                themes. A shadow doesn&rsquo;t: <Mono>shadow-sm</Mono>&rsquo;s only edge in dark mode is an inset
                highlight, which the image covers, and bare <Mono>shadow</Mono> has no dark treatment. The
                template&rsquo;s <Mono>rounded shadow</Mono> (SiteCard.tsx, the blog and store cards, and SKILL.md&rsquo;s
                card anatomy) is the older recipe: don&rsquo;t copy it.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                <Mono>border-2</Mono> (2px is the focus ring&rsquo;s width, on buttons and fields alike, so a 2px line
                reads as focus);{" "}
                <Mono>dark:ring-*</Mono> or <Mono>dark:shadow-*</Mono> standing in for a shadow (each token already
                has its dark treatment, and the patch doubles the edge); a card above <Mono>rounded-2xl</Mono> (16px
                and up is for large panels: the footer, the review page&rsquo;s post stage). The
                dashboard&rsquo;s <Mono>rounded-[28px]</Mono> post view and account menu predate the scale: don&rsquo;t
                copy them.
              </>
            ),
          },
          {
            term: "Older code",
            text: (
              <>
                Interfere&rsquo;s scale replaced Tailwind&rsquo;s on 2026-10-15 and is smaller from <Mono>xl</Mono>{" "}
                up (Tailwind&rsquo;s <Mono>xl</Mono> was 12, <Mono>2xl</Mono> 16, <Mono>3xl</Mono> 24,{" "}
                <Mono>4xl</Mono> 32). A nest written before then can be a step off: check it against the table below.
                The dashboard&rsquo;s menus are one (Header.tsx, BoardView.tsx): their rows are <Mono>rounded-xl</Mono>{" "}
                in a <Mono>rounded-2xl p-1.5</Mono> menu, a step too round. A row in that menu is{" "}
                <Mono>rounded-md</Mono> (12 &minus; 6 = 6).
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which radius?
 ├── Inside a rounded parent, under 24px of padding
 │   (a menu row, a card on a mat)
 │     → the parent's minus the padding, square at
 │       zero or less (table below)
 ├── A badge → its own (rounded-sm, rounded-md at lg)
 ├── A chip made by hand → rounded-sm
 ├── A button or a field → its own (md to 28px tall, lg from 32px)
 ├── An inset panel inside a card → rounded-xl
 ├── A card, a mat, the auth card → rounded-2xl
 ├── An image inside a mat → rounded, the edge line, no shadow
 ├── A full-width panel (the footer) → rounded-4xl, 5xl from sm
 └── An avatar or a pill → rounded-full`}
        />
        <Flow
          tree={`Which edge?
 ├── A grey mat (bg-card) → none: the tint is its edge
 ├── A white card (bg-container) → shadow-xs
 ├── A white control: a field, the secondary
 │   button, a label over a cover → shadow-sm
 ├── Floats over content: a menu, the toast → shadow-lg
 ├── The top layer: a dialog, the auth card → shadow-xl
 ├── A line between rows → divide-y divide-border-default
 ├── A grey field inside a white card (the light
 │   code block) → ring-1 ring-border-default
 └── An image → outline-1 -outline-offset-1 outline-edge,
       no shadow`}
        />
      </div>

      <SheetSection
        title="Radius"
        description="Nine steps, Tailwind's bare rounded and the pill. Each has one job; the right-hand column names a real use of it."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(7rem,max-content)"
              template="7rem minmax(18rem,1fr)"
              columns={["sample", "used on"]}
              rows={RADII.map((r) => ({
                label: r.cls,
                sub: r.px,
                cells: [
                  <span key="s" aria-hidden className={cx("block h-12 w-20 bg-component", r.cls)} />,
                  <span key="u" className="text-body-sm text-secondary-foreground">
                    {r.use}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Nested corners"
        description="A rounded surface inside a rounded surface takes the outer radius minus the padding between them, and goes square when that reaches zero. Copied, the gap swells at every corner. From 24px of padding each keeps its own. The mats here are bg-component, a step darker than bg-card, so the gap shows."
      >
        <Sheet>
          {() => (
            <div className="flex flex-col gap-10">
              <div className="grid gap-6 sm:grid-cols-2">
                <figure>
                  <div aria-hidden className="rounded-2xl bg-component p-2">
                    <div className="h-28 rounded-sm bg-container shadow-xs" />
                  </div>
                  <figcaption className="mt-3 text-body-sm text-secondary-foreground">
                    <span className="font-medium text-positive-foreground">Correct.</span> <Mono>rounded-2xl p-2</Mono>{" "}
                    holds <Mono>rounded-sm</Mono>: 12 &minus; 8 = 4, so the gap is 8px all the way round.
                  </figcaption>
                </figure>
                <figure>
                  <div aria-hidden className="rounded-2xl bg-component p-2">
                    <div className="h-28 rounded-2xl bg-container shadow-xs" />
                  </div>
                  <figcaption className="mt-3 text-body-sm text-secondary-foreground">
                    <span className="font-medium text-danger-foreground">Incorrect.</span> Both{" "}
                    <Mono>rounded-2xl</Mono>: the sides are 8px but each corner opens to about 11px (8 &times; &radic;2).
                  </figcaption>
                </figure>
              </div>
              <Matrix
                first="minmax(7rem,max-content)"
                columns={PADS}
                rows={NESTS.map((n) => ({
                  label: n.outer,
                  sub: n.px,
                  cells: [
                    ...n.cells.map((cell) => (
                      <div key={cell.box} className="flex items-center gap-3">
                        <span aria-hidden className={cx("flex h-12 w-16 shrink-0 bg-component", cell.box)}>
                          <span className={cx("flex-1 bg-container shadow-xs", cell.inner)} />
                        </span>
                        <Mono>{cell.inner}</Mono>
                      </div>
                    )),
                    <span key="apart" className="text-body-sm text-secondary-foreground">
                      Its own: the two read apart
                    </span>,
                  ],
                }))}
              />
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`{/* A white card on a grey mat: 12 − 8 = 4 */}
<div className="rounded-2xl bg-card p-2">
  <div className="rounded-sm bg-container p-4 shadow-xs">…</div>
</div>`}
            incorrect={{
              why: "the inner corner copies the outer one",
              code: `<div className="rounded-2xl bg-card p-2">
  <div className="rounded-2xl bg-container p-4 shadow-xs">…</div>
</div>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        title="Shadows"
        description="Each shadow on a white card (bg-container). The middle column says what this theme draws. In dark mode shadow-sm swaps its drops for a half-pixel inner highlight, xs and lg turn their rings white, and xl swaps its ring for the highlight; the black drops of lg and xl stay. All of it comes through the tokens, never a dark: class."
      >
        <Sheet>
          {(theme) => (
            <Matrix
              first="minmax(7rem,max-content)"
              template="8rem minmax(16rem,1fr) minmax(16rem,1fr)"
              columns={["sample", `in ${theme}`, "job"]}
              rows={SHADOWS.map((s) => ({
                label: s.cls,
                sub: s.same,
                cells: [
                  <span key="s" aria-hidden className={cx("my-2 block h-14 w-24 rounded-xl bg-container", s.cls)} />,
                  <span key="t" className="text-body-sm text-secondary-foreground">
                    {theme === "light" ? s.light : s.dark}
                  </span>,
                  <span key="j" className="text-body-sm text-secondary-foreground">
                    {s.job}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Elevation"
        description="Four levels, each drawn over the one before: the page, a grey mat, a white card, and a menu or dialog floating above them. Only the last two carry a shadow, the higher one the heavier."
      >
        <Sheet>
          {() => (
            <div className="max-w-xl">
              <code className="block font-mono text-caption-lg text-primary-foreground">1 · bg-page</code>
              <code className="block font-mono text-caption-lg text-secondary-foreground">the ground, no edge</code>
              <div className="mt-4 grid h-60 grid-cols-5 grid-rows-5">
                <Layer className="col-span-3 col-start-1 row-span-3 row-start-1 bg-card" step="2" token="bg-card" edge="flat, no edge" />
                <Layer
                  className="col-span-3 col-start-2 row-span-3 row-start-2 bg-container shadow-xs"
                  step="3"
                  token="bg-container"
                  edge="shadow-xs"
                />
                <Layer
                  className="col-span-3 col-start-3 row-span-3 row-start-3 bg-modal shadow-lg"
                  step="4"
                  token="bg-modal"
                  edge="shadow-lg, xl"
                />
              </div>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Borders"
        description="Lines that separate rather than lift. All of them are alpha tints, so each one sits back on any ground, in either theme."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(14rem,max-content)"
              template="minmax(15rem,max-content) minmax(16rem,1fr)"
              columns={["sample", "job"]}
              rows={[
                {
                  label: "ring-1 ring-border-default",
                  cells: [
                    <span key="s" className="block rounded-2xl bg-container p-6 shadow-xs">
                      <span className="block rounded-lg bg-card px-4 py-3 font-mono text-caption-lg text-primary-foreground ring-1 ring-border-default">
                        npm run dev
                      </span>
                    </span>,
                    <span key="j" className="text-body-sm text-secondary-foreground">
                      A grey field inside a white card: the light code block (CopyBlock.tsx). A grey mat on the page
                      takes no line
                    </span>,
                  ],
                },
                {
                  label: "divide-y divide-border-default",
                  cells: [
                    <ul key="s" className="w-48 divide-y divide-border-default text-body-sm text-primary-foreground">
                      {ROWS_SAMPLE.map((row) => (
                        <li key={row} className="py-2">
                          {row}
                        </li>
                      ))}
                    </ul>,
                    <span key="j" className="text-body-sm text-secondary-foreground">
                      Lines between rows: the homepage&rsquo;s Creative DNA list (CreativeDnaSection.tsx)
                    </span>,
                  ],
                },
                {
                  label: "divide-y divide-border-subtle",
                  cells: [
                    <ul key="s" className="w-48 divide-y divide-border-subtle text-body-sm text-primary-foreground">
                      {ROWS_SAMPLE.map((row) => (
                        <li key={row} className="py-2">
                          {row}
                        </li>
                      ))}
                    </ul>,
                    <span key="j" className="text-body-sm text-secondary-foreground">
                      The faintest line, between the rows of a dense table: these matrices (border-border-subtle)
                    </span>,
                  ],
                },
                {
                  label: "ring-1 ring-inset ring-border-strong",
                  cells: [
                    <span key="s" className="flex items-center gap-2">
                      <Badge variant="outline">Beta</Badge>
                      <Badge variant="outline" size="lg">
                        Beta
                      </Badge>
                    </span>,
                    <span key="j" className="text-body-sm text-secondary-foreground">
                      The strongest hairline, for a label with no fill: the outline Badge
                    </span>,
                  ],
                },
                {
                  label: "outline-1 -outline-offset-1 outline-edge",
                  cells: [
                    <span key="s" className="flex gap-3">
                      <EdgeSample edge />
                      <EdgeSample edge={false} />
                    </span>,
                    <span key="j" className="text-body-sm text-secondary-foreground">
                      The line inside every image, black at 10% (white in dark). An outline pulled 1px in costs no
                      space and isn&rsquo;t clipped by a rounded parent; without it a white edge melts into the page
                    </span>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`{/* A white card: the hairline shadow, white at 7% in dark */}
<div className="rounded-2xl bg-container p-6 shadow-xs">…</div>

{/* A dialog: the top layer; in dark its ring gives way to an inner highlight */}
<dialog className="rounded-2xl bg-modal p-6 shadow-xl">…</dialog>

{/* Rows: an alpha divider */}
<ul className="divide-y divide-border-default">…</ul>`}
            incorrect={{
              why: "a solid border-2, and dark: patching a shadow",
              code: `<div className="rounded-2xl border-2 border-base-200 bg-white p-6">…</div>

<dialog className="rounded-[28px] bg-white shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)] dark:ring-1 dark:ring-edge">…</dialog>

<ul className="divide-y divide-base-200">…</ul>`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
