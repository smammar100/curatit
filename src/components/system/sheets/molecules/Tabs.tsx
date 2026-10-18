// /system/tabs: the Tabs molecule (fundations/molecules/Tabs.tsx), live in both themes. The
// specimens are the real component, uncontrolled, so this sheet stays a server component; the
// one demo that needs state of its own is in ../../demos/TabsDemos.tsx
import Tabs, { Tab, TabList, TabPanel } from "@/components/fundations/molecules/Tabs";
import Briefcase from "@/components/fundations/icons/Briefcase";
import CreditCard from "@/components/fundations/icons/CreditCard";
import ForkKnife from "@/components/fundations/icons/ForkKnife";
import Sparkle from "@/components/fundations/icons/Sparkle";
import SquaresFour from "@/components/fundations/icons/SquaresFour";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";
import { KeyboardDemo } from "../../demos/TabsDemos";

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

const KEYS: { keys: string; does: string }[] = [
  { keys: "Tab", does: "Into the row: lands on the selected tab (the row's one tab stop). Out of it: to the panel's first focusable thing, or the panel itself when it has none" },
  { keys: "→ / ←", does: "The next or previous tab, wrapping at the ends and skipping disabled tabs. Automatic: it's selected too. The indicator and colours snap" },
  { keys: "Home / End", does: "The first or last enabled tab" },
  { keys: "Enter / Space", does: "Manual activation only: selects the focused tab (in automatic it already is)" },
  { keys: "Alt, Ctrl, Meta, Shift + any", does: "Left alone: Alt+← is the browser's Back" },
  { keys: "↑ / ↓", does: "Left alone, so the page still scrolls (the row is horizontal)" },
];

function Breakdown({ variant, size }: { variant: "underline" | "pill"; size: "md" | "lg" }) {
  return (
    <Tabs defaultValue="breakdown" className="w-full">
      <TabList aria-label="Creative breakdown" variant={variant} size={size}>
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
        lists. The row is one tab stop, the arrow keys walk along it, and the indicator slides for a pointer and
        snaps for a key.
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
                (/system/controls): it changes a value, not the view. Going to another page is a link: TextLink in a
                sentence, a nav row with <Mono>aria-current</Mono> for a set of pages (the topic row on this page). More
                than eight views, or long names, is a select.
              </>
            ),
          },
          {
            term: "Variants",
            text: (
              <>
                <Mono>underline</Mono> (the default) or <Mono>pill</Mono>. Nothing else exists. Underline heads a
                section or a card, its first label flush with the text below; pill is the dashboard&rsquo;s (the post
                panel, the review queue), where a thin line would get lost among covers. One variant per surface.
              </>
            ),
          },
          {
            term: "Sizes",
            text: (
              <>
                <Mono>md</Mono> (the default: underline 40px, pill 36px) or <Mono>lg</Mono> (44px, 40px), every label
                13px medium. lg for a row that heads a marketing page&rsquo;s section, md everywhere else. Under 44px a
                tab still reaches 44px on touch screens, through an invisible area, so nothing moves.
              </>
            ),
          },
          {
            term: "Labels",
            text: (
              <>
                One or two words, sentence case, no full stop. An <Mono>icon</Mono> goes before the label only when
                every tab in the row has one. A <Mono>count</Mono> after it is how many things the panel holds
                (Needs review 12), never a status.
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
                <Mono>automatic</Mono> (the default): selection follows focus. <Mono>manual</Mono>: the arrows move
                focus and Enter or Space selects. Manual only when showing a panel is slow (it renders a lot or fetches
                on show), so arrowing past it doesn&rsquo;t pay for it.
              </>
            ),
          },
          {
            term: "Disabled",
            text: (
              <>
                A view that exists but has nothing yet, and will; say why nearby. A view that never applies is left
                out: a single image has no Slides tab.
              </>
            ),
          },
          {
            term: "Keys",
            text: (
              <>
                The row marks every key it uses: <Mono>preventDefault</Mono>, and <Mono>stopPropagation</Mono> for
                React parents. A listener on the document (the post overlay&rsquo;s arrows, PostView.tsx) still
                receives it, because React runs from the document too, so it must return on{" "}
                <Mono>event.defaultPrevented</Mono>.
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
                layout, and <Mono>cx</Mono> doesn&rsquo;t merge.
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
      │    ├── heads a section or a card → variant="underline" (the default)
      │    └── on the dashboard's panels → variant="pill"
      └── more than 8 → a select above the view`}
      />

      <SheetSection
        title="Variants and sizes"
        description="The post panel's views in each look and size. Click a tab to watch the indicator slide; Tab into a row and use the arrows to see it snap."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(6rem,max-content)"
              columns={["md", "lg"]}
              align="start"
              rows={[
                {
                  label: "underline",
                  sub: "default",
                  cells: [
                    <Breakdown key="md" variant="underline" size="md" />,
                    <Breakdown key="lg" variant="underline" size="lg" />,
                  ],
                },
                {
                  label: "pill",
                  sub: "the dashboard's",
                  cells: [<Breakdown key="md" variant="pill" size="md" />, <Breakdown key="lg" variant="pill" size="lg" />],
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Counts, icons and a disabled tab"
        description="A count is the number of things in the panel, read with the label. Icons go on every tab or none. A disabled tab is skipped by the arrow keys and can't be clicked."
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
                  sub: "the review queue",
                  cells: [
                    <Tabs key="c" defaultValue="review" className="w-full">
                      <TabList aria-label="Lists" variant="pill">
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
        description="When the row doesn't fit it scrolls sideways (wheel, trackpad, a swipe, or the arrow keys) and fades the edge that has more beyond it, only while it does. On load the selected tab is scrolled clear of the fade: Sports starts selected here. Inside a Wrapper, bleed lets the row run to the screen's edges on phones."
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
        title="Keyboard"
        description="ARIA tabs with a roving tab stop. The demo switches activation and shows what a listener on the document sees, as the post overlay's arrows do."
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
              why: "the slide moves as well as the tab",
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
  <TabList aria-label="Creative breakdown" variant="pill">
    <Tab value="breakdown">Breakdown</Tab>
    <Tab value="visual">Visual DNA</Tab>
  </TabList>
  <TabPanel value="breakdown" className="mt-3">…</TabPanel>
  <TabPanel value="visual" className="mt-3">…</TabPanel>
</Tabs>`}
          incorrect={{
            why: "tabs that change the page, and a className restyling a tab",
            code: `<Tabs value={pathname} onValueChange={(href) => router.push(href)}>
  <TabList aria-label="Settings">
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
