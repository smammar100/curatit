// /system/separator: Separator (src/components/fundations/elements/Separator.tsx), its tones in
// both orientations on the grounds it meets, and when a line isn't the answer. Every class is
// written out in full, so Tailwind sees it
import Separator from "@/components/fundations/elements/Separator";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";

const TONES: { tone: "default" | "subtle" | "strong"; token: string; use: string }[] = [
  { tone: "default", token: "bg-border-default · 6%", use: "The default: between a menu's groups, the halves of a toolbar" },
  { tone: "subtle", token: "bg-border-subtle · 2%", use: "Between the rows of a dense table, where many lines must stay quiet" },
  { tone: "strong", token: "bg-border-strong · 15%", use: "A boundary that must hold on a grey mat or beside a cover" },
];

// A toolbar row, to show a vertical line stretching to its row's height
function Toolbar({ tone }: { tone: "default" | "subtle" | "strong" }) {
  return (
    <div className="flex h-8 items-center gap-3 text-body-sm text-secondary-foreground">
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
        A 1px hairline between two groups, across or down, in the border tokens&rsquo; alpha tints. Decorative unless
        the boundary needs to be announced. Most groups don&rsquo;t need one: space separates them.
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
                between every row of a list are <Mono>divide-y divide-border-default</Mono> on the list, not a Separator
                per row. A new topic is a heading, not a rule above it. An edge round a group is a Card.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                <Mono>{"<Separator />"}</Mono>: horizontal, <Mono>default</Mono> tone (6%), decorative.
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                <Mono>orientation</Mono> <Mono>horizontal</Mono> or <Mono>vertical</Mono>; <Mono>tone</Mono>{" "}
                <Mono>default</Mono>, <Mono>subtle</Mono>, <Mono>strong</Mono>; <Mono>semantic</Mono>. Always 1px.
                Nothing else: no dashed line, no brand line, no 2px line (2px is the focus ring&rsquo;s width, so a thick
                line reads as focus).
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
                caller&rsquo;s: <Mono>my-1.5</Mono> in a menu, <Mono>my-6</Mono> in a panel.
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
 ├── Every row of a list → divide-y divide-border-default
 │     on the list
 ├── A new topic → a heading, not a rule
 ├── Two groups in one menu → <Separator semantic />
 ├── Two halves of a row → orientation="vertical"
 └── Which tone?
      ├── Rows of a dense table → subtle
      ├── On a grey mat, beside a cover → strong
      └── Anything else → default`}
      />

      <SheetSection
        title="Tones and orientations"
        description="Each tone across a white panel, across a grey mat, and down a toolbar row. The alpha tints mix with whatever is under them, so one token reads on the page and on the mat."
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
                  <div key="m" className="w-full rounded-2xl bg-card px-4 py-4">
                    <Separator tone={t.tone} />
                  </div>,
                  <Toolbar key="v" tone={t.tone} />,
                  <span key="u" className="text-body-sm text-secondary-foreground">
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
        description="A board's More menu, drawn still: the destructive action set apart by a semantic separator, since the two groups have no headings to announce them."
      >
        <Sheet split>
          {() => (
            <div className="w-56 rounded-2xl bg-modal p-1.5 shadow-lg">
              {["Rename", "Edit description"].map((item) => (
                <span key={item} className="flex h-9 items-center rounded-md px-2.5 text-body-sm text-primary-foreground">
                  {item}
                </span>
              ))}
              <Separator semantic className="my-1.5" />
              <span className="flex h-9 items-center rounded-md px-2.5 text-body-sm text-danger-foreground">
                Delete board
              </span>
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`<div role="menu" className="rounded-2xl bg-modal p-1.5 shadow-lg">
  <button role="menuitem" …>Rename</button>
  <button role="menuitem" …>Edit description</button>
  <Separator semantic className="my-1.5" />
  <button role="menuitem" …>Delete board</button>
</div>

{/* Rows of a list: one rule on the list */}
<ul className="divide-y divide-border-default">…</ul>`}
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
