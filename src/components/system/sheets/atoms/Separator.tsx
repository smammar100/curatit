// /system/separator: Separator (src/components/fundations/elements/Separator.tsx), its tones in
// both orientations on the grounds it meets, and when a line isn't the answer. Every class is
// written out in full, so Tailwind sees it
import Separator from "@/components/fundations/elements/Separator";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";

// The one stroke, and the quieter 60% of it the library draws between a menu's groups; strong is
// kept as a name and is the same stroke
const TONES: { tone: "default" | "subtle" | "strong"; token: string; use: string }[] = [
  { tone: "default", token: "bg-border · 12% of the ink", use: "The default: the halves of a toolbar, a panel's header and body" },
  { tone: "subtle", token: "bg-border/60 · about 7%", use: "Between a menu's groups, as Fluid Functionalism draws them; the rows of a dense table" },
  { tone: "strong", token: "bg-border · the same stroke", use: "Kept for older call sites. New code says default" },
];

// A toolbar row, to show a vertical line stretching to its row's height
function Toolbar({ tone }: { tone: "default" | "subtle" | "strong" }) {
  return (
    <div className="flex h-8 items-center gap-3 text-body-sm text-muted-foreground">
      <span>12 posts</span>
      <Separator orientation="vertical" tone={tone} />
      <span>Updated today</span>
    </div>
  );
}

export default function SeparatorSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Separator">
        A 1px line between two groups, across or down, in the one stroke every edge on the site shares, or a quieter
        60% of it. Decorative unless the boundary needs to be announced. Most groups don&rsquo;t need one: space
        separates them.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                Where space alone doesn&rsquo;t hold two groups apart: a menu&rsquo;s actions and its Delete, a
                toolbar&rsquo;s count and its date, a panel&rsquo;s header and its body when both are dense.
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                A gap, most of the time (<Mono>gap-6</Mono>, <Mono>mt-8</Mono>): a line is one more thing to read. Lines
                between every row of a list are <Mono>divide-y divide-border</Mono> on the list, not a Separator per
                row. A new topic is a heading, not a rule above it. An edge round a group is a Card.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                <Mono>{"<Separator />"}</Mono>: horizontal, <Mono>default</Mono> tone (the one stroke), decorative.
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                <Mono>orientation</Mono> <Mono>horizontal</Mono> or <Mono>vertical</Mono>; <Mono>tone</Mono>{" "}
                <Mono>default</Mono>, <Mono>subtle</Mono>, <Mono>strong</Mono>; <Mono>semantic</Mono>. Always 1px.
                Nothing else: no dashed line, no brand line, no 2px line (every stroke on the site is 1px, the focus ring
                included, so a thicker line reads as a frame, not a divider).
              </>
            ),
          },
          {
            term: "One stroke",
            text: (
              <>
                Since 2026-10-23 there is one stroke, <Mono>--border</Mono>: 12% of the ink mixed into whatever is
                under it, the line Fluid Functionalism draws round fields, outlined badges and raised cards. The Separator
                is that stroke laid flat (<Mono>bg-border</Mono>). <Mono>strong</Mono> used to be a darker 15% and is now
                the same stroke, kept so older call sites still compile; <Mono>subtle</Mono> is <Mono>bg-border/60</Mono>,
                the quieter line the library puts between a menu&rsquo;s groups and between a card group&rsquo;s tiles.
              </>
            ),
          },
          {
            term: "Semantic",
            text: (
              <>
                Decorative by default (<Mono>role=&quot;none&quot;</Mono>): right when the groups already have headings
                or are separate lists. <Mono>semantic</Mono> makes it <Mono>role=&quot;separator&quot;</Mono> with{" "}
                <Mono>aria-orientation</Mono>, for a boundary nothing else announces: the groups of one menu.
              </>
            ),
          },
          {
            term: "Length",
            text: (
              <>
                Horizontal fills its container&rsquo;s width. Vertical stretches to its flex row&rsquo;s height (
                <Mono>self-stretch</Mono>); anywhere else give it a height in className (<Mono>h-4</Mono>). Margins are the
                caller&rsquo;s: <Mono>my-1</Mono> in a menu, <Mono>my-6</Mono> in a panel.
              </>
            ),
          },
          {
            term: "className",
            text: (
              <>
                Margins, length and placement. Never a colour, thickness or border: pick a <Mono>tone</Mono>.
              </>
            ),
          },
        ]}
      />

      <Flow
        tree={`A line between things?
 ├── Space alone separates them → no line: a gap
 ├── Every row of a list → divide-y divide-border
 │     on the list
 ├── A new topic → a heading, not a rule
 ├── Two groups in one menu → <Separator semantic tone="subtle" />
 ├── Two halves of a row → orientation="vertical"
 └── Which tone?
      ├── Inside a menu, rows of a dense table → subtle
      └── Anything else → default (strong is the same line)`}
      />

      <SheetSection
        title="Tones and orientations"
        description="Each tone across a white panel, across a grey mat, and down a toolbar row. The stroke is an alpha of the ink, so one token reads on the page and on the mat, in both themes."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(7rem,max-content)"
              template="minmax(10rem,1fr) minmax(10rem,1fr) minmax(12rem,max-content) minmax(14rem,1fr)"
              columns={["on the page", "on bg-card", "vertical", "use"]}
              rows={TONES.map((t) => ({
                label: t.tone,
                sub: t.token,
                cells: [
                  <div key="p" className="w-full py-4">
                    <Separator tone={t.tone} />
                  </div>,
                  <div key="m" className="w-full rounded-[24px] bg-card px-4 py-4">
                    <Separator tone={t.tone} />
                  </div>,
                  <Toolbar key="v" tone={t.tone} />,
                  <span key="u" className="text-body-sm text-muted-foreground">
                    {t.use}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="In a menu"
        description="A board's More menu, drawn still on the menu's surface (two steps up the ladder, with the third shadow): the destructive action set apart by a semantic separator in the subtle tone, since the two groups have no headings to announce them."
      >
        <Sheet split>
          {() => (
            <div className="w-56 rounded-[24px] bg-surface-3 p-1 shadow-surface-3">
              {/* Menu rows drawn still in the site's shapes: the compact 28px pill */}
              {["Rename", "Edit description"].map((item) => (
                <span key={item} className="flex h-7 items-center rounded-[20px] px-2.5 text-body-sm text-foreground">
                  {item}
                </span>
              ))}
              <Separator semantic tone="subtle" className="my-1" />
              <span className="flex h-7 items-center rounded-[20px] px-2.5 text-body-sm text-destructive">
                Delete board
              </span>
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`<Menu trigger={…} label="Board actions">
  <MenuItem onSelect={rename}>Rename</MenuItem>
  <MenuItem onSelect={describe}>Edit description</MenuItem>
  <MenuSeparator />
  <MenuItem onSelect={remove}>Delete board</MenuItem>
</Menu>

{/* The same line in a panel of your own */}
<Separator semantic tone="subtle" className="my-1" />

{/* Rows of a list: one rule on the list */}
<ul className="divide-y divide-border">…</ul>`}
            incorrect={{
              why: "a 2px solid grey, and a Separator under every row",
              code: `<hr className="my-4 border-t-2 border-base-200" />

<ul>
  {tokens.map((token) => (
    <li key={token.id}>
      {token.name}
      <Separator />
    </li>
  ))}
</ul>`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
