// /system/tabs: the Tabs molecule (fundations/molecules/Tabs.tsx), live in both themes. Since
// 2026-10-23 the row is Fluid Functionalism's TabsSubtle (src/components/ui/tabs-subtle.tsx, on
// Radix's tabs) behind the same compound API. The specimens are the real component, uncontrolled,
// so this sheet stays a server component; the one demo that needs state of its own is in
// ../../demos/TabsDemos.tsx. Every class is written out in full, never built from parts, so
// Tailwind sees it
import type { ReactNode } from "react";
import Tabs, { Tab, TabList, TabPanel } from "@/components/fundations/molecules/Tabs";
import Briefcase from "@/components/fundations/icons/Briefcase";
import CreditCard from "@/components/fundations/icons/CreditCard";
import ForkKnife from "@/components/fundations/icons/ForkKnife";
import Sparkle from "@/components/fundations/icons/Sparkle";
import SquaresFour from "@/components/fundations/icons/SquaresFour";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";
import { KeyboardDemo } from "../../demos/TabsDemos";

function Note({ children }: { children: ReactNode }) {
  return <span className="text-body-sm text-secondary-foreground">{children}</span>;
}

function MonoList({ items }: { items: string[] }) {
  return (
    <span className="flex flex-col gap-0.5">
      {items.map((item) => (
        <Mono key={item}>{item}</Mono>
      ))}
    </span>
  );
}

// The post panel's views, with a line of what each holds
const BREAKDOWN = [
  { value: "breakdown", label: "Breakdown", line: "The strategy, the traits and the key decisions." },
  { value: "visual", label: "Visual DNA", line: "Composition, type, colour and imagery." },
  { value: "slides", label: "Slides", line: "One row per slide, in order." },
];
// The review queue's lists and their counts
const QUEUE = [
  { value: "review", label: "Needs review", count: 12 },
  { value: "failed", label: "Failed", count: 2 },
  { value: "published", label: "Published", count: 162 },
  { value: "runs", label: "Recent runs" },
];
// Discover's categories (src/lib/categories.ts), with their icons (dashboard/categoryIcons.ts)
const CATEGORIES = [
  { value: "all", label: "All", icon: <SquaresFour /> },
  { value: "ai", label: "AI", icon: <Sparkle /> },
  { value: "business", label: "Business", icon: <Briefcase /> },
  { value: "finance", label: "Finance", icon: <CreditCard /> },
  { value: "food-drink", label: "Food & Drink", icon: <ForkKnife /> },
];
const MANY = [
  "All",
  "AI",
  "Business",
  "Crypto & Web3",
  "Finance",
  "Food & Drink",
  "Lifestyle",
  "Productivity",
  "Shopping",
  "Sports",
  "Travel & Transportation",
];

// The row's parts, as the library's TabsSubtle and TabsSubtleItem draw them under Tabs.tsx
const PARTS: { part: string; sub?: string; classes: string[]; note: ReactNode }[] = [
  {
    part: "row",
    sub: "TabList",
    classes: [
      'Radix Tabs.Root asChild + Tabs.List · role="tablist"',
      "relative flex items-center select-none",
      "overflow-x-auto scrollbar-hide max-w-[calc(100%_+_8px)]",
      "-mx-1 px-1 -my-1 py-1",
    ],
    note: "One div, Radix's root and list merged. It scrolls sideways when the tabs don't fit, with the platform scrollbar hidden; the 4px of negative margin and padding give the focus ring, which sits 2px outside a tab, room to draw without being clipped. wrap adds flex-wrap overflow-visible; bleed adds -mx-4 px-4 sm:-mx-8 sm:px-8.",
  },
  {
    part: "tab",
    classes: [
      'Radix Tabs.Trigger · <button type="button"> · role="tab"',
      "relative z-10 flex items-center cursor-pointer",
      "bg-transparent border-none outline-none",
      "h-7 px-2.5 gap-1 rounded-[20px]",
      "shrink-0 whitespace-nowrap",
    ],
    note: "A 28px pill, the compact control height, with 10px sides and no fill of its own: every fill is one of the three overlays below, so the tab itself never changes shape. Radix wires aria-selected, aria-controls and the roving tabindex.",
  },
  {
    part: "label",
    classes: [
      "inline-grid whitespace-nowrap",
      "text-[length:var(--fs-body-compact,12px)] leading-[var(--lh-body-compact,18px)]",
      "text-muted-foreground · hovered or selected: text-foreground",
      "transition-[color,font-variation-settings] duration-80",
      "selected · 'wght' 550, 'opsz' 18",
    ],
    note: "Grey at rest, the ink when hovered or selected. The selected label gets heavier without moving its neighbours: an invisible semibold copy of the same words sits underneath (aria-hidden, [text-box:trim-both_cap_alphabetic]) and fixes the tab's width.",
  },
  {
    part: "count",
    classes: ["ml-1.5 tabular-nums", "'wght' 400, 'opsz' 14"],
    note: "After the label in the normal weight whatever the tab's state, so a selected tab's number doesn't thicken; tabular figures so 12 and 162 line up.",
  },
  {
    part: "icon",
    classes: ["inline-flex shrink-0 [&>svg]:size-full · 14px", "text-muted-foreground · hovered or selected: text-foreground"],
    note: "Before the label, decorative, in the label's colour. On every tab in a row or on none.",
  },
  {
    part: "selected pill",
    classes: ["absolute bg-active pointer-events-none rounded-[20px]", "travel · spring.moderate (160ms, critically damped)", "opacity 1 · 0.8 while another tab is hovered"],
    note: "The pressed fill (7% of the ink, 10% white in dark) under the selected tab. It travels to the next choice on the moderate spring, landing with no overshoot, and dims a little while the pointer previews another tab.",
  },
  {
    part: "hover pill",
    classes: ["absolute bg-active pointer-events-none rounded-[20px]", "opacity 0.4", "in and travel · spring.fast · leave · back to the selected tab on spring.moderate"],
    note: "The same fill at 40%, the library's fluid hover: it fades in from the selected tab, glides to the tab nearest the pointer, and when the pointer leaves the row slides back to the selected tab as it fades (or just fades, if focus is still in the row). Never over the selected tab itself.",
  },
  {
    part: "focus ring",
    classes: ["absolute pointer-events-none z-20 rounded-[22px]", "border border-[color:var(--focus-ring,#6B97FF)]", "2px outside the tab · spring.fast"],
    note: "One ring for the whole row, drawn only for focus-visible (a click shows none), that springs from tab to tab as the arrows move focus. The brand colour, concentric with the pill.",
  },
  {
    part: "panel",
    sub: "TabPanel",
    classes: ['role="tabpanel" · aria-labelledby', "hidden unless selected, always in the HTML", "rounded-[8px] outline-none", "focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"],
    note: "Stays mounted so a view keeps its state; a tab stop only when it holds nothing focusable, with the site's focus outline when it is one.",
  },
];

const KEYS: { keys: string; does: string }[] = [
  { keys: "Tab", does: "Into the row: lands on the selected tab (the row's one tab stop, Radix's roving tabindex). Out of it: to the panel's first focusable thing, or the panel itself when it has none" },
  { keys: "→ / ←", does: "Move focus to the next or previous tab, wrapping at the ends and skipping disabled tabs. Nothing is selected yet: activation is manual. The ring springs along; the pills stay" },
  { keys: "Home / End", does: "Focus on the first or last enabled tab" },
  { keys: "Enter / Space", does: "Selects the focused tab: the selected pill travels there and the label thickens" },
  { keys: "Alt, Ctrl, Meta, Shift + an arrow", does: "Left alone by Radix: Alt+← is the browser's Back" },
  { keys: "↑ / ↓", does: "Left alone, so the page still scrolls (the row is horizontal)" },
];

function Breakdown() {
  return (
    <Tabs defaultValue="breakdown" className="w-full">
      <TabList aria-label="Creative breakdown">
        {BREAKDOWN.map((v) => (
          <Tab key={v.value} value={v.value}>
            {v.label}
          </Tab>
        ))}
      </TabList>
      {BREAKDOWN.map((v) => (
        <TabPanel key={v.value} value={v.value} className="mt-2 text-body-sm text-secondary-foreground">
          {v.line}
        </TabPanel>
      ))}
    </Tabs>
  );
}

function Panels({ items }: { items: { value: string; label: string }[] }) {
  return items.map((v) => (
    <TabPanel key={v.value} value={v.value} className="mt-2 text-body-sm text-secondary-foreground">
      {v.label}: its posts would be here.
    </TabPanel>
  ));
}

export default function TabsSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Tabs">
        Views of the same thing, one at a time: a post&rsquo;s breakdown and its visual DNA, the review queue&rsquo;s
        lists. Since 2026-10-23 the row is Fluid Functionalism&rsquo;s subtle tabs on Radix&rsquo;s: each tab a 28px
        pill, the selected one on a pressed fill that travels to the next choice, a faint hover pill that previews a
        click, and one focus ring that springs between tabs from the keyboard.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                Two to eight views of one thing that a person looks at one at a time and switches between: Breakdown
                and Visual DNA in the post panel, the review queue&rsquo;s lists. Every <Mono>Tab</Mono> has a{" "}
                <Mono>TabPanel</Mono> with the same <Mono>value</Mono>.
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                A setting with two to five short values (theme, grid size, MCP or REST) is Segmented
                (/system/controls): it changes a value, not the view, and sits on a track. Going to another page is a
                link: TextLink in a sentence, a nav row with <Mono>aria-current</Mono> for a set of pages (the topic row
                on this page). More than eight views, or long names, is a select.
              </>
            ),
          },
          {
            term: "One look",
            text: (
              <>
                Every row is the library&rsquo;s pills at the compact size: 28px tabs, 12px labels, the selected one
                on <Mono>bg-active</Mono>. <Mono>variant</Mono> (<Mono>underline</Mono> or <Mono>pill</Mono>) and{" "}
                <Mono>size</Mono> (<Mono>md</Mono> or <Mono>lg</Mono>) are still accepted for the call sites that pass
                them and change nothing; don&rsquo;t pass them in new code. Under 44px a tab is still a 28px target:
                keep rows out of the way of thumbs, or give them room.
              </>
            ),
          },
          {
            term: "Motion",
            text: (
              <>
                Three overlays the library springs between measured tabs, never the tabs themselves: the selected
                fill on <Mono>spring.moderate</Mono> (160ms, lands with no overshoot), the hover fill on{" "}
                <Mono>spring.fast</Mono> (80ms) sliding back to the selected tab when the pointer leaves, the focus
                ring on <Mono>spring.fast</Mono>. Labels change colour and weight over 80ms. Under reduced motion the
                travel is dropped and the fades stay.
              </>
            ),
          },
          {
            term: "Wrap",
            text: (
              <>
                By default a row that doesn&rsquo;t fit scrolls sideways with its scrollbar hidden (there is no edge
                fade). <Mono>wrap</Mono> breaks it onto more lines instead, for a pill row whose counts make it long
                (the review queue); the pills follow the selected tab to its line. <Mono>bleed</Mono> runs the row to
                the screen&rsquo;s edges inside a Wrapper. Never both.
              </>
            ),
          },
          {
            term: "Labels",
            text: (
              <>
                One or two words, sentence case, no full stop. An <Mono>icon</Mono> goes before the label only when
                every tab in the row has one. A <Mono>count</Mono> after it is how many things the panel holds
                (Needs review 12), never a status; it stays in the normal weight when the label thickens.
              </>
            ),
          },
          {
            term: "Panels",
            text: (
              <>
                Hidden unless selected, and always in the HTML. A panel is a tab stop only when it holds nothing
                focusable: Tab from the row goes to its first link or button, or to the panel itself when it&rsquo;s
                only text. TabPanel works that out (again whenever its content changes); <Mono>tabIndex</Mono>{" "}
                overrides it.
              </>
            ),
          },
          {
            term: "Activation",
            text: (
              <>
                Manual, always: the arrows move focus and the ring, Enter or Space selects. The library chose it so
                arrowing along a row never pays for a view it didn&rsquo;t want. <Mono>activation</Mono> is accepted
                for older call sites and ignored.
              </>
            ),
          },
          {
            term: "Disabled",
            text: (
              <>
                A view that exists but has nothing yet, and will; say why nearby. The arrows skip it and the hover pill
                never lands on it. A view that never applies is left out: a single image has no Slides tab.
              </>
            ),
          },
          {
            term: "Keys",
            text: (
              <>
                Radix marks every arrow key it uses with <Mono>preventDefault</Mono>. A listener on the document (the
                post overlay&rsquo;s arrows, PostView.tsx) still receives it, because React runs from the document
                too, so it must return on <Mono>event.defaultPrevented</Mono>.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                Tabs as a stepper (steps happen in order; tabs say any order is fine). Tabs that change the page (links
                with <Mono>aria-current</Mono>). A tab that does something: Copy brief is a Button beside the row. Tabs
                inside a tab panel. A <Mono>className</Mono> that sets a colour, height or padding: it&rsquo;s for
                layout only.
              </>
            ),
          },
        ]}
      />

      <Flow
        tree={`Tabs, Segmented, links or a select?
 ├── It goes to another page (the address changes)
 │     → links: TextLink in a sentence, a nav row with aria-current for a set of pages
 ├── Steps that happen in order → not tabs: one step on screen with Back and Next
 ├── It picks a value for a setting
 │    ├── 2 to 5 short values, all shown → Segmented (/system/controls)
 │    └── more, or long labels → a select
 └── Views of the same thing, seen one at a time
      ├── 2 to 8 short names → Tabs
      └── more than 8 → a select above the view`}
      />

      <SheetSection
        title="The row"
        description="The post panel's views. Move the pointer along the row to see the hover pill glide and the selected one dim; click a tab and the selected fill travels; Tab into the row and use the arrows to watch the ring spring between tabs, then Enter to select."
      >
        <Sheet split>{() => <Breakdown />}</Sheet>
      </SheetSection>

      <SheetSection
        title="Counts, icons and a disabled tab"
        description="A count is the number of things in the panel, read with the label and kept in the normal weight. Icons go on every tab or none. A disabled tab is skipped by the arrow keys and the hover pill, and can't be clicked."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(6rem,max-content)"
              template="minmax(max-content,1fr)"
              columns={["specimen"]}
              align="start"
              rows={[
                {
                  label: "count",
                  sub: "the review queue, wrap",
                  cells: [
                    <Tabs key="c" defaultValue="review" className="w-full">
                      <TabList aria-label="Lists" wrap>
                        {QUEUE.map((v) => (
                          <Tab key={v.value} value={v.value} count={v.count}>
                            {v.label}
                          </Tab>
                        ))}
                      </TabList>
                      <Panels items={QUEUE} />
                    </Tabs>,
                  ],
                },
                {
                  label: "icon",
                  sub: "Discover's categories",
                  cells: [
                    <Tabs key="i" defaultValue="all" className="w-full">
                      <TabList aria-label="Categories">
                        {CATEGORIES.map((v) => (
                          <Tab key={v.value} value={v.value} icon={v.icon}>
                            {v.label}
                          </Tab>
                        ))}
                      </TabList>
                      <Panels items={CATEGORIES} />
                    </Tabs>,
                  ],
                },
                {
                  label: "disabled",
                  sub: "nothing there yet",
                  cells: [
                    <Tabs key="d" defaultValue="breakdown" className="w-full">
                      <TabList aria-label="Creative breakdown">
                        {BREAKDOWN.map((v) => (
                          <Tab key={v.value} value={v.value} disabled={v.value === "visual"}>
                            {v.label}
                          </Tab>
                        ))}
                      </TabList>
                      <Panels items={BREAKDOWN} />
                    </Tabs>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Many tabs"
        description="When the row doesn't fit it scrolls sideways (wheel, trackpad, a swipe, or the arrow keys moving focus), its scrollbar hidden. Sports starts selected here. Inside a Wrapper, bleed lets the row run to the screen's edges on phones."
      >
        <Sheet split>
          {() => (
            <Tabs defaultValue="Sports" className="max-w-md">
              <TabList aria-label="Categories">
                {MANY.map((name) => (
                  <Tab key={name} value={name}>
                    {name}
                  </Tab>
                ))}
              </TabList>
              <Panels items={MANY.map((name) => ({ value: name, label: name }))} />
            </Tabs>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Anatomy"
        description="What the library draws under Tabs.tsx. Take the component whole: never rebuild a row from these classes."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(7rem,max-content)"
              template="minmax(17rem,max-content) minmax(16rem,1fr)"
              align="start"
              columns={["classes", "notes"]}
              rows={PARTS.map((p) => ({
                label: p.part,
                sub: p.sub,
                cells: [<MonoList key="c" items={p.classes} />, <Note key="n">{p.note}</Note>],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Keyboard"
        description="Radix's ARIA tabs with a roving tab stop and manual activation. The demo shows what a listener on the document sees, as the post overlay's arrows do. Its Activation switch is left over from the earlier build and changes nothing: the row is always manual."
      >
        <Sheet>
          {() => (
            <div className="flex flex-col gap-10">
              <Matrix
                first="minmax(9rem,max-content)"
                template="minmax(18rem,1fr)"
                columns={["does"]}
                rows={KEYS.map((k) => ({
                  label: k.keys,
                  cells: [
                    <span key="d" className="text-body-sm text-secondary-foreground">
                      {k.does}
                    </span>,
                  ],
                }))}
              />
              <KeyboardDemo />
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`// A parent's own arrow keys, on the document (PostView.tsx): skip what the tabs used
const onKey = (event: KeyboardEvent) => {
  if (event.defaultPrevented) return;
  if (event.key === "ArrowRight") nextSlide();
};
document.addEventListener("keydown", onKey);`}
            incorrect={{
              why: "the slide moves as well as the focus",
              code: `const onKey = (event: KeyboardEvent) => {
  if (event.key === "ArrowRight") nextSlide();
};
document.addEventListener("keydown", onKey);`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection title="In code" description="A Tab and a TabPanel for every view, one value each; className is for layout only.">
        <Code
          correct={`import Tabs, { Tab, TabList, TabPanel } from "@/components/fundations/molecules/Tabs";

<Tabs value={view} onValueChange={setView}>
  <TabList aria-label="Creative breakdown">
    <Tab value="breakdown">Breakdown</Tab>
    <Tab value="visual">Visual DNA</Tab>
  </TabList>
  <TabPanel value="breakdown" className="mt-3">…</TabPanel>
  <TabPanel value="visual" className="mt-3">…</TabPanel>
</Tabs>`}
          incorrect={{
            why: "tabs that change the page, a variant that no longer exists, and a className restyling a tab",
            code: `<Tabs value={pathname} onValueChange={(href) => router.push(href)}>
  <TabList aria-label="Settings" variant="underline" size="lg">
    <Tab value="/dashboard/settings/profile">Profile</Tab>
    <Tab value="/dashboard/settings/tokens" className="h-12 text-brand-foreground">
      API tokens
    </Tab>
  </TabList>
</Tabs>`,
          }}
        />
      </SheetSection>
    </div>
  );
}
