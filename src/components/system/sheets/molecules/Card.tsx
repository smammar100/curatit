// /system/card: Card and its parts (src/components/fundations/molecules/Card.tsx, Fluid
// Functionalism's ui/card.tsx underneath), both surfaces at every padding with the media corner
// each implies, linked cards live, and the compositions the site uses. Every class is written out
// in full, so Tailwind sees it
import Image from "next/image";
import Badge from "@/components/fundations/elements/Badge";
import Button from "@/components/fundations/elements/Button";
import Card, { CardDescription, CardMedia, CardMeta, CardTitle } from "@/components/fundations/molecules/Card";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";

// The card is the 24px container; the media corner is concentric with it: 24 minus the padding,
// down to the 4px an image keeps inside the default padding
const PADDINGS: { padding: "sm" | "md" | "lg"; head: string; corner: string }[] = [
  { padding: "sm", head: "sm · p-2 · 8px", corner: "media 16px: 24 − 8" },
  { padding: "md", head: "md · p-4 · 16px", corner: "media 8px: 24 − 16" },
  { padding: "lg", head: "lg · p-6 · 24px", corner: "media its own 4px: the two read apart" },
];

// Template screenshots (1920 × 1200, so 8/5 exactly); the first has a white top edge, which
// shows what the edge line is for
const SHOTS = [
  { src: "/images/sites/1.png", alt: "Groth's home page: a white header over a giant black wordmark" },
  { src: "/images/sites/2.png", alt: "A red landing page with a black panel" },
  { src: "/images/sites/3.png", alt: "Norgram's grid of work: glasses, a black panel, a portrait" },
];

function Shot({ i, sizes }: { i: number; sizes: string }) {
  const shot = SHOTS[i % SHOTS.length]!;
  return <Image src={shot.src} alt={shot.alt} width={1920} height={1200} sizes={sizes} />;
}

// One cell of the matrix: what each padding is for
function Specimen({ variant, padding }: { variant: "mat" | "raised"; padding: "sm" | "md" | "lg" }) {
  if (padding === "sm") {
    return (
      <Card variant={variant} padding="sm" className="w-56">
        <CardMedia>
          <Shot i={0} sizes="208px" />
        </CardMedia>
      </Card>
    );
  }
  const agency = padding === "md";
  return (
    <Card variant={variant} padding={padding} className="w-56">
      <CardMedia>
        <Shot i={agency ? 1 : 0} sizes="192px" />
      </CardMedia>
      <CardMeta className="mt-3">{agency ? "Agency · Landing page" : "Studio · Website"}</CardMeta>
      <CardTitle className="mt-1">{agency ? "A creative tech company" : "Groth's home page"}</CardTitle>
    </Card>
  );
}

export default function CardSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Card">
        A grouped surface: the grey mat under images, or a white card raised one step off the page by its shadow. The
        24px container corner, three paddings, and parts for the picture, the title, a caption and a sentence. Give the
        title an <Mono>href</Mono> and the whole card opens it.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                One thing and what&rsquo;s said about it, held together by an edge: a post or a site in a grid, a plan, a
                client to connect, a board. Several of them side by side in a grid (
                <Mono>grid gap-8 md:grid-cols-2 lg:grid-cols-3</Mono>).
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                A group that space can hold is a plain <Mono>div</Mono> with a gap. A message is a <Mono>Notice</Mono>;
                a floating list or task is <Mono>Menu</Mono> or <Mono>Dialog</Mono> (they float, higher up the surface
                ladder); nothing-here-yet is <Mono>EmptyState</Mono>. A page section is a <Mono>Wrapper</Mono>, never a
                card around it.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                <Mono>{"<Card>"}</Mono>: the <Mono>mat</Mono> at <Mono>lg</Mono> padding (24px). It renders a{" "}
                <Mono>div</Mono>: <Mono>tag</Mono> is accepted for older call sites and ignored, since Fluid
                Functionalism&rsquo;s Card is a div. One of a list goes inside its own <Mono>li</Mono>; a card that is a
                whole article sits inside an <Mono>article</Mono>.
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                <Mono>variant</Mono> <Mono>mat</Mono> or <Mono>raised</Mono>; <Mono>padding</Mono> <Mono>sm</Mono> 8,{" "}
                <Mono>md</Mono> 16, <Mono>lg</Mono> 24; always the container corner, <Mono>rounded-[24px]</Mono>. Parts:{" "}
                <Mono>CardMedia</Mono> (<Mono>aspect</Mono> <Mono>8/5</Mono> by default, <Mono>4/5</Mono>,{" "}
                <Mono>1/1</Mono>, <Mono>16/9</Mono>, <Mono>natural</Mono>), <Mono>CardTitle</Mono> (<Mono>size</Mono>{" "}
                <Mono>sm</Mono> by default, <Mono>md</Mono>, <Mono>lg</Mono> the serif; <Mono>tag</Mono> h3 by default;{" "}
                <Mono>href</Mono>), <Mono>CardMeta</Mono>, <Mono>CardDescription</Mono>. Nothing else exists; the
                library&rsquo;s own parts (CardHeader, CardFooter, CardGroup) stay inside <Mono>ui/card.tsx</Mono>.
              </>
            ),
          },
          {
            term: "Surfaces",
            text: (
              <>
                <Mono>mat</Mono> (<Mono>bg-card</Mono>, the grey mat) under images: its tint is its edge, so a light or
                a dark cover both sit on it. <Mono>raised</Mono> (<Mono>bg-surface-3 shadow-surface-2</Mono>: the third
                step of the library&rsquo;s surface ladder with the second shadow, which in light is the one hairline
                plus a 1px drop, in dark an inset highlight over a ring) for text and controls on the page: the pricing
                plan, a client card on /docs/mcp. The ladder sets the depth; never a shadow of your own, never a border.
              </>
            ),
          },
          {
            term: "Corners",
            text: (
              <>
                The card is the 24px container. <Mono>CardMedia</Mono>&rsquo;s corner follows the padding, concentric
                with it: 24 &minus; 8 gives <Mono>sm</Mono> a 16px image, 24 &minus; 16 gives <Mono>md</Mono> an 8px one,
                and at <Mono>lg</Mono> the two surfaces read apart, so the image keeps its own 4px. The card sets it
                through <Mono>--card-media-radius</Mono>; never round the image yourself.
              </>
            ),
          },
          {
            term: "Images",
            text: (
              <>
                Inside <Mono>CardMedia</Mono>: <Mono>next/image</Mono> with its <Mono>width</Mono>, <Mono>height</Mono>{" "}
                and <Mono>sizes</Mono> (or <Mono>fill</Mono>). The frame crops it to the aspect, shows{" "}
                <Mono>bg-muted</Mono> while it loads, sits on <Mono>shadow-surface-1</Mono> (the hairline step), and
                draws the one stroke inside its edge (<Mono>outline-1 -outline-offset-1 outline-border</Mono> on an{" "}
                <Mono>::after</Mono> over the pixels), so a white screenshot still has an edge.
              </>
            ),
          },
          {
            term: "Title",
            text: (
              <>
                <Mono>CardTitle</Mono> is the ink in the library&rsquo;s semibold (<Mono>fontWeights.semibold</Mono>{" "}
                through <Mono>fontVariationSettings</Mono>, never a <Mono>font-*</Mono> class): <Mono>sm</Mono> 13px,{" "}
                <Mono>md</Mono> 15px. <Mono>lg</Mono> is the serif at h6 (20px) at its one regular weight, for a card
                that stands alone. <Mono>CardMeta</Mono> is the caption in the muted ink, no caps and no tracking any
                more: <Mono>uppercase</Mono> is accepted for older call sites and ignored.
              </>
            ),
          },
          {
            term: "Linked",
            text: (
              <>
                <Mono>{'<CardTitle href="…">'}</Mono>: the title&rsquo;s link stretches over the card (an{" "}
                <Mono>::after</Mono> with <Mono>after:rounded-[24px]</Mono>, the card&rsquo;s own corner), so the link
                is named by the title alone, the image and padding open it, the title turns terracotta on hover, and the
                focus ring (a 1px <Mono>--focus-ring</Mono> outline, 2px out) goes round the card. Meta and description
                sit above that layer: they can be selected and copied, and a click on them doesn&rsquo;t open the link. A
                second control in a linked card (Save) takes <Mono>relative z-20</Mono>. Never wrap a card in a link, and
                never an empty overlay link.
              </>
            ),
          },
          {
            term: "Spacing",
            text: (
              <>
                The parts set their type and colour; the gaps are yours: <Mono>mt-4</Mono> after the media (
                <Mono>mt-3</Mono> in a <Mono>w-56</Mono> card), <Mono>mt-1</Mono> to <Mono>mt-2</Mono> between meta,
                title and description. Order: media, meta, title, description, then any control.
              </>
            ),
          },
          {
            term: "className",
            text: (
              <>
                Layout only: width, margins, grid placement, <Mono>self-start</Mono>. Never a background, padding,
                radius or shadow: pick a <Mono>variant</Mono> and a <Mono>padding</Mono>; <Mono>cx</Mono> doesn&rsquo;t
                merge.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                A card inside a card. A corner that isn&rsquo;t the container&rsquo;s. A hover that lifts or scales the
                card (the title turning terracotta is the hover). A tinted card: the covers bring the colour.
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which surface?
 ├── Floats over content → not a Card:
 │     Menu, Dialog, Toast
 ├── Holds an image or a cover → mat (the default)
 └── Text and controls on the page: a plan,
     a client to connect → raised`}
        />
        <Flow
          tree={`Which padding?
 ├── A frame round one image → sm (8px;
 │     media corner 16px)
 ├── A compact card of text, a list row
 │   → md (16px; media corner 8px)
 └── A cover with its caption, a plan,
     a client card → lg (24px, the default;
     media corner 4px)`}
        />
      </div>

      <SheetSection
        title="Surfaces and padding"
        description="Both surfaces at every padding, each with the media corner its padding implies, concentric with the card's 24px. The first screenshot's white header shows the edge line at work."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(9rem,max-content)"
              align="start"
              columns={PADDINGS.map((p) => (
                <span key={p.padding} className="flex flex-col">
                  {p.head}
                  <span className="text-secondary-foreground">{p.corner}</span>
                </span>
              ))}
              rows={[
                { label: "mat", sub: "bg-card", variant: "mat" as const },
                { label: "raised", sub: "bg-surface-3 shadow-surface-2", variant: "raised" as const },
              ].map((row) => ({
                label: row.label,
                sub: row.sub,
                cells: PADDINGS.map((p) => <Specimen key={p.padding} variant={row.variant} padding={p.padding} />),
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Linked cards"
        description="Each title links, and its link covers the card. Point anywhere on a card but its words and the title turns terracotta; tab to it and the 1px ring goes round the whole card, 2px out. The description can be selected; the Save button keeps its own click."
      >
        <Sheet>
          {() => (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <Card>
                <CardMedia>
                  <Shot i={1} sizes="(min-width: 1280px) 22vw, (min-width: 640px) 40vw, 90vw" />
                </CardMedia>
                <CardMeta className="mt-4">Agency · Landing page</CardMeta>
                <CardTitle className="mt-1" href="/sites">
                  An award-winning studio&rsquo;s home
                </CardTitle>
                <CardDescription className="mt-1">One black panel over a red wall of type.</CardDescription>
              </Card>
              <Card variant="raised">
                <CardMedia aspect="1/1">
                  <Image
                    src="/images/blog/1.jpg"
                    alt="A drawing of a woman wheeling a bicycle full of shopping"
                    width={1040}
                    height={1040}
                    sizes="(min-width: 1280px) 22vw, (min-width: 640px) 40vw, 90vw"
                  />
                </CardMedia>
                <CardMeta className="mt-4">Journal · 4 min read</CardMeta>
                <CardTitle className="mt-1" href="/blog">
                  Why a swipe file beats a mood board
                </CardTitle>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <CardDescription>Saved by 18 designers</CardDescription>
                  <Button size="sm" variant="secondary" className="relative z-20">
                    Save
                  </Button>
                </div>
              </Card>
              <Card variant="raised" className="self-start sm:col-span-2 xl:col-span-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle size="md" href="/docs/mcp">
                    Claude Code
                  </CardTitle>
                  <Badge>Connects directly</Badge>
                </div>
                <CardDescription className="mt-2">
                  Add Curatit with one command, then ask for references while you work.
                </CardDescription>
              </Card>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Text under the mat"
        description="The blog and store cards' composition: the mat holds only the picture and the words sit below it on the page. The outer article is relative isolate, so the title's link covers mat and words together (its ::after keeps the 24px corner)."
      >
        <Sheet>
          {() => (
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 2].map((i) => (
                <article key={i} className="relative isolate">
                  <Card>
                    <CardMedia>
                      <Shot i={i} sizes="(min-width: 1280px) 22vw, (min-width: 640px) 40vw, 90vw" />
                    </CardMedia>
                  </Card>
                  <CardMeta className="mt-4">{i === 0 ? "Studio · Website" : "Studio · Portfolio"}</CardMeta>
                  <CardTitle className="mt-2" href="/sites">
                    {i === 0 ? "An architecture studio's giant wordmark" : "A design studio's grid of work"}
                  </CardTitle>
                </article>
              ))}
            </div>
          )}
        </Sheet>
        <div className="mt-6 flex flex-col gap-6">
          <Code
            correct={`<li>
  <Card>
    <CardMedia>
      <Image src={cover} alt={alt} width={1920} height={1200} sizes="(min-width: 1024px) 33vw, 100vw" />
    </CardMedia>
    <CardMeta className="mt-4">{category}</CardMeta>
    <CardTitle className="mt-1" href={href}>{title}</CardTitle>
  </Card>
</li>

{/* The words under the mat: the article holds the stretched link */}
<article className="relative isolate">
  <Card><CardMedia>…</CardMedia></Card>
  <CardMeta className="mt-4">{category}</CardMeta>
  <CardTitle className="mt-2" href={href}>{title}</CardTitle>
</article>`}
            incorrect={{
              why: "an empty overlay link, a hand-rounded image with Tailwind's shadow, a mat by hand, caps on the caption",
              code: `<article className="relative">
  <Link href={href} title={title} className="absolute inset-0 z-10" />
  <div className="rounded-2xl bg-card p-6">
    <img src={cover} alt={alt} className="w-full rounded-xl shadow" />
  </div>
  <p className="mt-4 text-caption-lg uppercase tracking-wider">{category}</p>
  …
</article>`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
