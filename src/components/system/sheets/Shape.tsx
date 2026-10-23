// /system/shape: the shape pair, the surface and shadow ladder and the one stroke, live in both
// themes. Since 2026-10-23 these are Fluid Functionalism's (src/lib/shape-context.tsx, the
// --surface-* / --shadow-* variables in src/styles/global.css); Interfere's radius scale stays
// for older pages. Every class is written out in full (never built from parts), so Tailwind sees it
import Image from "next/image";
import Badge from "@/components/fundations/elements/Badge";
import { cx } from "@/lib/cx";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../SheetParts";

// The shape pair and what hangs off it (useShape() in src/lib/shape-context.tsx, pill), with one
// real use per value
const SHAPES: { cls: string; px: string; name: string; use: string }[] = [
  {
    cls: "rounded-[20px]",
    px: "20px",
    name: "item · button · input · bg",
    use: "Everything a person operates: Button, Input, Badge, the Tabs' pills, Menu rows, the Segmented pill, the Toast, EmptyState's tile, Skeleton lg",
  },
  {
    cls: "rounded-[24px]",
    px: "24px",
    name: "container",
    use: "What holds items: Card, Menu, Dialog, Textarea, Notice, Skeleton 2xl. Four more than an item, so a 20px item sits concentric 4px inside",
  },
  {
    cls: "rounded-[22px]",
    px: "22px",
    name: "focusRing",
    use: "The focus ring, drawn 2px outside the element (the global :focus-visible reads --shape-input-radius for the same reason)",
  },
  {
    cls: "rounded-[16px]",
    px: "16px",
    name: "mergedBg",
    use: "The fill that joins neighbouring checked rows in a Menu checkbox group: a 20px fill inset 4px",
  },
  {
    cls: "rounded-[4px]",
    px: "4px",
    name: "a corner, not a shape",
    use: "The Checkbox square (5px at 16px), Kbd's cap (5px), TextLink's and CardTitle's focus corner, Skeleton sm, Card media under lg padding",
  },
  {
    cls: "rounded-full",
    px: "pill",
    name: "round",
    use: "Avatar, the Switch's thumb, round icon buttons. On a 28px control rounded-[20px] already reads as a pill",
  },
];

// Interfere's scale (--radius-* in @theme): still in the stylesheet for pages not yet moved over
const OLDER_RADII: { cls: string; px: string; use: string }[] = [
  { cls: "rounded-sm", px: "4px", use: "Brand marks (BrandName.tsx), chips on older pages" },
  { cls: "rounded-md", px: "6px", use: "Older menu rows" },
  { cls: "rounded-lg", px: "8px", use: "The auth fields (inputClass in AuthParts.tsx), the error notice" },
  { cls: "rounded-xl", px: "10px", use: "The consent screen's summary (OAuthConsent.tsx)" },
  { cls: "rounded-2xl", px: "12px", use: "The auth card ((auth)/layout.tsx), the pricing plan, these panels" },
  { cls: "rounded-3xl", px: "16px", use: "The review page's post stage (ReviewPost.tsx)" },
  { cls: "rounded-4xl", px: "20px", use: "The footer panel on phones (Footer.tsx)" },
  { cls: "rounded-5xl", px: "24px", use: "The footer panel from sm up (Footer.tsx)" },
];

// Outer radius down, inset across: the inner radius nestedRadius() returns (outer − inset − border,
// never below zero). The last column is where the two surfaces read apart
type Nest = { box: string; inner: string };
const PADS = ["p-1 · 4px", "p-2 · 8px", "p-3 · 12px", "p-4 · 16px", "p-6 · 24px"];
const NESTS: { outer: string; px: string; cells: Nest[] }[] = [
  {
    outer: "rounded-[24px]",
    px: "24px · container",
    cells: [
      { box: "rounded-[24px] p-1", inner: "rounded-[20px]" },
      { box: "rounded-[24px] p-2", inner: "rounded-[16px]" },
      { box: "rounded-[24px] p-3", inner: "rounded-[12px]" },
      { box: "rounded-[24px] p-4", inner: "rounded-[8px]" },
    ],
  },
  {
    outer: "rounded-[20px]",
    px: "20px · item",
    cells: [
      { box: "rounded-[20px] p-1", inner: "rounded-[16px]" },
      { box: "rounded-[20px] p-2", inner: "rounded-[12px]" },
      { box: "rounded-[20px] p-3", inner: "rounded-[8px]" },
      { box: "rounded-[20px] p-4", inner: "rounded-[4px]" },
    ],
  },
];

// The ladder (--surface-N and --shadow-N in :root and :root[data-theme="dark"]), described as each
// theme draws it. Light: every surface is white and the shadow is a 1px ring at 6% black plus one
// more drop per step (1, 3, 6, 12, 24, 48, 96px, each at 6%). Dark: the surface climbs from the
// page in 7-unit steps and the shadow is an inset highlight, an inset ring and black drops
const LADDER: { step: number; cls: string; light: string; dark: string; sits: string }[] = [
  {
    step: 1,
    cls: "bg-surface-1 shadow-surface-1",
    light: "White; a 1px ring, black at 6%",
    dark: "The page (oklch 15%); an inset 1px ring, white at 2%",
    sits: "The page. Card media (bg-muted shadow-surface-1). Tailwind's shadow-xs",
  },
  {
    step: 2,
    cls: "bg-surface-2 shadow-surface-2",
    light: "White; the ring and a 1px drop",
    dark: "#222222; a 1px inset highlight at 1%, the inset ring at 2%, a 1px drop, black at 18%",
    sits: "The raised Card's shadow (bg-surface-3 shadow-surface-2). shadow-sm and the bare shadow",
  },
  {
    step: 3,
    cls: "bg-surface-3 shadow-surface-3",
    light: "White; the ring, 1px and 3px drops",
    dark: "#292929; highlight 2%, inset ring 2%, an outer 1px ring at 12%, drops to 3px",
    sits: "The raised Card's fill, a focused Input (focus:bg-surface-3), a Menu on the page (substrate 1 + 2, shadow 3). shadow-md",
  },
  {
    step: 4,
    cls: "bg-surface-4 shadow-surface-4",
    light: "White; drops to 6px",
    dark: "#303030; highlight 2%, inset ring 4%, outer ring 14%, drops to 6px",
    sits: "The Toast (shadow-surface-4 on the ink). shadow-lg",
  },
  {
    step: 5,
    cls: "bg-surface-5 shadow-surface-5",
    light: "White; drops to 12px",
    dark: "#373737; highlight 4%, inset ring 4%, outer ring 16%, drops to 12px",
    sits: "A Dialog on the page (substrate 1 + 4)",
  },
  {
    step: 6,
    cls: "bg-surface-6 shadow-surface-6",
    light: "White; drops to 24px",
    dark: "#3e3e3e; highlight 4%, inset ring 6%, outer ring 18%, drops to 24px",
    sits: "shadow-xl",
  },
  {
    step: 7,
    cls: "bg-surface-7 shadow-surface-7",
    light: "White; drops to 48px",
    dark: "#454545; highlight 6%, inset ring 6%, outer ring 20%, drops to 48px",
    sits: "A Menu opened inside a Dialog (5 + 2)",
  },
  {
    step: 8,
    cls: "bg-surface-8 shadow-surface-8",
    light: "White; drops to 96px",
    dark: "#4c4c4c; highlight 6%, inset ring 6%, outer ring 22%, drops to 96px",
    sits: "The top of the ladder (Elevated clamps here). shadow-2xl",
  },
];

// Tailwind's shadow names, which since 2026-10-23 are steps of the ladder
const TAILWIND_SHADOWS: { cls: string; step: string; was: string }[] = [
  { cls: "shadow-xs", step: "shadow-surface-1", was: "Interfere's hairline ring; shadow-2xs is the same" },
  { cls: "shadow-sm", step: "shadow-surface-2", was: "Interfere's default, and the bare shadow (which used to be Tailwind's own, with no dark treatment)" },
  { cls: "shadow-md", step: "shadow-surface-3", was: "Interfere's large (it used to equal lg)" },
  { cls: "shadow-lg", step: "shadow-surface-4", was: "Interfere's large" },
  { cls: "shadow-xl", step: "shadow-surface-6", was: "Interfere's extra large" },
  { cls: "shadow-2xl", step: "shadow-surface-8", was: "Interfere's extra large (it used to equal xl)" },
];

// A labelled layer of the elevation stack
function Layer({ className, step, token, edge }: { className: string; step: string; token: string; edge: string }) {
  return (
    <div className={cx("rounded-[24px] p-3", className)}>
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
        className={edge ? "h-auto w-28 rounded-[4px] outline-1 -outline-offset-1 outline-border" : "h-auto w-28 rounded-[4px]"}
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
        Fluid Functionalism&rsquo;s shape pair (20px items in 24px containers), its eight-step surface
        ladder and the one stroke. Corners nest by subtraction, every step of the ladder has its own
        dark drawing, and the classes never change between themes.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                The pair: <Mono>rounded-[20px]</Mono> on anything a person operates, <Mono>rounded-[24px]</Mono> on
                what holds it, from <Mono>useShape()</Mono> (<Mono>src/lib/shape-context.tsx</Mono>, the owner&rsquo;s
                pill setting) in a client component. A step of the ladder for depth: <Mono>bg-surface-3 shadow-surface-2</Mono>{" "}
                for a raised card, <Mono>Elevated</Mono> (<Mono>src/lib/elevated.tsx</Mono>) for anything that opens over
                its substrate. The one stroke, <Mono>ring-1 ring-border</Mono>, for a line. Nothing else: an arbitrary
                shadow has no dark treatment, and a radius off the pair breaks the nesting.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                Button, Input, Badge, Menu, Dialog, Card and the rest carry their own corners and depth: don&rsquo;t
                add a radius or a shadow to them. A grey mat (<Mono>bg-card</Mono>) has no edge, its tint is the edge;
                a raised card is <Mono>Card raised</Mono>. A grey field inside a card (the light code block,
                CopyBlock.tsx) takes <Mono>ring-1 ring-border</Mono>.
              </>
            ),
          },
          {
            term: "Nesting",
            text: (
              <>
                Inner radius = outer radius &minus; inset (&minus; the parent&rsquo;s border), never below zero:{" "}
                <Mono>nestedRadius(outer, inset, borderWidth)</Mono> in <Mono>shape-context.tsx</Mono> does the sum. The
                pair is built on it: a 20px item sits 4px inside a 24px container (<Mono>p-1</Mono>), and the merged
                fill in a Menu is 16px inside a 20px row. Animated corners (the merge and split of checked rows) use the
                numbers, <Mono>bgRadius</Mono> 20, <Mono>containerRadius</Mono> 24, <Mono>mergedRadius</Mono> 16.
              </>
            ),
          },
          {
            term: "One depth",
            text: (
              <>
                Since 2026-10-23 Tailwind&rsquo;s shadow names are steps of the ladder: <Mono>shadow-xs</Mono> is step 1,{" "}
                <Mono>shadow-sm</Mono> and the bare <Mono>shadow</Mono> step 2, <Mono>shadow-md</Mono> 3, <Mono>shadow-lg</Mono>{" "}
                4, <Mono>shadow-xl</Mono> 6, <Mono>shadow-2xl</Mono> 8. So a card, a menu and a dialog differ by depth alone,
                and in dark mode every one is the same inset highlight and ring with drops.
              </>
            ),
          },
          {
            term: "Lines",
            text: (
              <>
                One stroke: <Mono>--border</Mono>, the ink at 12%, as <Mono>ring-1 ring-border</Mono>,{" "}
                <Mono>border-border</Mono>, <Mono>divide-y divide-border</Mono> or <Mono>outline-border</Mono>. The older
                names (<Mono>border-default</Mono>, <Mono>border-subtle</Mono>, <Mono>border-strong</Mono>,{" "}
                <Mono>edge</Mono>) now draw the same line. Separator&rsquo;s subtle variant is <Mono>bg-border/60</Mono>.
                A tint mixes with whatever is under it, so one token reads on the page, a mat and a cover.
              </>
            ),
          },
          {
            term: "Focus",
            text: (
              <>
                A 1px ring in the brand colour, 2px outside the element, on the shape&rsquo;s focus radius (22px):{" "}
                <Mono>focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]</Mono>, or
                the library&rsquo;s <Mono>focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]</Mono>. The global{" "}
                <Mono>:focus-visible</Mono> rule draws the same ring on anything that forgets.
              </>
            ),
          },
          {
            term: "Images",
            text: (
              <>
                An image is <Mono>rounded-[4px] outline-1 -outline-offset-1 outline-border</Mono>, with no shadow (Card media,
                the share page&rsquo;s covers). An outline is drawn over the pixels, so the edge holds in both themes; a
                shadow&rsquo;s only edge in dark mode is an inset highlight, which the image covers. Card media&rsquo;s radius
                follows its padding: 16px under sm, 8px under md, 4px under lg (<Mono>--card-media-radius</Mono>).
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                <Mono>border-2</Mono> (a 2px line reads as focus); <Mono>dark:ring-*</Mono> or <Mono>dark:shadow-*</Mono>{" "}
                standing in for a shadow (each step already has its dark drawing, and the patch doubles the edge); a
                hard-coded <Mono>bg-surface-5</Mono> on a popup (it ends up one step above a dialog instead of two above
                its substrate: let <Mono>Elevated</Mono> count); <Mono>rounded-full</Mono> on a control (a 28px control on{" "}
                <Mono>rounded-[20px]</Mono> is already a pill, and the focus ring and the nesting need the number).
              </>
            ),
          },
          {
            term: "Older code",
            text: (
              <>
                Interfere&rsquo;s radius scale (<Mono>rounded-xs</Mono> 2px to <Mono>rounded-5xl</Mono> 24px, below) is
                still in the stylesheet for the auth card, the footer and the template&rsquo;s pages, and its nests were
                worked out the same way (12 &minus; 8 = 4). The dashboard&rsquo;s <Mono>rounded-[28px]</Mono> post view and
                account menu predate both: don&rsquo;t copy them.
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which radius?
 ├── A control, a row, a badge, a pill → rounded-[20px]
 │   (Button, Input, Badge, Tabs, Menu rows carry it)
 ├── What holds them: a card, a menu, a dialog,
 │   a textarea, a notice → rounded-[24px]
 ├── Inside a rounded parent → the parent's minus the
 │   inset, square at zero (nestedRadius; table below)
 ├── A small square: a checkbox, a key cap, a focus
 │   corner on inline text → rounded-[4px] or 5px
 ├── An image → rounded-[4px] (Card media: by its padding)
 ├── An avatar, a switch thumb → rounded-full
 └── An older page (auth card, footer) → Interfere's scale`}
        />
        <Flow
          tree={`Which depth?
 ├── A grey mat (bg-card) → none: the tint is its edge
 ├── A raised card → bg-surface-3 shadow-surface-2 (Card raised)
 ├── A line between rows → divide-y divide-border
 ├── A grey field inside a card → ring-1 ring-border
 ├── Opens over its substrate: a menu → Elevated +2,
 │   shadow 3 (Menu does it)
 ├── Takes the screen: a dialog → Elevated +4 (Dialog does it)
 ├── The toast → the ink with shadow-surface-4 (Toast does it)
 └── An image → outline-1 -outline-offset-1 outline-border,
       no shadow`}
        />
      </div>

      <SheetSection
        title="The shape pair"
        description="Two radii from useShape() (pill) and what the library hangs off them. Items are 20px, containers 24px, the focus ring 22px (2px outside an item), the merged fill 16px (4px inside an item). Small squares keep a 4px or 5px corner."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(8rem,max-content)"
              template="7rem minmax(10rem,max-content) minmax(18rem,1fr)"
              columns={["sample", "useShape()", "used on"]}
              rows={SHAPES.map((r) => ({
                label: r.cls,
                sub: r.px,
                cells: [
                  <span key="s" aria-hidden className={cx("block h-12 w-20 bg-component", r.cls)} />,
                  <Mono key="n">{r.name}</Mono>,
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
        description="A rounded surface inside a rounded surface takes the outer radius minus the inset, and goes square when that reaches zero (nestedRadius clamps it). Copied, the gap swells at every corner. The mats here are bg-component, a step darker than bg-card, so the gap shows."
      >
        <Sheet>
          {() => (
            <div className="flex flex-col gap-10">
              <div className="grid gap-6 sm:grid-cols-2">
                <figure>
                  <div aria-hidden className="rounded-[24px] bg-component p-1">
                    <div className="h-28 rounded-[20px] bg-surface-3 shadow-surface-2" />
                  </div>
                  <figcaption className="mt-3 text-body-sm text-secondary-foreground">
                    <span className="font-medium text-positive-foreground">Correct.</span> <Mono>rounded-[24px] p-1</Mono>{" "}
                    holds <Mono>rounded-[20px]</Mono>: 24 &minus; 4 = 20, so the gap is 4px all the way round. This is
                    the pair itself: a row in a Menu, a card in a card.
                  </figcaption>
                </figure>
                <figure>
                  <div aria-hidden className="rounded-[24px] bg-component p-1">
                    <div className="h-28 rounded-[24px] bg-surface-3 shadow-surface-2" />
                  </div>
                  <figcaption className="mt-3 text-body-sm text-secondary-foreground">
                    <span className="font-medium text-danger-foreground">Incorrect.</span> Both{" "}
                    <Mono>rounded-[24px]</Mono>: the sides are 4px but each corner opens to about 5.7px (4 &times; &radic;2).
                  </figcaption>
                </figure>
              </div>
              <Matrix
                first="minmax(8rem,max-content)"
                columns={PADS}
                rows={NESTS.map((n) => ({
                  label: n.outer,
                  sub: n.px,
                  cells: [
                    ...n.cells.map((cell) => (
                      <div key={cell.box} className="flex items-center gap-3">
                        <span aria-hidden className={cx("flex h-12 w-16 shrink-0 bg-component", cell.box)}>
                          <span className={cx("flex-1 bg-surface-3 shadow-surface-2", cell.inner)} />
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
            correct={`{/* A raised card on a grey mat, 4px in: 24 − 4 = 20 */}
<div className="rounded-[24px] bg-card p-1">
  <div className="rounded-[20px] bg-surface-3 p-4 shadow-surface-2">…</div>
</div>

// In a client component, from the shape context
const shape = useShape();
<div className={cn("p-1", shape.container)}>
  <div className={cn("p-4", shape.item)}>…</div>
</div>`}
            incorrect={{
              why: "the inner corner copies the outer one",
              code: `<div className="rounded-[24px] bg-card p-1">
  <div className="rounded-[24px] bg-surface-3 p-4 shadow-surface-2">…</div>
</div>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        title="The surface ladder"
        description="Eight steps, each a fill (bg-surface-N) and a shadow (shadow-surface-N) that usually travel together: surfaceClasses(level) in src/lib/surface-classes.ts writes both. In light every surface is white and the stacked drops carry the depth; in dark the surface climbs from the page in even steps and the shadow is an inset highlight, an inset ring and drops. The middle column says what this theme draws."
      >
        <Sheet>
          {(theme) => (
            <Matrix
              first="minmax(9rem,max-content)"
              template="8rem minmax(16rem,1fr) minmax(16rem,1fr)"
              columns={["sample", `in ${theme}`, "what sits here"]}
              rows={LADDER.map((s) => ({
                label: `surface-${s.step}`,
                sub: s.cls,
                cells: [
                  <span key="s" aria-hidden className={cx("my-2 block h-14 w-24 rounded-[20px]", s.cls)} />,
                  <span key="t" className="text-body-sm text-secondary-foreground">
                    {theme === "light" ? s.light : s.dark}
                  </span>,
                  <span key="j" className="text-body-sm text-secondary-foreground">
                    {s.sits}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Tailwind's names"
        description="The shadow names older pages wrote map onto the ladder, value for value, so shadow-lg on the auth card and shadow-surface-4 on the Toast are one drawing. Write the step when you mean a step; the names stay for pages not yet moved over."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(7rem,max-content)"
              template="8rem minmax(10rem,max-content) minmax(16rem,1fr)"
              columns={["sample", "is", "was"]}
              rows={TAILWIND_SHADOWS.map((s) => ({
                label: s.cls,
                cells: [
                  <span key="s" aria-hidden className={cx("my-2 block h-14 w-24 rounded-[20px] bg-surface-3", s.cls)} />,
                  <Mono key="i">{s.step}</Mono>,
                  <span key="w" className="text-body-sm text-secondary-foreground">
                    {s.was}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Elevation"
        description="How the ladder stacks on a page: the page, a grey mat, a raised card, then what opens over them. A menu sits two steps above whatever it opened from and keeps shadow 3 wherever that is; a dialog sits four above. SurfaceProvider tells what's inside which step it's on, so a menu inside a dialog lands on 7 by itself."
      >
        <Sheet>
          {() => (
            <div className="max-w-xl">
              <code className="block font-mono text-caption-lg text-primary-foreground">1 · bg-surface-1</code>
              <code className="block font-mono text-caption-lg text-secondary-foreground">the page, no edge</code>
              <div className="mt-4 grid h-64 grid-cols-6 grid-rows-6">
                <Layer className="col-span-3 col-start-1 row-span-3 row-start-1 bg-card" step="mat" token="bg-card" edge="flat, no edge" />
                <Layer
                  className="col-span-3 col-start-2 row-span-3 row-start-2 bg-surface-3 shadow-surface-2"
                  step="card"
                  token="bg-surface-3"
                  edge="shadow-surface-2"
                />
                <Layer
                  className="col-span-3 col-start-3 row-span-3 row-start-3 bg-surface-3 shadow-surface-3"
                  step="menu"
                  token="bg-surface-3"
                  edge="shadow-surface-3 (1 + 2)"
                />
                <Layer
                  className="col-span-3 col-start-4 row-span-3 row-start-4 bg-surface-5 shadow-surface-5"
                  step="dialog"
                  token="bg-surface-5"
                  edge="shadow-surface-5 (1 + 4)"
                />
              </div>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="The one stroke"
        description="One line, the ink at 12%, wherever a line is needed. It separates rather than lifts, and because it's a tint it sits back on any ground, in either theme."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(14rem,max-content)"
              template="minmax(15rem,max-content) minmax(16rem,1fr)"
              columns={["sample", "job"]}
              rows={[
                {
                  label: "ring-1 ring-border",
                  cells: [
                    <span key="s" className="block rounded-[24px] bg-surface-3 p-6 shadow-surface-2">
                      <span className="block rounded-[20px] bg-card px-4 py-3 font-mono text-caption-lg text-primary-foreground ring-1 ring-border">
                        npm run dev
                      </span>
                    </span>,
                    <span key="j" className="text-body-sm text-secondary-foreground">
                      A grey field inside a card (the light code block, CopyBlock.tsx), and the Input&rsquo;s own ring. A
                      grey mat on the page takes no line
                    </span>,
                  ],
                },
                {
                  label: "divide-y divide-border",
                  cells: [
                    <ul key="s" className="w-48 divide-y divide-border text-body-sm text-primary-foreground">
                      {ROWS_SAMPLE.map((row) => (
                        <li key={row} className="py-2">
                          {row}
                        </li>
                      ))}
                    </ul>,
                    <span key="j" className="text-body-sm text-secondary-foreground">
                      Lines between rows: the homepage&rsquo;s Creative DNA list (CreativeDnaSection.tsx), these
                      matrices. Separator draws the same line as an element
                    </span>,
                  ],
                },
                {
                  label: "ring-1 ring-inset ring-border",
                  cells: [
                    <span key="s" className="flex items-center gap-2">
                      <Badge variant="outline">Beta</Badge>
                      <Badge variant="outline" size="lg">
                        Beta
                      </Badge>
                    </span>,
                    <span key="j" className="text-body-sm text-secondary-foreground">
                      A label with no fill: the outline Badge
                    </span>,
                  ],
                },
                {
                  label: "outline-1 -outline-offset-1 outline-border",
                  cells: [
                    <span key="s" className="flex gap-3">
                      <EdgeSample edge />
                      <EdgeSample edge={false} />
                    </span>,
                    <span key="j" className="text-body-sm text-secondary-foreground">
                      The line inside every image (Card media draws it with an ::after). An outline pulled 1px in costs
                      no space and isn&rsquo;t clipped by a rounded parent; without it a white edge melts into the page
                    </span>,
                  ],
                },
                {
                  label: "focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]",
                  cells: [
                    <span key="s" className="block rounded-[20px] bg-component px-4 py-2 font-mono text-caption-lg text-primary-foreground outline-1 outline-offset-2 outline-[color:var(--focus-ring)]">
                      focused
                    </span>,
                    <span key="j" className="text-body-sm text-secondary-foreground">
                      The focus ring, shown held: 1px of brand, 2px out, so it never touches the stroke. Tab to any
                      control on this page to see the real one
                    </span>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`{/* A raised card: step 3 with step 2's shadow */}
<div className="rounded-[24px] bg-surface-3 p-6 shadow-surface-2">…</div>

{/* Anything that opens over its substrate: let Elevated count the step */}
<Elevated offset={2} shadowLevel={3} className="rounded-[24px] p-1">…</Elevated>

{/* Rows: the one stroke */}
<ul className="divide-y divide-border">…</ul>`}
            incorrect={{
              why: "a solid border-2, a hard-coded step on a popup, and dark: patching a shadow",
              code: `<div className="rounded-2xl border-2 border-base-200 bg-white p-6">…</div>

<div className="rounded-[28px] bg-surface-5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)] dark:ring-1 dark:ring-edge">…</div>

<ul className="divide-y divide-base-200">…</ul>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        title="The older scale"
        description="Interfere's radius scale, still in @theme for pages not yet moved to the pair. Each row names where it's still used; don't reach for it in a new component."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(7rem,max-content)"
              template="7rem minmax(18rem,1fr)"
              columns={["sample", "still used on"]}
              rows={OLDER_RADII.map((r) => ({
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
    </div>
  );
}
