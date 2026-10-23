// /system/kbd: Kbd (src/components/fundations/elements/Kbd.tsx), single keys and combinations
// at both sizes, in the sentences and controls where Curatit's shortcuts live. Every class is
// written out in full, so Tailwind sees it
import type { ReactNode } from "react";
import Kbd from "@/components/fundations/elements/Kbd";
import Search from "@/components/fundations/icons/Search";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";

// Keys and combinations, each as it's written and what a screen reader hears
const KEYS: { label: string; sub: string; render: (size: "sm" | "md") => ReactNode; reads: string }[] = [
  { label: "<Kbd>/</Kbd>", sub: "one key, children", render: (size) => <Kbd size={size}>/</Kbd>, reads: "slash" },
  { label: '<Kbd keys={["esc"]} />', sub: "a named key", render: (size) => <Kbd size={size} keys={["esc"]} />, reads: "Escape" },
  {
    label: '<Kbd keys={["cmd", "k"]} />',
    sub: "the Command glyph",
    render: (size) => <Kbd size={size} keys={["cmd", "k"]} />,
    reads: "Command plus K",
  },
  {
    label: '<Kbd keys={["ctrl", "k"]} />',
    sub: "the same on Windows",
    render: (size) => <Kbd size={size} keys={["ctrl", "k"]} />,
    reads: "Control plus K",
  },
  {
    label: '<Kbd keys={["shift", "enter"]} />',
    sub: "symbols, read by name",
    render: (size) => <Kbd size={size} keys={["shift", "enter"]} />,
    reads: "Shift plus Enter",
  },
  {
    label: '<Kbd keys={["cmd", "option", "c"]} />',
    sub: "three together",
    render: (size) => <Kbd size={size} keys={["cmd", "option", "c"]} />,
    reads: "Command plus Option plus C",
  },
  { label: '<Kbd keys={["left"]} />', sub: "an arrow", render: (size) => <Kbd size={size} keys={["left"]} />, reads: "Left arrow" },
];

export default function KbdSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Kbd">
        A key to press, drawn as a cap: the search box&rsquo;s slash, &ldquo;J and K to step through the
        queue&rdquo;. Two sizes, one key or a combination, each key read by its name. It shows a key; it never is one.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                A keyboard shortcut, shown where it works: the search box&rsquo;s <Mono>/</Mono> (SearchBox.tsx), a
                help line for the review queue&rsquo;s <Mono>J</Mono> / <Mono>K</Mono> or the post view&rsquo;s
                arrows and <Mono>Esc</Mono>. The shortcut must exist: a hint for a key that does nothing is a broken
                promise.
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                Something to click is a <Mono>Button</Mono>; a value to copy (a command, a token) is{" "}
                <Mono>CopyBlock</Mono> or a <Mono>{"<code>"}</Mono>. A label is a <Mono>Badge</Mono>. A key cap is only
                ever a key.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                <Mono>{"<Kbd>/</Kbd>"}</Mono>: <Mono>md</Mono>, 24px, the search box&rsquo;s cap.
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                Sizes <Mono>sm</Mono> 20 (in a menu row or a 12-13px sentence) and <Mono>md</Mono> 24; one key as{" "}
                <Mono>children</Mono> or a combination as <Mono>keys</Mono>; <Mono>hideOnTouch</Mono>. Named keys:{" "}
                <Mono>cmd</Mono>, <Mono>shift</Mono>, <Mono>option</Mono>, <Mono>alt</Mono>, <Mono>ctrl</Mono>,{" "}
                <Mono>enter</Mono>, <Mono>esc</Mono>, <Mono>tab</Mono>, <Mono>space</Mono>, <Mono>backspace</Mono>,{" "}
                <Mono>up</Mono>, <Mono>down</Mono>, <Mono>left</Mono>, <Mono>right</Mono>; a single letter is
                capitalised.
              </>
            ),
          },
          {
            term: "Combinations",
            text: (
              <>
                <Mono>{'keys={["cmd", "k"]}'}</Mono>, never <Mono>{"<Kbd>⌘K</Kbd>"}</Mono>: each key gets its own cap,
                and the symbols are read by name (&ldquo;Command plus K&rdquo;). A bare ⌘ is read as &ldquo;place of
                interest sign&rdquo;. Keys pressed one after another (G then H) are two Kbds with &ldquo;then&rdquo;
                between them.
              </>
            ),
          },
          {
            term: "Mac and not",
            text: (
              <>
                ⌘ and ⌥ exist only on a Mac; elsewhere the same shortcut is Ctrl and Alt. A server component can&rsquo;t
                tell which the visitor has, so the client component that binds the shortcut picks the keys (and binds
                the same ones). A single key like <Mono>/</Mono> or <Mono>Esc</Mono> needs no choice: prefer one.
              </>
            ),
          },
          {
            term: "Touch",
            text: (
              <>
                <Mono>hideOnTouch</Mono> wherever the hint sits in a control (the search box): a phone has no keys to
                press. A sentence about shortcuts on a help page can stay.
              </>
            ),
          },
          {
            term: "No click",
            text: (
              <>
                No hover, press or focus, and the type leaves out <Mono>onClick</Mono> and <Mono>tabIndex</Mono>. Over
                an input (the search box) the input takes the click: place the Kbd with{" "}
                <Mono>pointer-events-none</Mono> on its wrapper.
              </>
            ),
          },
          {
            term: "className",
            text: (
              <>
                Margins and placement only. Never a height, colour, ring or radius: <Mono>cx</Mono> doesn&rsquo;t merge.
              </>
            ),
          },
        ]}
      />

      <Flow
        tree={`A key in the interface?
 ├── Something to click → Button, not a Kbd
 ├── One key: /, Esc, J → <Kbd>/</Kbd>
 │     (a named key → keys={["esc"]})
 ├── Keys pressed together → keys={["cmd", "k"]},
 │     Mac and Windows keys picked by the client
 │     component that binds them
 └── Keys one after another → two Kbds,
       "then" between them`}
      />

      <SheetSection
        title="Keys and sizes"
        description="One key, the named keys and combinations at both sizes. The last column is what a screen reader says."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(15rem,max-content)"
              template="minmax(7rem,max-content) minmax(7rem,max-content) minmax(12rem,1fr)"
              columns={["sm · 20", "md · 24", "read as"]}
              rows={KEYS.map((k) => ({
                label: k.label,
                sub: k.sub,
                cells: [
                  <span key="sm">{k.render("sm")}</span>,
                  <span key="md">{k.render("md")}</span>,
                  <span key="r" className="text-body-sm text-secondary-foreground">
                    &ldquo;{k.reads}&rdquo;
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="In use"
        description="Curatit's real shortcuts, where they're shown: in a control, in a help line, in a menu row. The search cap hides on touch screens."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(10rem,max-content)"
              template="minmax(18rem,max-content) minmax(14rem,1fr)"
              align="start"
              columns={["specimen", "written as"]}
              rows={[
                {
                  label: "SearchBox.tsx",
                  sub: "the search pill's hint",
                  cells: [
                    <span
                      key="s"
                      className="flex h-11 w-72 max-w-full items-center gap-3 rounded-full bg-component-on-container-subtle pr-3 pl-4 shadow-sm"
                    >
                      <Search className="size-4 shrink-0 text-tertiary-foreground" />
                      <span className="flex-1 truncate text-body-sm text-tertiary-foreground">
                        Search brands, categories or ideas
                      </span>
                      <Kbd hideOnTouch>/</Kbd>
                    </span>,
                    <Mono key="c">{"<Kbd hideOnTouch>/</Kbd>"}</Mono>,
                  ],
                },
                {
                  label: "a help line",
                  sub: "the review queue's J / K (ReviewPost.tsx binds them; nothing says so yet)",
                  cells: [
                    <p key="s" className="text-body-sm text-secondary-foreground">
                      Press <Kbd size="sm">J</Kbd> and <Kbd size="sm">K</Kbd> to step through the queue.
                    </p>,
                    <Mono key="c">{'<Kbd size="sm">J</Kbd>'}</Mono>,
                  ],
                },
                {
                  label: "a help line",
                  sub: "the post view's arrows and Esc (PostView.tsx)",
                  cells: [
                    <p key="s" className="flex flex-wrap items-center gap-1.5 text-body-sm text-secondary-foreground">
                      <Kbd size="sm" keys={["left"]} />
                      <Kbd size="sm" keys={["right"]} />
                      through slides, <Kbd size="sm" keys={["esc"]} /> to close
                    </p>,
                    <Mono key="c">{'<Kbd size="sm" keys={["left"]} />'}</Mono>,
                  ],
                },
                {
                  label: "a menu row",
                  sub: "a shortcut at the row's end (no menu has one yet)",
                  cells: [
                    <span
                      key="s"
                      className="flex w-64 max-w-full items-center justify-between gap-4 rounded-md px-2.5 py-2 text-body-sm text-primary-foreground"
                    >
                      Search the library
                      <Kbd size="sm" hideOnTouch>
                        /
                      </Kbd>
                    </span>,
                    <Mono key="c">{'<Kbd size="sm" hideOnTouch>/</Kbd>'}</Mono>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`<p className="text-body-sm text-secondary-foreground">
  Press <Kbd size="sm">J</Kbd> and <Kbd size="sm">K</Kbd> to step through the queue.
</p>

{/* In a control: hidden where there's no keyboard */}
<Kbd keys={isMac ? ["cmd", "k"] : ["ctrl", "k"]} hideOnTouch />`}
            incorrect={{
              why: "two keys in one cap, read as a symbol name; the cap by hand",
              code: `<Kbd>⌘K</Kbd>

<kbd className="absolute right-4 hidden h-6 min-w-6 items-center justify-center rounded-md px-1.5 font-sans text-caption text-secondary-foreground ring-1 ring-border-default md:flex">
  /
</kbd>`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
