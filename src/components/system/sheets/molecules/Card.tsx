// /system/card: Card and its parts (src/components/fundations/molecules/Card.tsx), both
// surfaces at every padding with the media corner each implies, linked cards live, and the
// compositions the site uses. Every class is written out in full, so Tailwind sees it
import Image from "next/image";
import Badge from "@/components/fundations/elements/Badge";
import Button from "@/components/fundations/elements/Button";
import Card, { CardDescription, CardMedia, CardMeta, CardTitle } from "@/components/fundations/molecules/Card";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";

const PADDINGS: { padding: "sm" | "md" | "lg"; head: string; corner: string }[] = [
  { padding: "sm", head: "sm · p-2 · 8px", corner: "media 4px: 12 − 8" },
  { padding: "md", head: "md · p-4 · 16px", corner: "media square: 12 − 16 ≤ 0" },
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
      <CardMeta className="mt-3" uppercase>
        {agency ? "Agency · Landing page" : "Studio · Website"}
      </CardMeta>
      <CardTitle className="mt-1">{agency ? "A creative tech company" : "Groth's home page"}</CardTitle>
    </Card>
  );
}

export default function CardSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Card">
        A grouped surface: the grey mat under images, or a white card with a hairline. A 12px corner, three paddings,
        and parts for the picture, the title, a caption and a sentence. Give the title an <Mono>href</Mono> and the
        whole card opens it.
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
                a floating list or task is <Mono>Menu</Mono> or <Mono>Dialog</Mono> (they float, with{" "}
                <Mono>bg-modal</Mono>); nothing-here-yet is <Mono>EmptyState</Mono>. A page section is a{" "}
                <Mono>Wrapper</Mono>, never a card around it.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                <Mono>{"<Card>"}</Mono>: the <Mono>mat</Mono> at <Mono>lg</Mono> padding (24px), as a <Mono>div</Mono>;{" "}
                <Mono>{'tag="article"'}</Mono> for one of a list of things, <Mono>{'tag="li"'}</Mono> inside a{" "}
                <Mono>ul</Mono>.
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                <Mono>variant</Mono> <Mono>mat</Mono> or <Mono>raised</Mono>; <Mono>padding</Mono> <Mono>sm</Mono> 8,{" "}
                <Mono>md</Mono> 16, <Mono>lg</Mono> 24; always <Mono>rounded-2xl</Mono>. Parts: <Mono>CardMedia</Mono>{" "}
                (<Mono>aspect</Mono> <Mono>8/5</Mono> by default, <Mono>4/5</Mono>, <Mono>1/1</Mono>, <Mono>16/9</Mono>,{" "}
                <Mono>natural</Mono>), <Mono>CardTitle</Mono> (<Mono>size</Mono> <Mono>sm</Mono> by default,{" "}
                <Mono>md</Mono>, <Mono>lg</Mono> the serif; <Mono>tag</Mono> h3 by default; <Mono>href</Mono>),{" "}
                <Mono>CardMeta</Mono> (<Mono>uppercase</Mono>), <Mono>CardDescription</Mono>. Nothing else exists.
              </>
            ),
          },
          {
            term: "Surfaces",
            text: (
              <>
                <Mono>mat</Mono> (<Mono>bg-card</Mono>) under images: its tint is its edge, so a light or a dark cover
                both sit on it. <Mono>raised</Mono> (<Mono>bg-container shadow-xs</Mono>) for text and controls on the
                page: the pricing plan, a client card on /docs/mcp. Never a shadow above <Mono>xs</Mono> at rest (lift is
                for things that float), never a border.
              </>
            ),
          },
          {
            term: "Corners",
            text: (
              <>
                The card is 12px. <Mono>CardMedia</Mono>&rsquo;s corner follows the padding: inner = outer &minus;
                padding, so <Mono>sm</Mono> holds a 4px image, <Mono>md</Mono> a square-cornered one (12 &minus; 16 is
                below zero: a curve there would open the corner wider than the sides), <Mono>lg</Mono> a 4px one again
                (from 24px the two surfaces read apart). The card sets it through a CSS variable; never round the image
                yourself.
              </>
            ),
          },
          {
            term: "Images",
            text: (
              <>
                Inside <Mono>CardMedia</Mono>: <Mono>next/image</Mono> with its <Mono>width</Mono>, <Mono>height</Mono>{" "}
                and <Mono>sizes</Mono> (or <Mono>fill</Mono>). The frame crops it to the aspect, shows the component tint
                while it loads, and draws the default shadow and the 1px edge line over the pixels, so a white screenshot
                still has an edge.
              </>
            ),
          },
          {
            term: "Linked",
            text: (
              <>
                <Mono>{'<CardTitle href="…">'}</Mono>: the title&rsquo;s link stretches over the card, so the link is
                named by the title alone, the image and padding open it, and the focus ring goes round the card. Meta and
                description sit above that layer: they can be selected and copied, and a click on them doesn&rsquo;t
                open the link. A second control in a linked card (Save) takes <Mono>relative z-20</Mono>. Never wrap a
                card in a link, and never an empty overlay link.
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
                A card inside a card. A corner above <Mono>rounded-2xl</Mono>. A hover that lifts or scales the card (the
                title turning terracotta is the hover). A tinted card: the covers bring the colour.
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
 │     media corner 4px)
 ├── A compact card of text, a list row
 │   → md (16px; media square)
 └── A cover with its caption, a plan,
     a client card → lg (24px, the default)`}
        />
      </div>

      <SheetSection
        title="Surfaces and padding"
        description="Both surfaces at every padding, each with the media corner its padding implies. The first screenshot's white header shows the edge line at work."
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
                { label: "raised", sub: "bg-container shadow-xs", variant: "raised" as const },
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
        description="Each title links, and its link covers the card. Point anywhere on a card but its words; tab to it and the ring goes round the whole card. The description can be selected; the Save button keeps its own click."
      >
        <Sheet>
          {() => (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <Card tag="article">
                <CardMedia>
                  <Shot i={1} sizes="(min-width: 1280px) 22vw, (min-width: 640px) 40vw, 90vw" />
                </CardMedia>
                <CardMeta className="mt-4" uppercase>
                  Agency · Landing page
                </CardMeta>
                <CardTitle className="mt-1" href="/sites">
                  An award-winning studio&rsquo;s home
                </CardTitle>
                <CardDescription className="mt-1">One black panel over a red wall of type.</CardDescription>
              </Card>
              <Card tag="article" variant="raised">
                <CardMedia aspect="1/1">
                  <Image
                    src="/images/blog/1.jpg"
                    alt="A drawing of a woman wheeling a bicycle full of shopping"
                    width={1040}
                    height={1040}
                    sizes="(min-width: 1280px) 22vw, (min-width: 640px) 40vw, 90vw"
                  />
                </CardMedia>
                <CardMeta className="mt-4" uppercase>
                  Journal · 4 min read
                </CardMeta>
                <CardTitle className="mt-1" href="/blog">
                  Why a swipe file beats a mood board
                </CardTitle>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <CardDescription>Saved by 18 designers</CardDescription>
                  <Button size="sm" variant="secondary" className="z-20">
                    Save
                  </Button>
                </div>
              </Card>
              <Card tag="article" variant="raised" className="self-start sm:col-span-2 xl:col-span-1">
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
        description="The blog and store cards' composition: the mat holds only the picture and the words sit below it on the page. The outer article is relative isolate, so the title's link covers mat and words together."
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
                  <CardMeta className="mt-4" uppercase>
                    {i === 0 ? "Studio · Website" : "Studio · Portfolio"}
                  </CardMeta>
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
            correct={`<Card tag="article">
  <CardMedia>
    <Image src={cover} alt={alt} width={1920} height={1200} sizes="(min-width: 1024px) 33vw, 100vw" />
  </CardMedia>
  <CardMeta className="mt-4" uppercase>{category}</CardMeta>
  <CardTitle className="mt-1" href={href}>{title}</CardTitle>
</Card>

{/* The words under the mat: the article holds the stretched link */}
<article className="relative isolate">
  <Card><CardMedia>…</CardMedia></Card>
  <CardMeta className="mt-4" uppercase>{category}</CardMeta>
  <CardTitle className="mt-2" href={href}>{title}</CardTitle>
</article>`}
            incorrect={{
              why: "an empty overlay link, a hand-rounded image with Tailwind's shadow, a mat by hand",
              code: `<article className="relative">
  <Link href={href} title={title} className="absolute inset-0 z-10" />
  <div className="rounded-2xl bg-card p-6">
    <img src={cover} alt={alt} className="w-full rounded-xl shadow" />
  </div>
  …
</article>`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
