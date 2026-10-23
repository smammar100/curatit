// /system/spinner: Spinner (src/components/fundations/elements/Spinner.tsx), its sizes in the
// colours it takes from its parent, how it rests, and the waits it isn't for. Every class is
// written out in full, so Tailwind sees it
import Spinner from "@/components/fundations/elements/Spinner";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";

const SIZES = ["sm", "md", "lg"] as const;
const PX = { sm: "14", md: "16", lg: "20" };

// The spinner takes its colour from the text around it: the grounds and inks it meets
const INKS: { label: string; sub: string; box: string }[] = [
  { label: "text-muted-foreground", sub: "the default beside a status line", box: "text-muted-foreground" },
  { label: "text-foreground", sub: "inside a heading or a strong label", box: "text-foreground" },
  {
    label: "text-background",
    sub: "on the ink (Button's loading, the toast)",
    box: "rounded-[20px] bg-foreground p-2 text-background",
  },
  { label: "a grey mat", sub: "bg-card, the muted ink", box: "rounded-[20px] bg-card p-2 text-muted-foreground" },
];

/** The figure of eight at rest, as reduced motion shows it: the same path with its 15/85 dash
 *  and no animation. A specimen for this sheet only; the component draws the real one */
function Resting() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        pathLength="100"
        className="[stroke-dasharray:15_85]"
      />
    </svg>
  );
}

export default function SpinnerSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Spinner">
        An inline wait: Fluid Functionalism&rsquo;s figure of eight, a short dash running round one path in the colour
        of the text around it, at 14, 16 or 20px. For something that finishes in a second or two, right where
        you&rsquo;re looking. It names the wait once, or stays silent inside a control that already says it&rsquo;s
        busy.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                A short wait with no layout to hold, beside the thing that&rsquo;s waiting: a note saving, a link being
                copied, a name being checked. Under two seconds as a rule; past that, say in words what&rsquo;s
                happening.
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                A button&rsquo;s own request is <Mono>{"<Button loading>"}</Mono>: the same figure over the label, which
                stays mounted at opacity 0 so the width holds; the button is disabled while it&rsquo;s busy (the
                library&rsquo;s way). A region whose content is on its way (the feed, a card, a list) is{" "}
                <Mono>Skeleton</Mono>, which holds the layout so nothing jumps. A page never waits behind one spinner.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                <Mono>{'<Spinner label="Saving note" />'}</Mono>: <Mono>md</Mono>, 16px, read once as a status.
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                Sizes <Mono>sm</Mono> 14, <Mono>md</Mono> 16, <Mono>lg</Mono> 20, and either <Mono>label</Mono> or{" "}
                <Mono>decorative</Mono>. The types make you pick one of the two: a bare{" "}
                <Mono>{"<Spinner />"}</Mono> doesn&rsquo;t compile. No colour, speed or track options.
              </>
            ),
          },
          {
            term: "Naming",
            text: (
              <>
                <Mono>label</Mono> says what&rsquo;s happening, in the words the screen shows: &ldquo;Saving
                note&rdquo;, &ldquo;Checking the link&rdquo;, never &ldquo;Loading&rdquo; on its own or
                &ldquo;spinner&rdquo;. It becomes a <Mono>role=&quot;status&quot;</Mono> with the words visually hidden.{" "}
                <Mono>decorative</Mono> when the control around it already says so (a button&rsquo;s{" "}
                <Mono>aria-busy</Mono>, a visible &ldquo;Saving…&rdquo; inside a status region): two announcements of
                one wait is noise.
              </>
            ),
          },
          {
            term: "Colour",
            text: (
              <>
                <Mono>currentColor</Mono>: set the ink on the parent (<Mono>text-muted-foreground</Mono> beside a status
                line). Never brand: terracotta is for interaction, and a wait isn&rsquo;t one.
              </>
            ),
          },
          {
            term: "The figure",
            text: (
              <>
                One SVG path, a figure of eight in a 24px box, stroked 1.5 with round caps and a{" "}
                <Mono>pathLength</Mono> of 100, so its dash is measured in percent: the path the library draws inside its
                Button, installed with it on 2026-10-23. A 15/85 dash (<Mono>[stroke-dasharray:15_85]</Mono>) runs round it
                while the dash breathes longer and shorter, so the figure reads as moving rather than turning.
              </>
            ),
          },
          {
            term: "Motion",
            text: (
              <>
                Two keyframes in <Mono>global.css</Mono>, both on the stroke: <Mono>spinner-move</Mono> slides the dash
                one lap every 2s, linear (an eased lap would seem to stall), and <Mono>spinner-dash</Mono> grows the dash
                from 15 to 40 and back over 4s, ease-in-out. Under reduced motion both stop (
                <Mono>motion-reduce:[animation:none]</Mono>): a short dash on the figure, still clearly unfinished.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                A spinner for a wait under 300ms: it flashes, and the flash reads as a glitch. Two on one screen. A
                disabled button with a spinner in it beside the label (that&rsquo;s <Mono>loading</Mono>, which keeps
                the width). The figure by hand, or Phosphor&rsquo;s notch on <Mono>animate-spin</Mono>: both miss
                reduced motion and the name, and the notch is no longer the site&rsquo;s wait.
              </>
            ),
          },
        ]}
      />

      <Flow
        tree={`Which wait?
 ├── A button's own request → <Button loading>
 ├── A region whose layout you know → Skeleton
 ├── A small wait beside something, done in a
 │   second or two → Spinner
 │     ├── The control around it already says
 │     │   it's busy → decorative
 │     └── Nothing else says it → label="Saving note"
 └── Longer than a few seconds → words that say
       what's happening, and what's done so far`}
      />

      <SheetSection
        title="Sizes and inks"
        description="Each size in the colours it meets. The spinner has no colour of its own: it is the text's ink."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(14rem,max-content)"
              template="repeat(3, minmax(5rem,max-content)) minmax(12rem,1fr)"
              columns={[...SIZES.map((s) => `${s} · ${PX[s]}`), "beside text"]}
              rows={INKS.map((ink) => ({
                label: ink.label,
                sub: ink.sub,
                cells: [
                  ...SIZES.map((size) => (
                    <span key={size} className={ink.box}>
                      <Spinner size={size} decorative />
                    </span>
                  )),
                  <span key="t" className={ink.box}>
                    <span className="flex items-center gap-2 text-body-sm">
                      <Spinner size="sm" decorative />
                      Saving note…
                    </span>
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Named, silent, still"
        description="The same figure three ways: read out as a status, silent inside something that already says it's busy, and as it rests under reduced motion."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(9rem,max-content)"
              template="minmax(14rem,max-content) minmax(16rem,1fr)"
              columns={["specimen", "what a screen reader gets"]}
              rows={[
                {
                  label: "label",
                  sub: 'label="Copying link"',
                  cells: [
                    <span key="s" className="text-muted-foreground">
                      <Spinner label="Copying link" />
                    </span>,
                    <span key="r" className="text-body-sm text-muted-foreground">
                      A status, read once: &ldquo;Copying link&rdquo;. The words are hidden on screen.
                    </span>,
                  ],
                },
                {
                  label: "decorative",
                  sub: "inside a status line",
                  cells: [
                    <p key="s" role="status" className="flex items-center gap-2 text-body-sm text-muted-foreground">
                      <Spinner size="sm" decorative />
                      Checking the link…
                    </p>,
                    <span key="r" className="text-body-sm text-muted-foreground">
                      The line around it is the status and says it in words; the figure is hidden.
                    </span>,
                  ],
                },
                {
                  label: "reduced motion",
                  sub: "how it rests",
                  cells: [
                    <span key="s" className="flex text-muted-foreground">
                      <Resting />
                    </span>,
                    <span key="r" className="text-body-sm text-muted-foreground">
                      <Mono>motion-reduce:[animation:none]</Mono>: the dash stops where it starts, 15% of the figure,
                      still clearly not done.
                    </span>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`{/* A status line: the words say it, the figure is decoration */}
<p role="status" className="flex items-center gap-2 text-body-sm text-muted-foreground">
  <Spinner size="sm" decorative />
  Saving note…
</p>

{/* On its own: the label is the status */}
<Spinner label="Copying link" />

{/* A button's own request */}
<Button loading={saving} onClick={save}>Save</Button>`}
            incorrect={{
              why: "the notch by hand in brand colour, and a disabled button standing in for loading",
              code: `<CircleNotch className="size-4 animate-spin text-brand-foreground" />

<Button disabled={saving}>
  {saving && <CircleNotch className="size-4 animate-spin" />}
  Save
</Button>`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
