// /system/controls: the shared Segmented and Switch (fundations/elements), live in both themes.
// The demos that need state of their own are client components in ../demos/ControlDemos.tsx; the
// uncontrolled specimens are rendered from here, so the sheet stays a server component. Every
// class is written out in full, never built from parts, so Tailwind sees it
import type { ReactNode } from "react";
import Segmented, { type SegmentedOption } from "@/components/fundations/elements/Segmented";
import CircleHalf from "@/components/fundations/icons/CircleHalf";
import Moon from "@/components/fundations/icons/Moon";
import Sun from "@/components/fundations/icons/Sun";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../SheetParts";
import { ControlledDemo, FieldDemo, KeyboardDemo, LabelledSwitch, SwitchState } from "../demos/ControlDemos";

type Size = "sm" | "md" | "lg";
type Shape = "rounded" | "pill";
type Tone = "raised" | "inverted";

const TILES: SegmentedOption<string>[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

// The account menu's theme options, as AccountMenu.tsx passes them
const THEMES: SegmentedOption<string>[] = [
  { value: "light", label: "Light", icon: <Sun className="size-4" /> },
  { value: "dark", label: "Dark", icon: <Moon className="size-4" /> },
  { value: "system", label: "Match system", icon: <CircleHalf className="size-4" /> },
];

// One, two or three upright bars: the grid size icons, drawn as Bars in AccountMenu.tsx draws them
function Bars({ count }: { count: number }) {
  return (
    <span aria-hidden="true" className="flex h-3.5 items-stretch gap-[3px]">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="w-[2px] rounded-full bg-current" />
      ))}
    </span>
  );
}

const GRID: SegmentedOption<string>[] = [
  { value: "large", label: "Large tiles", icon: <Bars count={1} /> },
  { value: "medium", label: "Medium tiles", icon: <Bars count={2} /> },
  { value: "small", label: "Small tiles", icon: <Bars count={3} /> },
];

// The matrix's rows: every size in both shapes, with the track's height (padding + option + padding)
const ROWS: { size: Size; shape: Shape; sub: string }[] = [
  { size: "sm", shape: "rounded", sub: "32px track · the default" },
  { size: "sm", shape: "pill", sub: "32px track" },
  { size: "md", shape: "rounded", sub: "40px track" },
  { size: "md", shape: "pill", sub: "40px track" },
  { size: "lg", shape: "rounded", sub: "44px track · not beside Button lg" },
  { size: "lg", shape: "pill", sub: "44px track" },
];

// The matrix's columns: both tones, with words and as icons
const COLUMNS: { tone: Tone; iconOnly: boolean; head: string }[] = [
  { tone: "raised", iconOnly: false, head: 'tone="raised"' },
  { tone: "inverted", iconOnly: false, head: 'tone="inverted"' },
  { tone: "raised", iconOnly: true, head: "iconOnly · raised" },
  { tone: "inverted", iconOnly: true, head: "iconOnly · inverted" },
];

function Note({ children }: { children: ReactNode }) {
  return <span className="text-body-sm text-secondary-foreground">{children}</span>;
}

/** A stack of class names or props, one per line */
function MonoList({ items }: { items: string[] }) {
  return (
    <span className="flex flex-col gap-0.5">
      {items.map((item) => (
        <Mono key={item}>{item}</Mono>
      ))}
    </span>
  );
}

// Segmented's parts, as Segmented.tsx builds them (sizes, shapes, tones)
const PARTS: { part: string; sub?: string; classes: string[]; note: ReactNode }[] = [
  {
    part: "track",
    classes: ["bg-component", "rounded-lg · pill: rounded-full", "p-0.5 at sm · p-1 at md and lg", "gap-0.5"],
    note: "The grey groove the options sit in, inline-flex and as wide as its options.",
  },
  {
    part: "option",
    classes: ["h-7 px-3 · h-8 px-3 · h-9 px-3.5", "iconOnly: size-7 · size-8 · size-9", "text-body-sm font-medium"],
    note: "28, 32 or 36px tall, 13px medium at every size, never wrapping. An icon-only option is a square.",
  },
  {
    part: "thumb",
    sub: "raised",
    classes: ["bg-component-on-container-subtle", "shadow-sm", "rounded-md · pill: rounded-full"],
    note: "A white control lifted by the default shadow. In dark mode the shadow is its inner highlight. In the rounded shape it's rounded-md at every size: right inside sm's 2px padding (8 − 2 = 6), 2px too round inside md's and lg's 4px (8 − 4 = 4 would be rounded-sm). A fix is requested in Segmented.tsx.",
  },
  {
    part: "thumb",
    sub: "inverted",
    classes: ["bg-inverted-solid"],
    note: "The primary button's fill: the loudest thing in its row.",
  },
  {
    part: "labels",
    classes: [
      "chosen: text-primary-foreground",
      "inverted: text-on-inverted-foreground",
      "the rest: text-secondary-foreground",
      "hover: text-primary-foreground",
    ],
    note: "The chosen label takes the thumb's ink: primary on raised, on-inverted on inverted. The weight never changes, so nothing reflows.",
  },
  {
    part: "focus",
    classes: ["outline-2 outline-offset-2", "outline-brand-border-focus"],
    note: "On the focused option, from the keyboard only, as on every control.",
  },
  {
    part: "motion",
    classes: [
      "transition-[translate,width,height]",
      "duration-200 ease-out-quint",
      "data-snap:transition-none",
      "motion-reduce:transition-none",
    ],
    note: (
      <>
        The thumb, through <Mono>useThumb</Mono>. It carries <Mono>data-theme-icon</Mono>, so it still slides while the
        theme switches and every other transition is frozen.
      </>
    ),
  },
];

// The places Segmented is used today, with the props each passes
const USES: { name: string; sub: string; specimen: ReactNode; props: string[]; where: ReactNode }[] = [
  {
    name: "Theme",
    sub: "account menu",
    specimen: (
      <Segmented
        aria-label="Theme, as in the account menu"
        iconOnly
        size="md"
        shape="pill"
        tone="inverted"
        defaultValue="system"
        options={THEMES}
      />
    ),
    props: ["iconOnly", 'size="md"', 'shape="pill"', 'tone="inverted"'],
    where: (
      <>
        The dashboard&rsquo;s account menu (AccountMenu.tsx), beside the row&rsquo;s word, Theme. The labels Light, Dark
        and Match system are the options&rsquo; names and tooltips.
      </>
    ),
  },
  {
    name: "Grid size",
    sub: "account menu",
    specimen: (
      <Segmented
        aria-label="Grid size, as in the account menu"
        iconOnly
        size="md"
        shape="pill"
        tone="inverted"
        defaultValue="medium"
        options={GRID}
      />
    ),
    props: ["iconOnly", 'size="md"', 'shape="pill"', 'tone="inverted"'],
    where: "The row under Theme: one, two or three bars for large, medium and small tiles.",
  },
  {
    name: "Expires in",
    sub: "API tokens",
    specimen: (
      <Segmented
        aria-label="Expires in, as in the token panel"
        size="lg"
        shape="pill"
        defaultValue="90"
        options={[
          { value: "30", label: "30 days" },
          { value: "90", label: "90 days" },
          { value: "180", label: "180 days" },
          { value: "365", label: "365 days" },
        ]}
      />
    ),
    props: ['size="lg"', 'shape="pill"', "aria-labelledby", 'className="mt-1"'],
    where: (
      <>
        The new token panel (ApiTokens.tsx), named by the visible &ldquo;Expires in&rdquo; above it. Read when the token is
        created.
      </>
    ),
  },
  {
    name: "Connect over",
    sub: "/agents",
    specimen: (
      <Segmented
        aria-label="Connect over, as on the MCP page"
        size="md"
        shape="pill"
        className="w-fit"
        defaultValue="mcp"
        options={[
          { value: "mcp", label: "MCP" },
          { value: "rest", label: "REST" },
        ]}
      />
    ),
    props: ['size="md"', 'shape="pill"', 'className="w-fit"'],
    where: (
      <>
        The MCP page&rsquo;s install block (ClientInstall.tsx), beside the client tabs. The panel below follows it, and
        it&rsquo;s still a Segmented: how you connect is a setting, not a section to visit.
      </>
    ),
  },
  {
    name: "Show specimens in",
    sub: "this page",
    specimen: (
      <Segmented
        aria-label="Show specimens in, as in this page's header"
        defaultValue="both"
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "both", label: "Both" },
        ]}
      />
    ),
    props: ["the defaults", "key, once the saved choice is read"],
    where: (
      <>
        This page&rsquo;s header (ThemeModeSwitch.tsx); this copy changes nothing. Remounted with a <Mono>key</Mono> once
        the saved choice is read, so the thumb starts there instead of sliding across on load.
      </>
    ),
  },
  {
    name: "Try a brief",
    sub: "homepage demo",
    specimen: (
      <div className="w-60">
        <Segmented
          aria-label="Try a brief, as in the homepage demo"
          tone="inverted"
          className="w-full *:flex-1 *:px-2"
          defaultValue="launch"
          options={[
            { value: "launch", label: "Launch" },
            { value: "how-to", label: "How-to" },
            { value: "case-study", label: "Case study" },
          ]}
        />
      </div>
    ),
    props: ['tone="inverted"', 'className="w-full *:flex-1 *:px-2"'],
    where: (
      <>
        The homepage&rsquo;s search demo (BriefTabs in DemoParts.tsx), stretched across its card. The thumb is absolute,
        so <Mono>*:flex-1</Mono> only grows the options.
      </>
    ),
  },
];

// Every prop each component declares. Segmented forwards any other attribute to its radiogroup
const SEGMENTED_PROPS: { name: string; values: string; fallback: string; note: ReactNode }[] = [
  {
    name: "options",
    values: "{ value, label, icon? }[]",
    fallback: "required",
    note: "Two to five. label is shown, or with iconOnly becomes the option's name and tooltip.",
  },
  { name: "value", values: "T", fallback: "–", note: "Controlled: the page owns the value. Pair it with onValueChange." },
  { name: "onValueChange", values: "(value: T) => void", fallback: "–", note: "Called on every change, controlled or not." },
  { name: "defaultValue", values: "T", fallback: "the first option", note: "Uncontrolled: where it starts." },
  {
    name: "aria-label",
    values: "string",
    fallback: "–",
    note: "The group's name. Pass this or aria-labelledby, always.",
  },
  { name: "aria-labelledby", values: "string", fallback: "–", note: "The id of a visible label that names the group." },
  { name: "size", values: '"sm" | "md" | "lg"', fallback: '"sm"', note: "Track 32, 40 or 44px tall." },
  { name: "shape", values: '"rounded" | "pill"', fallback: '"rounded"', note: "rounded-lg or rounded-full." },
  { name: "tone", values: '"raised" | "inverted"', fallback: '"raised"', note: "A white thumb, or the primary button's fill." },
  { name: "iconOnly", values: "boolean", fallback: "false", note: "Square options showing only their icons." },
  {
    name: "className",
    values: "string",
    fallback: "–",
    note: "On the track, for layout only: w-fit, a margin, w-full *:flex-1.",
  },
  {
    name: "anything else",
    values: "forwarded",
    fallback: "–",
    note: "Not in the types, but spread onto the radiogroup: the id, aria-describedby and aria-invalid that Field adds land there. Pass them through Field, not by hand.",
  },
];

const SWITCH_PROPS: { name: string; values: string; fallback: string; note: ReactNode }[] = [
  {
    name: "checked",
    values: "boolean",
    fallback: "required",
    note: "Always controlled: there's no defaultChecked.",
  },
  { name: "onCheckedChange", values: "(checked: boolean) => void", fallback: "required", note: "Called with the new state." },
  { name: "disabled", values: "boolean", fallback: "false", note: "Grey track, not focusable, can't be pressed." },
  {
    name: "id, aria-*",
    values: "button attributes",
    fallback: "–",
    note: "Every <button> attribute but onChange, value and role passes through: an id for <label htmlFor>, aria-labelledby, aria-describedby. Never onClick, type or aria-checked: they're spread after the switch's own and replace them, so the switch stops toggling, submits its form or announces the wrong state.",
  },
  { name: "className", values: "string", fallback: "–", note: "Layout only. Never a colour: cx doesn't merge, so it would land beside the track's own." },
];

function PropsMatrix({ rows }: { rows: typeof SEGMENTED_PROPS }) {
  return (
    <Matrix
      first="minmax(9rem,max-content)"
      template="minmax(12rem,max-content) minmax(8rem,max-content) minmax(18rem,1fr)"
      align="start"
      columns={["values", "default", "notes"]}
      rows={rows.map((p) => ({
        label: p.name,
        cells: [<Mono key="v">{p.values}</Mono>, <Mono key="d">{p.fallback}</Mono>, <Note key="n">{p.note}</Note>],
      }))}
    />
  );
}

/** One kind of state for a Segmented, in a card: its name, what it's for and the live specimen */
function StateCard({ name, children, demo }: { name: string; children: ReactNode; demo: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl bg-card p-5">
      <h4 className="font-mono text-caption-lg text-primary-foreground">{name}</h4>
      <p className="mt-1.5 text-body-sm text-secondary-foreground">{children}</p>
      <div className="mt-5">{demo}</div>
    </div>
  );
}

// The switch's thumb while held, drawn: 28px wide instead of 24, grown away from the edge it rests on
function PressedSwitches() {
  return (
    <span aria-hidden="true" className="flex gap-3">
      <span className="flex h-7 w-12 items-center rounded-full bg-component-active p-0.5">
        <span className="h-6 w-7 rounded-full bg-page shadow-sm" />
      </span>
      <span className="flex h-7 w-12 items-center justify-end rounded-full bg-inverted-solid p-0.5">
        <span className="h-6 w-7 rounded-full bg-page shadow-sm" />
      </span>
    </span>
  );
}

// The switch with its touch target drawn round it: before:-inset-2, a plain 64 × 44 box
function SwitchTarget() {
  return (
    <span aria-hidden="true" className="relative my-2 ml-2 flex h-7 w-12 items-center rounded-full bg-component-active p-0.5">
      <span className="size-6 rounded-full bg-page shadow-sm" />
      <span className="absolute -inset-2 outline-1 outline-border-strong outline-dashed" />
    </span>
  );
}

export default function Controls() {
  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-6">
        <SheetHeader title="Segmented and switch">
          Two shared controls for settings. Segmented picks one value out of two to five, all in view at once; Switch
          turns one setting on or off. Both change the moment they&rsquo;re used, and both work from the keyboard.
        </SheetHeader>
        {/* Shown by CSS alone, so it's in place before any script runs and nothing below it shifts */}
        <p className="hidden max-w-3xl rounded-xl bg-card px-4 py-3 text-body-sm text-secondary-foreground motion-reduce:block">
          Reduced motion is on, so the thumbs on this sheet jump instead of sliding, as they do across the site.
        </p>
      </div>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                <Mono>Segmented</Mono> for one value out of two to five, each a word or two, all in view at once: theme,
                grid size, token expiry, MCP or REST. <Mono>Switch</Mono> for one setting that&rsquo;s on or off: Share with
                a link.
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                Six values or more, labels that won&rsquo;t fit one row on a phone, or a list that grows (your boards): a
                native <Mono>&lt;select&gt;</Mono>, as the post panel&rsquo;s board picker (PostView.tsx). Panels of
                different content you move between: <Mono>Tabs</Mono> (fundations/molecules/Tabs.tsx), for views
                like the post panel&rsquo;s Breakdown and Visual DNA; the Tabs sheet. Several values at once: a{" "}
                <Mono>Checkbox</Mono> (fundations/elements/Checkbox.tsx) for each, in a fieldset, each in a{" "}
                <Mono>Field layout=&quot;inline&quot;</Mono>; the Checkbox sheet. Something that happens: a Button.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                With nothing passed, Segmented is <Mono>size=&quot;sm&quot;</Mono>, <Mono>shape=&quot;rounded&quot;</Mono>
                , <Mono>tone=&quot;raised&quot;</Mono>. Match the row it sits in: its track is as tall as a Button (sm 32,
                md 40, lg 44). The rounded track is <Mono>rounded-lg</Mono> at every size, the corners of Button sm and
                base, so lg is pill-only for now: Button lg is <Mono>rounded-xl</Mono>, and an lg rounded Segmented
                beside it wouldn&rsquo;t match. Switch has one size, 48 &times; 28.
              </>
            ),
          },
          {
            term: "At once",
            text: (
              <>
                Neither has a confirm step of its own. A setting takes effect as it&rsquo;s changed (theme, grid size);
                inside a form the value waits for the form&rsquo;s submit (token expiry, Share with a link). A Switch is a{" "}
                <Mono>&lt;button&gt;</Mono>, not an input, so a form never carries its value: keep it in state and read
                that on submit.
              </>
            ),
          },
          {
            term: "Names",
            text: (
              <>
                With a visible label, put it in a <Mono>Field</Mono>: a Switch in{" "}
                <Mono>layout=&quot;inline-end&quot;</Mono>, a Segmented in the default stacked layout. Field gives the
                control its id, <Mono>aria-labelledby</Mono> (a <Mono>&lt;label&gt;</Mono> can&rsquo;t name a Segmented)
                and <Mono>aria-describedby</Mono> for the description, so the name stays short. With no visible label, pass{" "}
                <Mono>aria-label</Mono>. Hand-wiring (<Mono>&lt;label htmlFor&gt;</Mono>, or{" "}
                <Mono>aria-labelledby</Mono> at a visible label) is what Field does for you; the token panel&rsquo;s
                &ldquo;Expires in&rdquo; and the new-board dialog still do it by hand. Every option has a <Mono>label</Mono>, with{" "}
                <Mono>iconOnly</Mono> too: it becomes the option&rsquo;s name and its tooltip.
              </>
            ),
          },
          {
            term: "Keyboard",
            text: (
              <>
                Segmented is a radio group: one tab stop, on the chosen option. The arrows move the choice and focus
                together, wrapping at the ends; Home and End go to the first and the last. A Switch is a button: Space and
                Enter flip it.
              </>
            ),
          },
          {
            term: "Motion",
            text: (
              <>
                The Segmented thumb slides 200ms on <Mono>ease-out-quint</Mono> for a pointer and snaps for a key, so a held
                arrow never queues slides. Nothing moves on load: until the thumb has measured, the chosen option wears its
                fill. The Switch thumb slides 200ms and, while pressed, stretches 4px toward the middle. Under reduced
                motion both jump; the press still widens the switch&rsquo;s thumb, at once.
              </>
            ),
          },
          {
            term: "Touch",
            text: (
              <>
                A Switch reaches past its track through <Mono>before:-inset-2</Mono>, a 64 &times; 44 target. Segmented has
                no touch extension: its options are their own targets, 28, 32 and 36px tall at sm, md and lg. Where phones
                use it, take the largest size its row allows.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                A checkbox styled as a switch: it announces itself as a checkbox while it looks like a switch, and
                it&rsquo;s a second recipe for the focus ring, the motion and the target. A Switch for two named values
                (Light or Dark, MCP or REST): off would have to stand for one of them, where a Segmented names both. A
                hand-made radio group, or a row of pressed buttons, for one choice. A colour through{" "}
                <Mono>className</Mono>: cx doesn&rsquo;t merge, so a second background lands beside the first.
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which control? (walk it top to bottom)
 ├── It does something (save, copy, delete) → Button
 ├── It moves between panels of different content,
 │   each its own section (Breakdown, Visual DNA) → Tabs
 ├── One setting, on or off → Switch
 ├── Several values at once → a Checkbox each,
 │   in a fieldset
 └── One value out of a set
      ├── Two to five, a word or two each, one row
      │   on a phone (MCP or REST, even though the
      │   panel below follows it) → Segmented
      └── Six or more, long labels, or a list that
          grows (boards) → <select>`}
        />
        <Flow
          tree={`Which Segmented?
 ├── size: the height of the buttons beside it
 │    ├── 32px, Button sm (this page) → sm, the default
 │    ├── 40px, Button base (the MCP page, a menu row)
 │    │    → md
 │    └── 44px, Button lg (the dashboard's forms) → lg,
 │        pill only (Button lg is rounded-xl)
 ├── shape: the corners beside it
 │    ├── rounded-lg buttons and fields (sm, md) →
 │    │   rounded, the default
 │    └── pills (the dashboard, the MCP tab row) → pill
 └── tone
      ├── a setting among fields or words → raised,
      │   the default
      └── icon-only options in a menu row, or a demo
          inside a card → inverted, never beside a
          default Button (two solid fills compete)`}
        />
      </div>

      <SheetSection
        id="segmented"
        title="Segmented"
        description="Every size and shape down, both tones with words and as icons across. Each one is live: click and the thumb slides; tab in and use the arrows and it snaps."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(8rem,max-content)"
              columns={COLUMNS.map((c) => c.head)}
              rows={ROWS.map((row) => ({
                label: `${row.size} · ${row.shape}`,
                sub: row.sub,
                cells: COLUMNS.map((column) =>
                  column.iconOnly ? (
                    <Segmented
                      key={column.head}
                      aria-label={`Theme, ${row.size} ${row.shape} ${column.tone}`}
                      iconOnly
                      size={row.size}
                      shape={row.shape}
                      tone={column.tone}
                      defaultValue="dark"
                      options={THEMES}
                    />
                  ) : (
                    <Segmented
                      key={column.head}
                      aria-label={`Tile size, ${row.size} ${row.shape} ${column.tone}`}
                      size={row.size}
                      shape={row.shape}
                      tone={column.tone}
                      defaultValue="medium"
                      options={TILES}
                    />
                  ),
                ),
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        id="parts"
        title="Parts"
        description="What Segmented is built from, as Segmented.tsx sets it. Take it whole: never rebuild one from these classes."
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
        id="keyboard"
        title="Keyboard and motion"
        description="Tab into it, then use the arrows, Home and End; then click. The line under it says how the last change arrived and what the thumb did."
      >
        <Sheet>
          {() => (
            <div className="grid items-start gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-10">
              <KeyboardDemo />
              <Matrix
                first="minmax(8rem,max-content)"
                template="minmax(16rem,1fr)"
                columns={["does"]}
                rows={[
                  { label: "Tab", cells: [<Note key="d">Lands on the chosen option. The group is one stop: Tab again leaves it.</Note>] },
                  {
                    label: "← ↑",
                    cells: [<Note key="d">The option before, wrapping from the first to the last. Focus and the choice move together.</Note>],
                  },
                  { label: "→ ↓", cells: [<Note key="d">The option after, wrapping from the last to the first.</Note>] },
                  { label: "Home, End", cells: [<Note key="d">The first option and the last.</Note>] },
                  {
                    label: "a key",
                    sub: "motion",
                    cells: [<Note key="d">The thumb and the colours change at once, so a held arrow never queues slides.</Note>],
                  },
                  {
                    label: "a pointer",
                    sub: "motion",
                    cells: [<Note key="d">The thumb slides, 200ms on ease-out-quint, and the labels&rsquo; colours fade over 150ms.</Note>],
                  },
                  {
                    label: "page load",
                    sub: "motion",
                    cells: [
                      <Note key="d">
                        Nothing moves. Until the thumb has measured (the server&rsquo;s HTML included), the chosen option
                        wears the thumb&rsquo;s fill.
                      </Note>,
                    ],
                  },
                  { label: "reduced motion", cells: [<Note key="d">The thumb jumps, however the change came.</Note>] },
                ]}
              />
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        id="state"
        title="Controlled or uncontrolled"
        description="Every Segmented in the product is controlled, because something else reads the value: the theme, the feed, a form. Uncontrolled is for a specimen nothing reads, like the ones on these sheets."
      >
        <div className="flex flex-col gap-8">
          <Sheet>
            {() => (
              <div className="grid gap-4 sm:grid-cols-2">
                <StateCard
                  name="defaultValue"
                  demo={<Segmented aria-label="Tile size, uncontrolled" defaultValue="medium" options={TILES} />}
                >
                  Uncontrolled: it keeps its own choice, and the page only says where it starts.
                </StateCard>
                <StateCard name="value + onValueChange" demo={<ControlledDemo />}>
                  Controlled: the page owns the value, reads it and can change it from outside, as Reset does.
                </StateCard>
              </div>
            )}
          </Sheet>
          <Code
            correct={`// Controlled: the page owns the value (AccountMenu.tsx)
<Segmented aria-label="Theme" value={theme} onValueChange={chooseTheme} options={…} />

// Uncontrolled: it owns the value; the page sets only where it starts
<Segmented aria-label="Tile size" defaultValue="medium" options={SIZES} />

// A value read after mount, like a saved choice: remount once it's known,
// so the thumb starts there (ThemeModeSwitch.tsx)
<Segmented key={restored ? "restored" : "initial"} value={mode} onValueChange={choose} options={…} />`}
            incorrect={{
              why: "a saved choice set after mount, so the thumb slides across as the page loads",
              code: `useEffect(() => setMode(localStorage.getItem("mode") ?? "both"), []);

<Segmented aria-label="Show specimens in" value={mode} onValueChange={choose} options={…} />`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="in-use"
        title="Segmented in use"
        description="Every place it's used today, live, with the props each one passes."
      >
        <div className="flex flex-col gap-8">
          <Sheet>
            {() => (
              <Matrix
                first="minmax(9rem,max-content)"
                template="minmax(16rem,max-content) minmax(13rem,max-content) minmax(16rem,1fr)"
                columns={["specimen", "props", "where"]}
                rows={USES.map((use) => ({
                  label: use.name,
                  sub: use.sub,
                  cells: [
                    <span key="s">{use.specimen}</span>,
                    <MonoList key="p" items={use.props} />,
                    <Note key="w">{use.where}</Note>,
                  ],
                }))}
              />
            )}
          </Sheet>
          <Code
            correct={`{/* ApiTokens.tsx: named by the visible label above it */}
<p id="token-days-label" className="text-caption font-medium text-secondary-foreground">
  Expires in
</p>
<Segmented
  aria-labelledby="token-days-label"
  size="lg"
  shape="pill"
  className="mt-1"
  value={String(days)}
  onValueChange={(value) => setDays(Number(value))}
  options={EXPIRY_DAYS.map((d) => ({ value: String(d), label: \`\${d} days\` }))}
/>`}
            incorrect={{
              why: "every option a tab stop, dead arrows, the browser's default focus ring instead of the system's (the account menu's own, before Segmented)",
              code: `<div role="radiogroup" aria-label={label} className="flex gap-0.5 rounded-full bg-base-100 p-1">
  {options.map((option) => (
    <button
      key={option.value}
      type="button"
      role="radio"
      aria-checked={option.value === value}
      aria-label={option.label}
      title={option.label}
      onClick={() => onChange(option.value)}
      className="flex size-8 items-center justify-center rounded-full text-base-500 transition-colors duration-150 hover:text-base-900 aria-checked:bg-base-900 aria-checked:text-white"
    >
      {option.icon}
    </button>
  ))}
</div>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="switch"
        title="Switch"
        description="One size, four looks. Flip the live ones; press and hold one to feel the stretch, drawn here as it looks while held."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(7rem,max-content)"
              template="minmax(8rem,max-content) minmax(16rem,max-content) minmax(16rem,1fr)"
              columns={["specimen", "classes", "notes"]}
              rows={[
                {
                  label: "off",
                  cells: [
                    <SwitchState key="s" label="Off example" />,
                    <MonoList key="c" items={["track: bg-component-active", "thumb: bg-page shadow-sm"]} />,
                    <Note key="n">The thumb, 24px, rests at the left.</Note>,
                  ],
                },
                {
                  label: "on",
                  cells: [
                    <SwitchState key="s" label="On example" defaultChecked />,
                    <MonoList key="c" items={["track: bg-inverted-solid", "translate-x-[calc(2.75rem-100%)]"]} />,
                    <Note key="n">
                      The track takes the primary button&rsquo;s fill. The thumb is placed by its own width (the
                      track&rsquo;s 44px inside, less 100%), so a press can grow it leftward.
                    </Note>,
                  ],
                },
                {
                  label: "pressed",
                  sub: "drawn",
                  cells: [
                    <PressedSwitches key="s" />,
                    <MonoList key="c" items={["group-active/switch:w-7"]} />,
                    <Note key="n">
                      24 to 28px wide while held, toward the middle: the edge it rests on stays put, off or on.
                    </Note>,
                  ],
                },
                {
                  label: "disabled",
                  cells: [
                    <span key="s" className="flex gap-3">
                      <SwitchState label="Disabled example, off" disabled />
                      <SwitchState label="Disabled example, on" defaultChecked disabled />
                    </span>,
                    <MonoList key="c" items={["track: bg-disabled", "disabled:cursor-not-allowed"]} />,
                    <Note key="n">
                      Grey either way, so only the thumb&rsquo;s side says on or off. It can&rsquo;t be focused or pressed.
                    </Note>,
                  ],
                },
                {
                  label: "target",
                  sub: "drawn",
                  cells: [
                    <SwitchTarget key="s" />,
                    <MonoList key="c" items={["h-7 w-12 p-0.5 rounded-full", "before:absolute before:-inset-2"]} />,
                    <Note key="n">48 &times; 28 to the eye, a 64 &times; 44 target for a finger.</Note>,
                  ],
                },
                {
                  label: "focus",
                  cells: [
                    <Note key="s">Tab to one above</Note>,
                    <MonoList key="c" items={["outline-2 outline-offset-2", "outline-brand-border-focus"]} />,
                    <Note key="n">From the keyboard only, as on every control.</Note>,
                  ],
                },
                {
                  label: "motion",
                  cells: [
                    <Note key="s">Flip one above</Note>,
                    <MonoList
                      key="c"
                      items={[
                        "track: transition-colors duration-150",
                        "thumb: transition-[translate,width]",
                        "duration-[200ms,150ms] ease-out-quint",
                        "motion-reduce:transition-none",
                      ]}
                    />,
                    <Note key="n">
                      The track&rsquo;s colour fades 150ms; the thumb slides 200ms and stretches 150ms, all on
                      ease-out-quint. Under reduced motion the thumb jumps; the colour still fades.
                    </Note>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        id="switch-names"
        title="Naming a switch or a Segmented"
        description="Neither has words of its own. Give each a label in a Field, and let a tap on the words flip a switch too."
      >
        <div className="flex flex-col gap-8">
          <Sheet>
            {() => (
              <div className="grid gap-4 sm:grid-cols-2">
                <StateCard name="<Field>" demo={<FieldDemo />}>
                  The recipe. The label names the control, the description describes it, and Field wires both. Inside a
                  form, the values are read from state on submit.
                </StateCard>
                <StateCard name="<label htmlFor>" demo={<LabelledSwitch />}>
                  By hand, what Field writes for you: the words are the switch&rsquo;s name. Click them and it flips.
                </StateCard>
              </div>
            )}
          </Sheet>
          <Code
            correct={`{/* A Switch: label first, the switch at the end; a tap on the words flips it */}
<Field label="Share with a link" layout="inline-end" description="Anyone with the link can view it, read-only">
  <Switch checked={shared} onCheckedChange={setShared} />
</Field>

{/* A Segmented: stacked, so the label sits above; Field names it with aria-labelledby */}
<Field label="Expires in">
  <Segmented size="lg" shape="pill" value={days} onValueChange={setDays} options={…} />
</Field>`}
            incorrect={{
              why: "its own switch: the browser's default focus ring instead of the system's, no press, weak curves (the new-board dialog's, before Switch)",
              code: `<button
  type="button"
  role="switch"
  aria-checked={on}
  aria-labelledby={labelledBy}
  onClick={() => onChange(!on)}
  className={cx(
    "relative flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-150 before:absolute before:-inset-2",
    on ? "bg-base-900" : "bg-base-200",
  )}
>
  <span className={cx("size-6 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none", on && "translate-x-5")} />
</button>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="props"
        title="Props"
        description="Everything each one declares. Segmented forwards any other attribute to its radiogroup; Switch passes on a <button>'s own attributes."
      >
        <Sheet>
          {() => (
            <div className="flex flex-col gap-8">
              <div>
                <Mono tone="primary">Segmented</Mono>
                <div className="mt-3">
                  <PropsMatrix rows={SEGMENTED_PROPS} />
                </div>
              </div>
              <div>
                <Mono tone="primary">Switch</Mono>
                <div className="mt-3">
                  <PropsMatrix rows={SWITCH_PROPS} />
                </div>
              </div>
            </div>
          )}
        </Sheet>
      </SheetSection>
    </div>
  );
}
