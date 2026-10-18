// /system/skeleton: Skeleton (src/components/fundations/elements/Skeleton.tsx), its three shapes
// live in both themes, a swap that measures itself to show nothing moves, and how a loading
// region announces itself. Every class is written out in full, so Tailwind sees it
import type { ComponentProps } from "react";
import Skeleton from "@/components/fundations/elements/Skeleton";
import { SkeletonSwap } from "../../demos/DisplayDemos";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";

type LineWidth = NonNullable<Extract<ComponentProps<typeof Skeleton>, { shape: "line" }>["width"]>;

// A line in each type class it stands in for: the line box is the text's own height
const LINES: { type: string; px: string; widths: LineWidth[] }[] = [
  { type: "text-caption-lg", px: "12 / 16", widths: ["1/2"] },
  { type: "text-body-sm", px: "13 / 20", widths: ["full", "full", "1/3"] },
  { type: "text-body-base", px: "15 / 24", widths: ["full", "2/3"] },
  { type: "text-h6", px: "20 / 24", widths: ["3/4"] },
];

const RECTS: { radius: "none" | "sm" | "lg" | "2xl" | "full"; px: string; size: string; standsFor: string }[] = [
  { radius: "sm", px: "4px, the default", size: "aspect-4/5 w-20", standsFor: "A post cover or an image (rounded)" },
  { radius: "lg", px: "8px", size: "h-10 w-32", standsFor: "A button or a field at 40px" },
  { radius: "2xl", px: "12px", size: "h-20 w-40", standsFor: "A card or a mat" },
  { radius: "full", px: "pill", size: "h-11 w-28", standsFor: "A dashboard pill: Create, Saved" },
  { radius: "none", px: "0", size: "h-12 w-24", standsFor: "A square-cornered image in a p-4 card" },
];

const CIRCLES = ["xs", "sm", "md", "lg"] as const;
const CIRCLE_PX = { xs: "20", sm: "24", md: "32", lg: "44" };

export default function SkeletonSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Skeleton">
        The shape of content on its way: grey blocks with a band of light crossing them, in the size and place the
        real thing will take. Lines, circles and rectangles, hidden from screen readers; the region around them says
        it&rsquo;s loading, once.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                A region whose layout you know before its data arrives: the feed&rsquo;s first render, a board&rsquo;s
                covers, a list of tokens, the person in the header while the session is read (the dashboard&rsquo;s{" "}
                <Mono>GridSkeleton</Mono> and <Mono>HeaderSkeleton</Mono>).
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                A wait inside a control, or one with nothing to hold, is a <Mono>Spinner</Mono> (a button&rsquo;s own is{" "}
                <Mono>{"<Button loading>"}</Mono>). An answer of &ldquo;nothing&rdquo; is <Mono>EmptyState</Mono>, not a
                skeleton that never resolves. Content already on the page stays on the page while it refreshes.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                <Mono>{'<Skeleton className="aspect-4/5 w-full" />'}</Mono>: a rect with an image&rsquo;s 4px corner,
                sized by its className.
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                <Mono>shape</Mono>: <Mono>rect</Mono> (the default; <Mono>radius</Mono> <Mono>sm</Mono>,{" "}
                <Mono>lg</Mono>, <Mono>2xl</Mono>, <Mono>full</Mono>, <Mono>none</Mono>), <Mono>line</Mono> (
                <Mono>width</Mono> <Mono>full</Mono>, <Mono>3/4</Mono>, <Mono>2/3</Mono>, <Mono>1/2</Mono>,{" "}
                <Mono>1/3</Mono>, <Mono>1/4</Mono>), <Mono>circle</Mono> (<Mono>size</Mono> as Avatar&rsquo;s:{" "}
                <Mono>xs</Mono> to <Mono>lg</Mono>, <Mono>md</Mono> by default). Each option belongs to its shape: the
                types refuse a <Mono>width</Mono> on a circle.
              </>
            ),
          },
          {
            term: "Same size",
            text: (
              <>
                The skeleton is the content&rsquo;s exact box, or the page jumps when the content lands (layout shift,
                and a lost place for anyone reading). A line sits in the same type class as its text (its box is{" "}
                <Mono>1lh</Mono>, the bar <Mono>0.75em</Mono>), a circle at the Avatar&rsquo;s size, a rect at the
                image&rsquo;s aspect ratio. As many lines as the text usually has, never more.
              </>
            ),
          },
          {
            term: "Announce",
            text: (
              <>
                Every block is <Mono>aria-hidden</Mono>. The region around them is a{" "}
                <Mono>role=&quot;status&quot;</Mono> with an <Mono>aria-label</Mono> saying what&rsquo;s coming
                (&ldquo;Loading posts&rdquo;), once for the region, never per block; swap the whole region for the
                content when it lands.
              </>
            ),
          },
          {
            term: "Motion",
            text: (
              <>
                <Mono>animate-shimmer</Mono>: a band of <Mono>--color-shimmer</Mono> crossing <Mono>bg-component</Mono>{" "}
                every 1.6s, ease-in-out, every block in step. It holds still under reduced motion: a plain grey block is
                still clearly a placeholder.
              </>
            ),
          },
          {
            term: "className",
            text: (
              <>
                Layout and size only: margins, <Mono>w-*</Mono>, <Mono>h-*</Mono>, <Mono>aspect-*</Mono> on a rect;{" "}
                <Mono>style</Mono> for a size worked out at run time (a post&rsquo;s own aspect ratio). Never a colour or
                a radius: <Mono>cx</Mono> doesn&rsquo;t merge, so both land.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                <Mono>animate-pulse</Mono> on a grey div (no dark treatment, no reduced motion, a second recipe). A
                skeleton left up after the request failed: show the error. A skeleton for something that takes under
                300ms: it flashes.
              </>
            ),
          },
        ]}
      />

      <Flow
        tree={`Which shape?
 ├── A line of text → shape="line", inside an element
 │     with the text's own type class; width="1/3" to
 │     "3/4" for a last line
 ├── A person → shape="circle", the Avatar's size
 └── Anything else → a rect, sized with className,
       with the corner of what it stands in for
        ├── an image or a cover → radius="sm" (the default)
        ├── a button or a field → radius="lg"
        ├── a card or a mat → radius="2xl"
        └── a pill → radius="full"`}
      />

      <SheetSection
        title="Lines"
        description="Each line in the type class of the text it stands in for. The line box is the text's height, so stacked lines keep the text's rhythm; the bar is three quarters of the font size."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(9rem,max-content)"
              template="minmax(16rem,1fr) minmax(9rem,max-content)"
              columns={["specimen", "widths"]}
              rows={LINES.map((line) => ({
                label: line.type,
                sub: line.px,
                cells: [
                  <div key="s" className={`w-full max-w-72 ${line.type}`}>
                    {line.widths.map((width, i) => (
                      <Skeleton key={i} shape="line" width={width} />
                    ))}
                  </div>,
                  <Mono key="w">{line.widths.join(", ")}</Mono>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Circles and rects"
        description="Circles at the Avatar's four sizes; rects with the corner of what they stand in for, sized by className."
      >
        <Sheet>
          {() => (
            <div className="flex flex-col gap-8">
              <Matrix
                first="minmax(9rem,max-content)"
                columns={CIRCLES.map((s) => `${s} · ${CIRCLE_PX[s]}`)}
                rows={[
                  {
                    label: 'shape="circle"',
                    sub: "Avatar's sizes",
                    cells: CIRCLES.map((size) => <Skeleton key={size} shape="circle" size={size} />),
                  },
                ]}
              />
              <Matrix
                first="minmax(9rem,max-content)"
                template="minmax(11rem,max-content) minmax(9rem,max-content) minmax(14rem,1fr)"
                columns={["specimen", "className", "stands in for"]}
                rows={RECTS.map((rect) => ({
                  label: `radius="${rect.radius}"`,
                  sub: rect.px,
                  cells: [
                    <Skeleton key="s" radius={rect.radius} className={rect.size} />,
                    <Mono key="c">{rect.size}</Mono>,
                    <span key="u" className="text-body-sm text-secondary-foreground">
                      {rect.standsFor}
                    </span>,
                  ],
                }))}
              />
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Nothing moves"
        description="A post card and a person row, as skeletons and as content. Swap them: the block's height, measured live, stays the same, because each skeleton copies its content's box."
      >
        <Sheet>{() => <SkeletonSwap />}</Sheet>
        <div className="mt-6">
          <Code
            correct={`<div role="status" aria-label="Loading boards" className="grid gap-6 sm:grid-cols-2">
  {Array.from({ length: 4 }, (_, i) => (
    <Card key={i}>
      <Skeleton className="aspect-8/5 w-full" />
      <div className="mt-4 text-body-sm">
        <Skeleton shape="line" width="2/3" />
      </div>
    </Card>
  ))}
</div>`}
            incorrect={{
              why: "Tailwind's grey and pulse, a guessed height, a label on every block",
              code: `<div className="grid gap-6 sm:grid-cols-2">
  {Array.from({ length: 4 }, (_, i) => (
    <div key={i} role="status" aria-label="Loading" className="rounded-2xl bg-base-50 p-6">
      <div className="h-40 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
    </div>
  ))}
</div>`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
