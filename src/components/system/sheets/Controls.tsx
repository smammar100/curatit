// /system/controls: the shared Segmented and Switch (fundations/elements), live in both themes.
// Since 2026-10-23 both are wrappers over Fluid Functionalism: Segmented over its Tabs
// (src/components/ui/tabs.tsx, the library's segmented control), Switch over its Switch
// (src/components/ui/switch.tsx). The demos that need state of their own are client components in
// ../demos/ControlDemos.tsx; the uncontrolled specimens are rendered from here, so the sheet stays
// a server component. Every class is written out in full, never built from parts, so Tailwind
// sees it
import type { ReactNode } from "react";
import Segmented, { type SegmentedOption } from "@/components/fundations/elements/Segmented";
import CircleHalf from "@/components/fundations/icons/CircleHalf";
import Moon from "@/components/fundations/icons/Moon";
import Sun from "@/components/fundations/icons/Sun";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../SheetParts";
import { ControlledDemo, FieldDemo, KeyboardDemo, LabelledSwitch, SwitchState } from "../demos/ControlDemos";

type Size = "sm" | "md" | "lg";

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

// The matrix's rows: the three size names, all on the library's compact step, with the track's height
// (padding + option + padding). Shape and tone are no longer rows: every control is a pill with
// the raised thumb
const ROWS: { size: Size; sub: string }[] = [
  { size: "sm", sub: "compact · 28px track, 24px options · the default" },
  { size: "md", sub: "compact · the same as sm" },
  { size: "lg", sub: "compact · the same as sm, kept for call sites" },
];

// The matrix's columns: with words, with an icon beside each word, and as icons alone
const COLUMNS: { kind: "words" | "icons" | "iconOnly"; head: string }[] = [
  { kind: "words", head: "words" },
  { kind: "icons", head: "icon + word" },
  { kind: "iconOnly", head: "iconOnly" },
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

// Segmented's parts, as the library's tabs.tsx builds them for the compact step, the one every
// size name of Segmented.tsx resolves to
const PARTS: { part: string; sub?: string; classes: string[]; note: ReactNode }[] = [
  {
    part: "track",
    sub: "TabsList",
    classes: [
      "relative inline-flex items-center select-none bg-muted",
      "p-0.5",
      "rounded-[24px]",
    ],
    note: "The muted groove the options sit in, inline-flex and as wide as its options. Padding plus option adds up to the step's control height (28px), so it lines up with the buttons and fields beside it.",
  },
  {
    part: "option",
    sub: "TabItem",
    classes: [
      "relative z-10 flex items-center px-3 cursor-pointer bg-transparent border-none outline-none",
      "h-6 gap-1",
      "iconOnly: justify-center px-0 w-6",
    ],
    note: "24px tall, transparent: the pills below it draw every state. An icon-only option is a square, with its label kept for screen readers (sr-only) and as its title.",
  },
  {
    part: "label",
    classes: [
      "inline-grid whitespace-nowrap",
      "text-[length:var(--fs-body-compact,12px)] leading-[var(--lh-body-compact,18px)]",
      "transition-[color,font-variation-settings] duration-80",
    ],
    note: (
      <>
        The chosen label is semibold through <Mono>fontVariationSettings</Mono> (<Mono>&apos;wght&apos; 550,
        &apos;opsz&apos; 18</Mono>; the rest <Mono>400, 14</Mono>), and an invisible semibold copy under it reserves
        the width, so nothing reflows. Chosen or hovered it&rsquo;s <Mono>text-foreground</Mono>, otherwise{" "}
        <Mono>text-muted-foreground</Mono>, over 80ms.
      </>
    ),
  },
  {
    part: "thumb",
    sub: "the selection",
    classes: ["absolute pointer-events-none", "bg-surface-4 shadow-surface-4", "rounded-[20px]"],
    note: (
      <>
        A raised surface, not a tint: three steps up the surface ladder from what the control sits on (surface 4 on the
        page, up to 8 inside a dialog), so it lifts off the muted track in both themes. It travels on{" "}
        <Mono>spring.moderate</Mono> (160ms, no overshoot) and dims to 0.85 while another option is hovered.
      </>
    ),
  },
  {
    part: "hover pill",
    classes: ["absolute pointer-events-none bg-hover", "rounded-[20px]", "opacity 0.4"],
    note: (
      <>
        Born at the thumb and sliding out to the option under the pointer on <Mono>spring.fast</Mono> (80ms), so the
        preview reads as leaving the current choice; it follows the nearest option sideways, so the track&rsquo;s padding
        never leaves it without a target. When the pointer leaves it slides back into the thumb; over the chosen option
        it fades where it is.
      </>
    ),
  },
  {
    part: "icon",
    classes: ["14px · lg: 16px", "transition-[color,stroke-width] duration-80"],
    note: "Sized by the library whatever it was given, and coloured with its label: the ink when chosen or hovered, muted otherwise. The stroke-width change is for stroked icons; the site's Phosphor bold files are filled paths, so it shows nothing here.",
  },
  {
    part: "focus",
    classes: [
      "absolute pointer-events-none z-20",
      "border border-[color:var(--focus-ring,#6B97FF)]",
      "rounded-[22px]",
    ],
    note: (
      <>
        One ring for the whole control, drawn 2px outside the focused option and springing between options on{" "}
        <Mono>spring.fast</Mono>. Only when the option matches <Mono>:focus-visible</Mono>, so a click leaves none.{" "}
        <Mono>--focus-ring</Mono> is Curatit&rsquo;s terracotta.
      </>
    ),
  },
  {
    part: "motion",
    classes: ["spring.moderate: 160ms, bounce 0", "spring.fast: 80ms, bounce 0", "MotionConfig reducedMotion=\"user\""],
    note: (
      <>
        The thumb on the moderate spring, the hover pill and the ring on the fast one, every fade a plain 80ms (60ms on
        the way out). Each Segmented wraps itself in the library&rsquo;s <Mono>MotionConfig</Mono>, so under reduced
        motion the pills jump (motion makes left, top, width and height instant) while the fades still run.
      </>
    ),
  },
];

// The places Segmented is used today, with the props each passes. shape and tone are still
// written at some call sites; both are accepted and ignored
const USES: { name: string; sub: string; specimen: ReactNode; props: string[]; where: ReactNode }[] = [
  {
    name: "Theme",
    sub: "account menu",
    specimen: (
      <Segmented aria-label="Theme, as in the account menu" iconOnly size="md" defaultValue="system" options={THEMES} />
    ),
    props: ["iconOnly", 'size="md"', 'shape="pill" · ignored', 'tone="inverted" · ignored'],
    where: (
      <>
        The dashboard&rsquo;s account menu (AccountMenu.tsx), beside the row&rsquo;s word, Theme. The labels Light, Dark
        and Match system are the options&rsquo; names and tooltips. Its thumb is the raised surface now, not the ink.
      </>
    ),
  },
  {
    name: "Grid size",
    sub: "account menu",
    specimen: (
      <Segmented aria-label="Grid size, as in the account menu" iconOnly size="md" defaultValue="medium" options={GRID} />
    ),
    props: ["iconOnly", 'size="md"', 'shape="pill" · ignored', 'tone="inverted" · ignored'],
    where: "The row under Theme: one, two or three bars for large, medium and small tiles.",
  },
  {
    name: "Expires in",
    sub: "API tokens",
    specimen: (
      <Segmented
        aria-label="Expires in, as in the token panel"
        size="lg"
        defaultValue="90"
        options={[
          { value: "30", label: "30 days" },
          { value: "90", label: "90 days" },
          { value: "180", label: "180 days" },
          { value: "365", label: "365 days" },
        ]}
      />
    ),
    props: ['size="lg"', 'shape="pill" · ignored', "aria-labelledby", 'className="mt-1"'],
    where: (
      <>
        The new token panel (ApiTokens.tsx), named by the visible &ldquo;Expires in&rdquo; above it. Read when the token is
        created. Its <Mono>size=&quot;lg&quot;</Mono> is kept for the call site and renders the same 28px track as sm,
        beside the panel&rsquo;s lg buttons (28px too).
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
        className="w-fit"
        defaultValue="mcp"
        options={[
          { value: "mcp", label: "MCP" },
          { value: "rest", label: "REST" },
        ]}
      />
    ),
    props: ['size="md"', 'shape="pill" · ignored', 'className="w-fit"'],
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
    props: ['tone="inverted" · ignored', 'className="w-full *:flex-1 *:px-2"'],
    where: (
      <>
        The homepage&rsquo;s search demo (BriefTabs in DemoParts.tsx), stretched across its card. The pills are
        absolute and measured from the options, so <Mono>*:flex-1</Mono> only grows the options and the thumb follows.
      </>
    ),
  },
];

// Every prop each component declares. Segmented's props are a closed set: nothing else is
// forwarded
const SEGMENTED_PROPS: { name: string; values: string; fallback: string; note: ReactNode }[] = [
  {
    name: "options",
    values: "{ value, label, icon? }[]",
    fallback: "required",
    note: "Two to five. label is shown, or with iconOnly becomes the option's name and tooltip. icon is a ReactNode, wrapped once per options array so it doesn't remount on every render.",
  },
  { name: "value", values: "T", fallback: "–", note: "Controlled: the page owns the value. Pair it with onValueChange." },
  { name: "onValueChange", values: "(value: T) => void", fallback: "–", note: "Called on every change, controlled or not." },
  { name: "defaultValue", values: "T", fallback: "the first option", note: "Uncontrolled: where it starts." },
  {
    name: "aria-label",
    values: "string",
    fallback: "–",
    note: "The group's name, on the track (role=\"tablist\"). Pass this or aria-labelledby, always.",
  },
  { name: "aria-labelledby", values: "string", fallback: "–", note: "The id of a visible label that names the group." },
  {
    name: "size",
    values: '"sm" | "md" | "lg"',
    fallback: '"sm"',
    note: "All three are the library's compact step (a 28px track, 24px options); md and lg are kept for call sites and render as sm.",
  },
  {
    name: "shape",
    values: '"rounded" | "pill"',
    fallback: "ignored",
    note: "Accepted for older call sites and ignored: every control is a pill (rounded-[24px] track, rounded-[20px] thumb).",
  },
  {
    name: "tone",
    values: '"raised" | "inverted"',
    fallback: "ignored",
    note: "Accepted for older call sites and ignored: the thumb is always the raised surface, one look for every segmented control.",
  },
  { name: "iconOnly", values: "boolean", fallback: "false", note: "Square options showing only their icons; the labels stay as names and titles." },
  {
    name: "className",
    values: "string",
    fallback: "–",
    note: "On the track, for layout only: w-fit, a margin, w-full *:flex-1.",
  },
  {
    name: "anything else",
    values: "dropped",
    fallback: "–",
    note: "The props are a closed set. The id, aria-describedby and aria-invalid that Field adds to its child don't reach the track; Field still names it through aria-labelledby.",
  },
];

const SWITCH_PROPS: { name: string; values: string; fallback: string; note: ReactNode }[] = [
  {
    name: "label",
    values: "string",
    fallback: "required",
    note: "The row's words and the switch's name (aria-labelledby points at them). A click on the words flips it.",
  },
  {
    name: "labelHidden",
    values: "boolean",
    fallback: "false",
    note: "Keeps the name for screen readers (sr-only) and draws nothing, for a switch whose words a Field beside it already shows. The row's padding goes too (px-0 py-0), so the track sits flush.",
  },
  {
    name: "checked",
    values: "boolean",
    fallback: "required",
    note: "Always controlled: there's no defaultChecked. The switch never flips itself.",
  },
  { name: "onCheckedChange", values: "(checked: boolean) => void", fallback: "required", note: "Called with the new state, from a click, the keyboard or a drag released past the middle." },
  { name: "disabled", values: "boolean", fallback: "false", note: "The row at half opacity, pointer events off, not focusable." },
  {
    name: "className",
    values: "string",
    fallback: "–",
    note: "On the row, layout only. Never a colour: the track's colours are inline styles a class can't reach, and cn would replace the row's own classes silently.",
  },
  {
    name: "anything else",
    values: "div attributes",
    fallback: "–",
    note: "Spread onto the row (a div), not the switch button: an id lands on the row, so <label htmlFor> can't reach the control. Name it with label instead. Never onClick or onPointerDown: they replace the row's own and the toggle or the drag stops working.",
  },
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

// The thumb's shapes, drawn: at rest 12px round, under the pointer 14px wide, and held 15px wide
// and 9px tall, squashed toward its own centre line; when on, the extra width grows leftward so
// the outer edge stays 2px from the track's end
function ThumbShapes() {
  return (
    <span aria-hidden="true" className="flex items-center gap-3">
      <span className="flex h-4 w-7 items-center rounded-full bg-[var(--accent)] px-0.5">
        <span className="size-3 rounded-full bg-background shadow-sm" />
      </span>
      <span className="flex h-4 w-7 items-center rounded-full bg-[var(--accent)] px-0.5">
        <span className="h-3 w-3.5 rounded-full bg-background shadow-sm" />
      </span>
      <span className="flex h-4 w-7 items-center rounded-full bg-[var(--accent)] px-0.5">
        <span className="h-[9px] w-[15px] rounded-full bg-background shadow-sm" />
      </span>
      <span className="flex h-4 w-7 items-center justify-end rounded-full bg-foreground px-0.5">
        <span className="h-[9px] w-[15px] rounded-full bg-background shadow-sm" />
      </span>
    </span>
  );
}

// The switch's target, drawn: the row itself, 28 × 16 with the label hidden, and nothing beyond it
function SwitchTarget() {
  return (
    <span aria-hidden="true" className="relative my-2 ml-2 flex h-4 w-7 items-center rounded-full bg-[var(--accent)] px-0.5">
      <span className="size-3 rounded-full bg-background shadow-sm" />
      <span className="absolute -inset-px rounded-full outline-1 outline-border outline-dashed" />
    </span>
  );
}

export default function Controls() {
  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-6">
        <SheetHeader title="Segmented and switch">
          Two shared controls for settings, both Fluid Functionalism&rsquo;s since 2026-10-23. Segmented picks one value
          out of two to five, all in view at once, with a raised pill that travels to the choice; Switch turns one setting
          on or off, with a thumb you can drag. Both change the moment they&rsquo;re used, and both work from the keyboard.
        </SheetHeader>
        {/* Shown by CSS alone, so it's in place before any script runs and nothing below it shifts */}
        <p className="hidden max-w-3xl rounded-xl bg-card px-4 py-3 text-body-sm text-secondary-foreground motion-reduce:block">
          Reduced motion is on, so the pills on this sheet jump instead of travelling, as they do across the site; the
          colours still fade.
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
                With nothing passed, Segmented is <Mono>size=&quot;sm&quot;</Mono>: the library&rsquo;s compact step, a
                28px track holding 24px options, as tall as a compact Button. <Mono>md</Mono> and <Mono>lg</Mono> are
                the same, kept for call sites (the token panel says lg beside Button lg, and both are 28px). The
                library&rsquo;s default step (36px with 28px options) goes unused. Every control is a pill with the raised
                thumb: <Mono>shape</Mono> and <Mono>tone</Mono> are accepted for older call sites and ignored. Switch has
                one size, a 28 &times; 16 track with a 12px thumb (the compact step the site runs on).
              </>
            ),
          },
          {
            term: "At once",
            text: (
              <>
                Neither has a confirm step of its own. A setting takes effect as it&rsquo;s changed (theme, grid size);
                inside a form the value waits for the form&rsquo;s submit (token expiry, Share with a link). A Switch is a{" "}
                <Mono>&lt;button role=&quot;switch&quot;&gt;</Mono>, not an input, so a form never carries its value:
                keep it in state and read that on submit.
              </>
            ),
          },
          {
            term: "Names",
            text: (
              <>
                A Switch carries its own words: <Mono>label</Mono> is required, drawn as the row&rsquo;s text and wired
                with <Mono>aria-labelledby</Mono>, and a tap on the words flips it. Where a <Mono>Field</Mono> already
                shows the words (<Mono>layout=&quot;inline-end&quot;</Mono>), pass the same text with{" "}
                <Mono>labelHidden</Mono>, so the name stays and the row draws nothing twice. A Segmented has no words of
                its own: put it in a <Mono>Field</Mono> (the default stacked layout), which names it with{" "}
                <Mono>aria-labelledby</Mono> (a <Mono>&lt;label&gt;</Mono> can&rsquo;t name a tablist), or pass{" "}
                <Mono>aria-label</Mono>. The token panel&rsquo;s &ldquo;Expires in&rdquo; still wires{" "}
                <Mono>aria-labelledby</Mono> by hand. Every option has a <Mono>label</Mono>, with <Mono>iconOnly</Mono>{" "}
                too: it becomes the option&rsquo;s name and its tooltip.
              </>
            ),
          },
          {
            term: "Keyboard",
            text: (
              <>
                Segmented is Radix&rsquo;s tab list in automatic mode: one tab stop, on the chosen option. ← and →
                move the choice and focus together, wrapping at the ends; Home and End go to the first and the last
                (↑ and ↓ do nothing: the list is horizontal). A Switch is a button: Space and Enter flip it.
              </>
            ),
          },
          {
            term: "Motion",
            text: (
              <>
                The Segmented thumb travels on <Mono>spring.moderate</Mono> (160ms, no overshoot) however the change
                came, a hover pill previews the next click on <Mono>spring.fast</Mono> (80ms), and one focus ring springs
                between options. Nothing moves on load: the thumb starts on the choice. The Switch thumb springs across
                on the same moderate spring, stretches 2px under the pointer and 3px while pressed (squashing 3px), and
                follows a drag 1:1. Under reduced motion the pills and the thumb&rsquo;s shapes jump; colours and
                opacities still fade.
              </>
            ),
          },
          {
            term: "Touch",
            text: (
              <>
                Neither extends its target. A Switch&rsquo;s target is its row: 24px tall with its words, the bare 28
                &times; 16 track with <Mono>labelHidden</Mono>; a drag works there too. Segmented&rsquo;s options are
                their own targets, 24 or 28px tall. Both are under the 44px floor: where phones use them, give the row
                room (a Field&rsquo;s inline row, a menu row) or take <Mono>lg</Mono>.
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
                <Mono>className</Mono>: the tracks&rsquo; colours are inline styles, and <Mono>cn</Mono> would replace
                the component&rsquo;s own class with yours.
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
 ├── size: one step, 28px, as tall as every Button
 │    ├── Anywhere (this page, the MCP page, a menu
 │    │   row) → sm, the default (md is the same)
 │    └── lg: the same, kept for call sites (the
 │        token panel, the dashboard's forms)
 ├── iconOnly: a row of glyphs with a word beside
 │   the control (the account menu's Theme and
 │   Grid size); every option keeps its label
 └── shape and tone: nothing to choose. Every
     control is a pill with the raised thumb;
     both props are accepted and ignored`}
        />
      </div>

      <SheetSection
        id="segmented"
        title="Segmented"
        description="Every size down, with words, with icons and as icons alone across. Each one is live: point at it and the hover pill follows; click and the thumb travels; tab in and the ring springs with the arrows."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(8rem,max-content)"
              columns={COLUMNS.map((c) => c.head)}
              rows={ROWS.map((row) => ({
                label: row.size,
                sub: row.sub,
                cells: COLUMNS.map((column) =>
                  column.kind === "iconOnly" ? (
                    <Segmented
                      key={column.head}
                      aria-label={`Theme, ${row.size}, icons only`}
                      iconOnly
                      size={row.size}
                      defaultValue="dark"
                      options={THEMES}
                    />
                  ) : column.kind === "icons" ? (
                    <Segmented
                      key={column.head}
                      aria-label={`Theme, ${row.size}, icons and words`}
                      size={row.size}
                      defaultValue="dark"
                      options={THEMES}
                    />
                  ) : (
                    <Segmented
                      key={column.head}
                      aria-label={`Tile size, ${row.size}`}
                      size={row.size}
                      defaultValue="medium"
                      options={TILES}
                    />
                  ),
                ),
              }))}
            />
          )}
        </Sheet>
        <p className="mt-4 max-w-[65ch] text-body-sm text-secondary-foreground">
          <Mono>shape</Mono> and <Mono>tone</Mono> are accepted so older call sites compile, and ignored: the track is
          always the pill and the thumb always the raised surface. The inverted thumb (the ink) and the rounded track are
          gone.
        </p>
      </SheetSection>

      <SheetSection
        id="parts"
        title="Parts"
        description="What Segmented is built from, as the library's tabs.tsx sets it for the step Segmented.tsx picks (the first value is the compact step, sm and md; after the dot, lg). Take it whole: never rebuild one from these classes."
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
        description="Tab into it, then use the arrows, Home and End; then click. The line under it says how the last change arrived."
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
                  { label: "Tab", cells: [<Note key="d">Lands on the chosen option and draws the ring round it. The group is one stop: Tab again leaves it.</Note>] },
                  {
                    label: "←",
                    cells: [<Note key="d">The option before, wrapping from the first to the last. Focus, the ring and the choice move together.</Note>],
                  },
                  { label: "→", cells: [<Note key="d">The option after, wrapping from the last to the first.</Note>] },
                  { label: "Home, End", cells: [<Note key="d">The first option and the last.</Note>] },
                  {
                    label: "a key",
                    sub: "motion",
                    cells: [<Note key="d">The thumb travels on the moderate spring (160ms) and the ring on the fast one (80ms); a held arrow retargets the spring from wherever it is, so nothing queues.</Note>],
                  },
                  {
                    label: "a pointer",
                    sub: "motion",
                    cells: [<Note key="d">The hover pill slides from the thumb to the option under the pointer (80ms) and the thumb dims to 0.85; a click moves the thumb at once, before the value round-trips. No ring: a click isn&rsquo;t focus-visible.</Note>],
                  },
                  {
                    label: "page load",
                    sub: "motion",
                    cells: [
                      <Note key="d">
                        Nothing moves. The thumb is placed on the choice as soon as the options are measured, with no
                        entrance (<Mono>initial={"{false}"}</Mono>).
                      </Note>,
                    ],
                  },
                  { label: "reduced motion", cells: [<Note key="d">The pills jump, however the change came; the dims and fades still run. The library&rsquo;s MotionConfig, which each Segmented wraps itself in.</Note>] },
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
                  Controlled: the page owns the value, reads it and can change it from outside, as Reset does. The thumb
                  travels on a click before the new value comes back, then follows whatever the page settles on.
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
              why: "a saved choice set after mount, so the thumb travels across as the page loads",
              code: `useEffect(() => setMode(localStorage.getItem("mode") ?? "both"), []);

<Segmented aria-label="Show specimens in" value={mode} onValueChange={choose} options={…} />`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="in-use"
        title="Segmented in use"
        description="Every place it's used today, live, with the props each one passes. Where a call site still writes shape or tone, the prop is marked ignored."
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
        description="One size, a labelled row. Flip the live ones by the track or the words; drag a thumb across; press and hold one to feel the squash, drawn here as the thumb's shapes. The track's colours are inline styles, written out here as the library sets them."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(7rem,max-content)"
              template="minmax(10rem,max-content) minmax(16rem,max-content) minmax(16rem,1fr)"
              columns={["specimen", "classes", "notes"]}
              rows={[
                {
                  label: "off",
                  cells: [
                    <SwitchState key="s" label="Off example" />,
                    <MonoList
                      key="c"
                      items={[
                        "track: background-color: var(--accent)",
                        "hover: color-mix(in oklab, var(--accent), rgb(var(--overlay)) 10%)",
                        "thumb: bg-background shadow-sm",
                        "label: text-muted-foreground",
                      ]}
                    />,
                    <Note key="n">The 12px thumb rests 2px in from the left of a 28 &times; 16 track in the neutral fill; the words are muted.</Note>,
                  ],
                },
                {
                  label: "on",
                  cells: [
                    <SwitchState key="s" label="On example" defaultChecked />,
                    <MonoList
                      key="c"
                      items={[
                        "track: background-color: var(--foreground)",
                        "hover: color-mix(in oklab, var(--foreground) 90%, var(--background))",
                        "label: text-foreground",
                      ]}
                    />,
                    <Note key="n">
                      The track is the ink, like the primary button (the library&rsquo;s blue is replaced), and the
                      words brighten to the ink with it. The thumb springs 12px across on <Mono>spring.moderate</Mono>.
                    </Note>,
                  ],
                },
                {
                  label: "thumb",
                  sub: "drawn: rest, hover, pressed, pressed on",
                  cells: [
                    <ThumbShapes key="s" />,
                    <MonoList key="c" items={["12 × 12 · hover 14 × 12", "pressed 15 × 9, y +1.5", "on: grows leftward"]} />,
                    <Note key="n">
                      Hover stretches the thumb 2px into a pill (mouse only: a finger has no hover); a press stretches it
                      3px and squashes it 3px toward its own centre. When on, the extra width grows leftward so the outer
                      edge stays 2px from the track&rsquo;s end.
                    </Note>,
                  ],
                },
                {
                  label: "drag",
                  cells: [
                    <SwitchState key="s" label="Drag example" />,
                    <MonoList key="c" items={["touch-none select-none", "dead zone 2px", "release past the middle flips"]} />,
                    <Note key="n">
                      Past 2px of travel a press becomes a drag and the thumb follows the pointer 1:1, clamped to the
                      track; let go past the midpoint and it flips, short of it and it springs home. The row captures the
                      pointer, so a drag can overshoot and still release.
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
                    <MonoList key="c" items={["row: opacity-50 pointer-events-none"]} />,
                    <Note key="n">
                      The whole row at half opacity, so on and off still read in the track. It can&rsquo;t be focused or
                      pressed.
                    </Note>,
                  ],
                },
                {
                  label: "target",
                  sub: "drawn",
                  cells: [
                    <SwitchTarget key="s" />,
                    <MonoList key="c" items={["row: flex items-center cursor-pointer", "gap-1 px-2.5 py-1 · labelHidden: px-0 py-0"]} />,
                    <Note key="n">
                      The row is the target: 24px tall with its words, the bare 28 &times; 16 track with the label
                      hidden. Nothing reaches out to 44px.
                    </Note>,
                  ],
                },
                {
                  label: "focus",
                  cells: [
                    <Note key="s">Tab to one above</Note>,
                    <MonoList
                      key="c"
                      items={[
                        "focus-visible:ring-1",
                        "focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
                        "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      ]}
                    />,
                    <Note key="n">A 1px terracotta ring 2px out from the track, the gap filled with the page. From the keyboard only, as on every control.</Note>,
                  ],
                },
                {
                  label: "motion",
                  cells: [
                    <Note key="s">Flip one above</Note>,
                    <MonoList
                      key="c"
                      items={[
                        "track: transition-colors duration-80",
                        "label: transition-[color] duration-80",
                        "thumb: spring.moderate (160ms, bounce 0)",
                        "MotionConfig reducedMotion=\"user\"",
                      ]}
                    />,
                    <Note key="n">
                      The track and the words cross-fade 80ms; the thumb&rsquo;s travel, stretch and squash ride the
                      moderate spring. Each Switch wraps itself in the library&rsquo;s MotionConfig, so under reduced
                      motion the shapes jump; the colours still fade.
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
        description="A Switch carries its own words; a Segmented doesn't. Give a Segmented a label in a Field, and keep a Switch's label even where a Field shows the words."
      >
        <div className="flex flex-col gap-8">
          <Sheet>
            {() => (
              <div className="grid gap-4 sm:grid-cols-2">
                <StateCard name="<Field>" demo={<FieldDemo />}>
                  The recipe. The label names the control, the description describes it, and Field wires both. The Switch
                  takes the same words with <Mono>labelHidden</Mono>, so its name and the visible label agree. Inside a
                  form, the values are read from state on submit.
                </StateCard>
                <StateCard name="labelHidden beside words" demo={<LabelledSwitch />}>
                  A hidden label beside words set by hand. The switch is named by <Mono>label</Mono>, not by the{" "}
                  <Mono>&lt;label&gt;</Mono> (its id lands on the row, which a label can&rsquo;t point at), and a tap on
                  the words doesn&rsquo;t flip it: only the row does. Prefer the row&rsquo;s own label where there&rsquo;s
                  room.
                </StateCard>
              </div>
            )}
          </Sheet>
          <Code
            correct={`{/* A Switch: its own words, the row flips on a tap anywhere */}
<Switch label="Share with a link" checked={shared} onCheckedChange={setShared} />

{/* In a Field that shows the words: the same text, hidden */}
<Field label="Share with a link" layout="inline-end" description="Anyone with the link can view it, read-only">
  <Switch label="Share with a link" labelHidden checked={shared} onCheckedChange={setShared} />
</Field>

{/* A Segmented: stacked, so the label sits above; Field names it with aria-labelledby */}
<Field label="Expires in">
  <Segmented size="lg" value={days} onValueChange={setDays} options={…} />
</Field>`}
            incorrect={{
              why: "its own switch: the browser's default focus ring instead of the system's, no press, no drag, weak curves (the new-board dialog's, before Switch)",
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
        description="Everything each one declares. Segmented's props are a closed set; Switch spreads anything else onto its row."
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
