// /system/empty-state: fundations/molecules/EmptyState.tsx, both sizes and both contexts with
// real copy, live in both themes. Server only: nothing here needs a script
import Button from "@/components/fundations/elements/Button";
import Card from "@/components/fundations/molecules/Card";
import EmptyState from "@/components/fundations/molecules/EmptyState";
import BookmarkSimple from "@/components/fundations/icons/BookmarkSimple";
import Search from "@/components/fundations/icons/Search";
import SquaresFour from "@/components/fundations/icons/SquaresFour";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";
import { FEEDBACK_FLOW } from "./Notice";

/** A board waiting for its first post: two cards fanned behind a dashed one. Drawn in the
 *  tokens (the raised surface, the one stroke, the muted tile), so it follows the theme;
 *  decorative (EmptyState hides it), as the words say the same */
function BoardArt() {
  const card = (x: number, angle: number) => (
    <g transform={`translate(${x} 34) rotate(${angle} 36 46)`}>
      <rect x="0.75" y="0.75" width="70.5" height="90.5" rx="8" className="fill-surface-3 stroke-border" strokeWidth="1.5" />
      <rect x="8" y="8" width="56" height="50" rx="4" className="fill-muted" />
      <rect x="8" y="67" width="36" height="5" rx="2.5" className="fill-muted" />
      <rect x="8" y="77" width="24" height="5" rx="2.5" className="fill-muted" />
    </g>
  );
  return (
    <svg viewBox="0 0 224 140" className="w-52">
      <ellipse cx="112" cy="132" rx="74" ry="4" className="fill-muted" />
      {card(36, -10)}
      {card(116, 10)}
      <g transform="translate(76 22)">
        <rect x="0.75" y="0.75" width="70.5" height="102.5" rx="8" className="fill-surface-3 stroke-border" strokeWidth="1.5" strokeDasharray="5 5" />
        <path d="M36 32v20M26 42h20" className="stroke-muted-foreground" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="8" y="76" width="36" height="5" rx="2.5" className="fill-muted" />
        <rect x="8" y="86" width="24" height="5" rx="2.5" className="fill-muted" />
      </g>
    </svg>
  );
}

// What each size and context sets (sizes, dashboardType and siteType in EmptyState.tsx). The
// weight is the library's semibold through fontVariationSettings, except the site's md title,
// which is the serif at its one weight
const SPEC: { label: string; sub: string; title: string; line: string; space: string }[] = [
  { label: "md · dashboard", sub: "the default", title: "text-title · semibold · 16/22", line: "text-body · 13/20", space: "max-w-sm · py-16 · art mb-6 · actions mt-6" },
  { label: "sm · dashboard", sub: "a panel or menu", title: "text-body · semibold · 13/20", line: "text-caption · 12/16", space: "max-w-xs · px-4 py-8 · art mb-3 · actions mt-4" },
  { label: "md · site", sub: "marketing, auth, share", title: "Text h6 · the serif, 20/24", line: "Text body · 15/24", space: "max-w-sm · py-16 · art mb-6 · actions mt-6" },
  { label: "sm · site", sub: "a card on the site", title: "Text bodySM · semibold · 13/20", line: "Text bodySM · 13/20", space: "max-w-xs · px-4 py-8 · art mb-3 · actions mt-4" },
];

export default function EmptyStateSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Empty state">
        What a place looks like with nothing in it yet, and the way forward: a picture, the place named, a line on how
        things get here, and one action. An empty board, the Saved view before the first save, a search that found
        nothing.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                Where a list, grid or panel would be, once you know it&rsquo;s empty: a board with no posts, no boards
                yet, a search with no matches, a review queue with nothing waiting.
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                Still loading is a <Mono>Skeleton</Mono>: an empty state shown while data loads tells the person they
                have nothing. Failed to load is a <Mono>Notice tone=&quot;danger&quot;</Mono> with a way to try again,
                because &ldquo;empty&rdquo; and &ldquo;couldn&rsquo;t load&rdquo; need different next steps.
              </>
            ),
          },
          {
            term: "Sizes",
            text: (
              <>
                Two, and nothing else: <Mono>md</Mono> (the default) for a page or a section, <Mono>sm</Mono> inside a
                panel, a card or a menu.
              </>
            ),
          },
          {
            term: "context",
            text: (
              <>
                <Mono>dashboard</Mono> (the default) sets the app&rsquo;s roles; <Mono>site</Mono> sets{" "}
                <Mono>&lt;Text&gt;</Mono>, with the md title in the serif, for marketing, auth and share pages. Pick the
                one the page around it uses: DESIGN.md&rsquo;s rule 5.
              </>
            ),
          },
          {
            term: "Type",
            text: (
              <>
                The title is the ink (<Mono>text-foreground</Mono>) in the library&rsquo;s semibold, set through{" "}
                <Mono>fontVariationSettings: fontWeights.semibold</Mono> (wght 550 with its optical size), never a{" "}
                <Mono>font-*</Mono> class; the site&rsquo;s md title is the serif at its one regular weight and takes no
                weight at all. The line is <Mono>text-muted-foreground</Mono>, a step down, so the place&rsquo;s name
                leads and the how-to follows.
              </>
            ),
          },
          {
            term: "Picture",
            text: (
              <>
                One of <Mono>icon</Mono> (a Phosphor icon on a quiet tile; the type refuses both) or{" "}
                <Mono>illustration</Mono> (a drawing in the tokens, as it is), or none. The tile is{" "}
                <Mono>bg-muted</Mono> with the icon in <Mono>text-muted-foreground</Mono>, at <Mono>md</Mono> 48px with
                the pill&rsquo;s <Mono>rounded-[20px]</Mono>, at <Mono>sm</Mono> 40px with <Mono>rounded-[16px]</Mono>, so
                the tile&rsquo;s corner is the shape everything else on the site shares. Either picture is hidden from
                screen readers: the words must say everything without it. An md page section earns an illustration; sm
                gets an icon at most.
              </>
            ),
          },
          {
            term: "Actions",
            text: (
              <>
                <Mono>action</Mono>: the one next step, usually a <Mono>Button size=&quot;sm&quot;</Mono> (the view&rsquo;s
                default, if nothing else on screen is). <Mono>secondaryAction</Mono>: a quieter way out beside it, a{" "}
                <Mono>transparent</Mono> Button or a text link (&ldquo;Clear search&rdquo;). Never two solid buttons.
              </>
            ),
          },
          {
            term: "Copy",
            text: (
              <>
                Say what&rsquo;s empty, why, and the next step. The title names the place (&ldquo;Nothing on this board
                yet&rdquo;, &ldquo;Nothing matches &lsquo;launch&rsquo;&rdquo;), never &ldquo;No data&rdquo; or
                &ldquo;No results&rdquo;. The line says how things get here, in a sentence or two. The button says the
                outcome: &ldquo;Browse the feed&rdquo;.
              </>
            ),
          },
        ]}
      />

      <Flow tree={FEEDBACK_FLOW} />

      <SheetSection
        title="md · dashboard"
        description="A page or a section: the empty board, with an illustration and the one next step."
      >
        <Sheet>
          {() => (
            <EmptyState
              illustration={<BoardArt />}
              title="Nothing on this board yet"
              description="Save posts to it from the feed: Save is on every post, and this board is in its list."
              action={
                <Button size="sm" isLink href="/dashboard">
                  Browse the feed
                </Button>
              }
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="md, with a second way out"
        description="A search that found nothing: the next step, and a quiet way back. An icon on the 48px muted tile instead of a drawing, and no secondary solid."
      >
        <Sheet>
          {() => (
            <EmptyState
              icon={<Search />}
              title="Nothing in Travel matches ‘launch’"
              description="Try a format or a goal instead, like ‘carousel’, or look across every category."
              action={<Button size="sm">Search every category</Button>}
              secondaryAction={
                <Button size="sm" variant="transparent">
                  Clear search
                </Button>
              }
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="sm · dashboard"
        description="Inside a panel, a card or a menu: smaller type, tighter spacing, the 40px tile, an icon at most. Each sits in a raised Card at its smallest padding."
      >
        <Sheet split>
          {() => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card variant="raised" padding="sm">
                <EmptyState
                  size="sm"
                  icon={<BookmarkSimple />}
                  title="No boards yet"
                  description="Make one to keep posts for a brief together."
                  action={<Button size="sm">New board</Button>}
                />
              </Card>
              <Card variant="raised" padding="sm">
                <EmptyState
                  size="sm"
                  icon={<SquaresFour />}
                  title="Nothing to review"
                  description="Every analysis has a decision. New ones arrive after each import."
                />
              </Card>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="md · site"
        description="On the marketing, auth and share pages the type is Text: the title in the serif, which takes no weight. The share page's empty board."
      >
        <Sheet>
          {() => (
            <EmptyState
              context="site"
              title="This board is empty"
              description="Its owner hasn’t saved anything to it yet. Make your own board and fill it from a library of real brand posts."
              action={
                <Button size="sm" isLink href="/signup">
                  Make your own board
                </Button>
              }
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="What each size and context sets"
        description="Centred, text-balance on the title and text-pretty on the line, so neither ends on a lone word. Semibold is the library's, through fontVariationSettings."
      >
        <Sheet>
          {() => (
            <Matrix
              first="8rem"
              template="minmax(14rem,max-content) minmax(10rem,max-content) minmax(16rem,1fr)"
              columns={["title", "line", "spacing"]}
              rows={SPEC.map((s) => ({
                label: s.label,
                sub: s.sub,
                cells: [<Mono key="t">{s.title}</Mono>, <Mono key="l">{s.line}</Mono>, <Mono key="s">{s.space}</Mono>],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Code">
        <Code
          correct={`<EmptyState
  illustration={<EmptyBoardArt className="w-64" />}
  title="Nothing on this board yet"
  description="Save posts to it from the feed: Save is on every post, and this board is in its list."
  action={<Button isLink href="/dashboard" size="sm">Browse the feed</Button>}
/>`}
          incorrect={{
            why: "says nothing about why or what next, and two solid buttons",
            code: `<EmptyState
  title="No data"
  description="There are no items."
  action={<Button>Create</Button>}
  secondaryAction={<Button>Import</Button>}
/>`,
          }}
        />
      </SheetSection>
    </div>
  );
}
