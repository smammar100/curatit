// /system/type: Text's variants on the --text-* tokens in src/styles/global.css, the families
// and weights loaded in src/app/layout.tsx, the features and wrapping set at the root, and the
// six roles from src/lib/type-scale.ts (the dashboard's, and since 2026-10-23 every shared
// component's, at the compact step) and the library's three weights in src/lib/font-weight.ts,
// all live in both themes. A server component: nothing here needs a script
import type { CSSProperties } from "react";
import Text, { type TextVariant } from "@/components/fundations/elements/Text";
import { cx } from "@/lib/cx";
import { fontWeights } from "@/lib/font-weight";
import { typeClasses, typeStyles, type TypeScaleRole } from "@/lib/type-scale";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../SheetParts";

// The --text-* tokens in global.css, as size/leading in px. Headings also carry -0.01em and
// weight 500 (Interfere's Inter medium), which Text's heading variants set back to 400
const SCALE = {
  "text-h1": "56/56",
  "text-h2": "44/56",
  "text-h3": "36/44",
  "text-h4": "28/36",
  "text-h5": "24/32",
  "text-h6": "20/24",
  "text-body-lg": "18/24",
  "text-body-base": "15/24",
  "text-body-sm": "13/20",
  "text-caption-lg": "12/16",
  "text-caption-base": "11/16",
  "text-caption-sm": "10/16",
  "text-caption-xs": "8/12",
} as const;
type Token = keyof typeof SCALE;

// Text's heading variants: the token each sets from base, sm, md and lg up (null: no change
// at that breakpoint), copied from Text.tsx
const HEADINGS: { variant: TextVariant; steps: [Token, Token | null, Token | null, Token | null]; use: string }[] = [
  {
    variant: "h1",
    steps: ["text-h3", "text-h2", null, "text-h1"],
    use: "The page title; every homepage section, the FAQ (on /pricing too) and the statement on /agents",
  },
  { variant: "h2", steps: ["text-h4", null, "text-h3", "text-h2"], use: "A closing call to action on an inner page (/agents)" },
  {
    variant: "h3",
    steps: ["text-h5", null, "text-h4", "text-h3"],
    use: "Sections on inner pages: docs, roadmap, vision; plan and package names on the pricing and advertise cards",
  },
  { variant: "h4", steps: ["text-h5", null, null, "text-h4"], use: "A heading under an h3; unused so far" },
  { variant: "h5", steps: ["text-h6", null, null, "text-h5"], use: "The auth card's title, How it works cards, these sections" },
  { variant: "h6", steps: ["text-h6", null, null, null], use: "Card titles" },
];

const BODY: { variant: TextVariant; token: Token; use: string; sample: string }[] = [
  {
    variant: "bodyLG",
    token: "text-body-lg",
    use: "A larger lead; unused so far",
    sample: "See how each post is built, then save and share the best.",
  },
  {
    variant: "body",
    token: "text-body-base",
    use: "The default: leads and running text",
    sample:
      "A searchable library of real brand posts, reviewed by editors. See how each one is built, then save and share the best.",
  },
  {
    variant: "bodySM",
    token: "text-body-sm",
    use: "UI copy: labels, buttons, dense descriptions",
    sample: "Notes on a shared board are visible to anyone with the link.",
  },
];

const CAPTIONS: { variant: TextVariant; token: Token; use: string }[] = [
  { variant: "captionLG", token: "text-caption-lg", use: "Meta lines, a field's error note, these sheets' labels" },
  { variant: "caption", token: "text-caption-base", use: "The small badge (Badge size sm), small print" },
  { variant: "captionSM", token: "text-caption-sm", use: "Interfere's; unused here" },
  { variant: "captionXS", token: "text-caption-xs", use: "Interfere's; unused here, and under the 11px floor" },
];

const WEIGHTS = [
  { cls: "font-normal", value: "400", use: "The default: body, captions and every serif heading" },
  { cls: "font-semimedium", value: "450", use: "Interfere's in-between step; nothing uses it yet" },
  { cls: "font-medium", value: "500", use: "Labels and card titles on pages, the dashboard's title and subtitle" },
  { cls: "font-semibold", value: "600", use: "Inter only, and rare on pages: counts in tiny badges" },
];

// The library's three weights (src/lib/font-weight.ts): a variable-font setting, not a class. Each
// pairs a weight with an optical size, the library's pairing for an Inter that carries the axis;
// the Inter next/font serves here is loaded without opsz, so only the weight takes effect
const LIBRARY_WEIGHTS: { name: keyof typeof fontWeights; use: string }[] = [
  { name: "normal", use: "Labels at rest, the Tooltip, an unselected tab, every body line in a component" },
  {
    name: "semibold",
    use: "A selected tab, a checked Menu row, CardTitle, EmptyState's title, a Dialog's title, Avatar initials, Notice's title. Held beside an invisible copy of itself so the label keeps its width (Motion)",
  },
  { name: "bold", use: "Reserved; nothing uses it yet" },
];

const FAMILIES = [
  {
    cls: "font-sans",
    name: "Inter",
    loaded:
      "next/font/google, variable weight, without its opsz axis: the site sets Inter at body and UI sizes, where the axis changes little, and leaving it out takes the file from 73 KB to 48 KB",
    use: "Everything that isn't a heading: body, UI, buttons, labels, captions. The page inherits it, so add nothing",
  },
  {
    cls: "font-display",
    name: "Hedvig Letters Serif",
    loaded:
      "next/font/google with its opsz axis (12 to 24), which adjusts serif type set under 24px, such as h6, and h5 below lg (both 20px); at 24px and up it's the default 24pt design. One weight, 400",
    use: "Headings (Text's heading variants add it) and the dashboard's display role",
  },
  {
    cls: "font-mono",
    name: "System monospace",
    loaded:
      "No file: ui-monospace, Cascadia Code, JetBrains Mono, SF Mono, Menlo, Consolas. Interfere's Berkeley Mono isn't ours to ship",
    use: "Code, tokens and class names",
  },
];

// The dashboard's roles: `write` is what a call site writes for the default step (and what the
// specimen renders); `extra` is the family and weight that go with the compact step's classes
const ROLES: { role: TypeScaleRole; write: string; extra: string; use: string; sample: string }[] = [
  { role: "display", write: "font-display text-display font-light", extra: "font-display font-light", use: "Board, post and new-board titles", sample: "Launch ideas" },
  { role: "title", write: "text-title font-medium", extra: "font-medium", use: "Section headings, dialog titles", sample: "Recently saved" },
  { role: "subtitle", write: "text-subtitle font-medium", extra: "font-medium", use: "Card titles, primary buttons, menu items", sample: "Spring campaign" },
  { role: "body", write: "text-body", extra: "", use: "Everything without a role (inherited)", sample: "Notes live on the images." },
  { role: "caption", write: "text-caption", extra: "", use: "Descriptions, meta rows, errors, group labels", sample: "12 posts · used today" },
  { role: "micro", write: "text-micro", extra: "", use: "Key caps, counters, tiny badges; one line", sample: "Esc" },
];

const LEGACY: { name: TextVariant; also?: string; same: TextVariant }[] = [
  { name: "displayLG", also: "displayXL, display2XL … display6XL", same: "h1" },
  { name: "displayMD", same: "h2" },
  { name: "displaySM", same: "h3" },
  { name: "displayXS", same: "h5" },
  { name: "textXL", also: "textLG", same: "bodyLG" },
  { name: "textBase", same: "body" },
  { name: "textSM", same: "bodySM" },
  { name: "textXS", same: "captionLG" },
];

const HEADING_SAMPLE = "Taste you can learn from.";

// One token at one breakpoint: its size/leading over its name, or a dash where nothing changes.
// `relative` keeps the sr-only text inside the matrix's scroller: positioned against the page, it
// would sit past the screen's edge in a scrolled-off column and widen the page on phones
function Step({ token }: { token: Token | null }) {
  if (!token)
    return (
      <span className="relative font-mono text-caption-lg text-tertiary-foreground">
        <span aria-hidden>–</span>
        <span className="sr-only">no change</span>
      </span>
    );
  return (
    <span className="flex flex-col">
      <span className="font-mono text-caption-lg text-primary-foreground">{SCALE[token]}</span>
      <span className="font-mono text-caption-lg text-secondary-foreground">{token}</span>
    </span>
  );
}

function sizeOf(role: TypeScaleRole, step: "default" | "compact") {
  const { size, leading } = typeStyles[role][step];
  return `${size}/${leading}`;
}

// Numbers of one length, right-aligned: tabular figures make a clean block, proportional ones a
// ragged left edge
function Figures({ serif = false, style }: { serif?: boolean; style?: CSSProperties }) {
  return (
    <span
      className={cx(
        "flex flex-col items-end text-primary-foreground",
        serif ? "font-display text-h6 font-normal" : "text-body-lg",
      )}
      style={style}
    >
      {["1,111.11", "4,804.80", "7,070.07", "9,999.99"].map((n) => (
        <span key={n}>{n}</span>
      ))}
    </span>
  );
}

function Quotes({ style }: { style?: CSSProperties }) {
  return (
    <span className="text-body-lg whitespace-nowrap text-primary-foreground" style={style}>
      “Hit Save,” it says.
    </span>
  );
}

export default function Type() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Type">
        Hedvig Letters Serif for headings and Inter for everything else. Pages set type with <Mono>Text</Mono>{" "}
        on Interfere&rsquo;s scale (one token sets size, leading and tracking; <Mono>Text</Mono> adds the serif and
        the steps down on smaller screens); the dashboard and, since 2026-10-23, every shared component use the six
        roles of Fluid Functionalism&rsquo;s scale, at the compact step, with its three weights set as a variable-font
        setting rather than a class.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                <Mono>Text</Mono> from <Mono>@/components/fundations/elements/Text</Mono> with a variant, on
                marketing, auth and share pages. The variant carries the family, weight, size, leading,
                tracking and the steps down; a raw <Mono>{`<h2 className="text-h2">`}</Mono> gets Inter
                medium at 44px on a phone.
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                The dashboard uses the six roles (<Mono>text-display</Mono> … <Mono>text-micro</Mono>, below),
                not <Mono>Text</Mono>. The shared components carry their own role and step (a Button&rsquo;s label is
                the compact body, 12/18; a Tooltip the caption): add no size class to them. Markdown bodies (blog,
                legal) render inside <Mono>{`<Wrapper variant="prose">`}</Mono>.
              </>
            ),
          },
          {
            term: "Variants",
            text: (
              <>
                <Mono>h1</Mono>–<Mono>h6</Mono>; <Mono>bodyLG</Mono>, <Mono>body</Mono> (the default),{" "}
                <Mono>bodySM</Mono>; <Mono>captionLG</Mono>, <Mono>caption</Mono>, <Mono>captionSM</Mono>,{" "}
                <Mono>captionXS</Mono>. Nothing else exists; the older names at the foot of this sheet map onto
                these.
              </>
            ),
          },
          {
            term: "Tag and variant",
            text: (
              <>
                <Mono>tag</Mono> follows the page&rsquo;s outline, <Mono>variant</Mono> the size: a homepage
                section is <Mono>{`tag="h2" variant="h1"`}</Mono>. Never choose a tag for its size: screen
                readers list headings by level. <Mono>tag</Mono> defaults to <Mono>p</Mono>.
              </>
            ),
          },
          {
            term: "Headings",
            text: (
              <>
                The serif, regular, always. Hedvig has one weight (400), so never <Mono>font-medium</Mono>,{" "}
                <Mono>font-semibold</Mono> or <Mono>font-bold</Mono> on a heading. Don&rsquo;t add a weight or
                family class to a <Mono>Text</Mono> heading either: it appends your <Mono>className</Mono>{" "}
                without merging, so two weight classes compete and the stylesheet&rsquo;s order, not yours,
                picks the winner.
              </>
            ),
          },
          {
            term: "Weights",
            text: (
              <>
                Inside a shared component, the library&rsquo;s three: <Mono>fontWeights.normal</Mono>,{" "}
                <Mono>semibold</Mono> and <Mono>bold</Mono> from <Mono>@/lib/font-weight</Mono>, written as{" "}
                <Mono>{`style={{ fontVariationSettings: fontWeights.semibold }}`}</Mono>, never Tailwind&rsquo;s{" "}
                <Mono>font-*</Mono>. A setting can tween (80ms on a selected tab) where a class can&rsquo;t, and a
                heavier label keeps its width beside an invisible copy of itself (Motion). On pages,{" "}
                <Mono>font-medium</Mono> on a label or a card title is still the way; <Mono>Text</Mono> headings take no
                weight at all.
              </>
            ),
          },
          {
            term: "The serif",
            text: (
              <>
                <Mono>font-display</Mono> only on headings (Text adds it) and the dashboard&rsquo;s display
                role. Never on buttons, labels, captions or body. The wordmark is Hedvig outlined to paths: use{" "}
                <Mono>Logo</Mono> or <Mono>Lockup</Mono> from <Mono>components/assets</Mono>, never
                &ldquo;Curatit&rdquo; typed in the serif.
              </>
            ),
          },
          {
            term: "Sizes",
            text: (
              <>
                Only the <Mono>--text-*</Mono> tokens. Never Tailwind&rsquo;s <Mono>text-xs</Mono> …{" "}
                <Mono>text-9xl</Mono> or an arbitrary <Mono>text-[15px]</Mono> in new code: they&rsquo;re off
                the scale (<Mono>text-sm</Mono> is 14px, which isn&rsquo;t a step on <Mono>Text</Mono>&rsquo;s scale;
                in the dashboard, 14px is <Mono>text-subtitle</Mono>). The one exception is{" "}
                <Mono>pointer-coarse:text-[16px]</Mono> on fields. Words people read are 11px or more.
              </>
            ),
          },
          {
            term: "Uppercase",
            text: (
              <>
                Only on captions, always with <Mono>tracking-wider</Mono> (0.05em): capitals at 12px clump
                without it. Type the words in sentence case and let <Mono>uppercase</Mono> do the rest.
              </>
            ),
          },
          {
            term: "Numbers",
            text: (
              <>
                Tabular figures are on for every element (<Mono>:root</Mono> sets{" "}
                <Mono>{`font-feature-settings: "tnum" 1`}</Mono>), so counts don&rsquo;t shift as they change and
                columns line up. Add nothing. Hedvig has no tabular figures: keep live or aligned numbers in Inter,
                not in a heading. An element that sets its own <Mono>font-feature-settings</Mono> replaces the list,
                so repeat <Mono>tnum</Mono> in it.
              </>
            ),
          },
          {
            term: "Measure",
            text: (
              <>
                Running text stops at 65 characters: <Mono>max-w-[65ch]</Mono> (<Mono>max-w-prose</Mono> is
                the same). Past about 75 the eye loses its way back to the next line.
              </>
            ),
          },
          {
            term: "Wrapping",
            text: (
              <>
                Base styles balance <Mono>h1</Mono>–<Mono>h6</Mono> and wrap <Mono>p</Mono>, <Mono>li</Mono>,{" "}
                <Mono>dd</Mono>, <Mono>dt</Mono>, <Mono>figcaption</Mono>, <Mono>summary</Mono>,{" "}
                <Mono>blockquote</Mono> and <Mono>label</Mono> pretty, so no line ends on one short word. Add
                nothing to those; copy in a <Mono>div</Mono> or <Mono>span</Mono> gets neither, so give it{" "}
                <Mono>text-balance</Mono> or <Mono>text-pretty</Mono>.
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which Text variant?
 ├── The page title → tag="h1" variant="h1"
 ├── A homepage section → tag="h2" variant="h1"
 │    └── Also the FAQ (on /pricing too) and the statement on /agents
 ├── A section on another page (docs, roadmap, vision) → tag="h2" variant="h3"
 │    └── A closing call to action → variant="h2"
 ├── A heading inside a section → tag="h3" variant="h4" or "h5"
 ├── A card title → variant="h6", or CardTitle (the library's semibold)
 ├── A lead or running text → variant="body" (the default)
 ├── A label or dense UI copy → variant="bodySM"
 └── A meta line → "captionLG" + uppercase tracking-wider`}
        />
        <Flow
          tree={`Which role? (the dashboard, and inside a component)
 ├── A page title: board, post, new board → text-display
 ├── A section heading, a dialog title → text-title
 ├── A card title, a menu item → text-subtitle
 ├── Body copy, a control's label → text-body (inherited;
 │   a shared control takes the compact step, 12/18)
 ├── A description, a meta row, an error, a tooltip → text-caption
 └── A key cap, a counter, a tiny badge → text-micro`}
        />
      </div>

      <SheetSection
        title="Headings"
        description="Each variant steps down at sm (640px), md (768px) and lg (1024px); a dash means no change. Every step tracks at -0.01em. The samples render at this window's width, so resize it to watch them step."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(9rem,12rem)"
              template="repeat(4,minmax(5.5rem,max-content)) minmax(18rem,1fr)"
              columns={["base", "sm", "md", "lg", "sample"]}
              rows={HEADINGS.map((h) => ({
                label: h.variant,
                sub: h.use,
                cells: [
                  ...h.steps.map((token, i) => <Step key={i} token={token} />),
                  <Text key="s" variant={h.variant} className="text-balance text-primary-foreground">
                    {HEADING_SAMPLE}
                  </Text>,
                ],
              }))}
            />
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`<Text tag="h2" variant="h1" className="text-primary-foreground">
  Stop hunting for examples.
</Text>
<Text className="mt-4 max-w-[65ch] text-secondary-foreground">
  A searchable library of real brand posts, reviewed by editors.
</Text>`}
            incorrect={{
              why: "a raw tag at 36px on every screen, in a weight Hedvig doesn't have",
              code: `<h2 className="font-display text-4xl font-semibold">
  Stop hunting for examples.
</h2>
<p className="mt-4 text-lg">
  A searchable library of real brand posts, reviewed by editors.
</p>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        title="Body"
        description="Inter at 400, the same at every width, no tracking. The samples stop at 65 characters."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(9rem,12rem)"
              template="minmax(7.5rem,max-content) minmax(18rem,1fr)"
              columns={["token", "sample"]}
              rows={BODY.map((b) => ({
                label: b.variant,
                sub: b.use,
                cells: [
                  <Step key="t" token={b.token} />,
                  <Text key="s" variant={b.variant} className="max-w-[65ch] text-primary-foreground">
                    {b.sample}
                  </Text>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Captions"
        description="Inter at 400 on a 16px leading (12px for the smallest). Uppercase always brings tracking-wider. captionSM and captionXS are Interfere's and nothing here uses them: words people read stay at 11px or more."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(9rem,12rem)"
              template="minmax(7.5rem,max-content) minmax(10rem,1fr) minmax(10rem,1fr)"
              columns={["token", "sentence case", "uppercase tracking-wider"]}
              rows={CAPTIONS.map((c) => ({
                label: c.variant,
                sub: c.use,
                cells: [
                  <Step key="t" token={c.token} />,
                  <Text key="s" variant={c.variant} className="text-secondary-foreground">
                    Shared board · Read-only
                  </Text>,
                  <Text key="u" variant={c.variant} className="tracking-wider text-secondary-foreground uppercase">
                    Shared board
                  </Text>,
                ],
              }))}
            />
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`<Text variant="captionLG" className="tracking-wider text-secondary-foreground uppercase">
  Shared board
</Text>`}
            incorrect={{
              why: "capitals typed into the copy, no tracking, and text-xs off the scale",
              code: `<span className="text-xs text-secondary-foreground">
  SHARED BOARD
</span>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        title="The library's weights"
        description="Three settings in src/lib/font-weight.ts, each a weight paired with an optical size, applied through fontVariationSettings in every shared component. The Inter loaded here has no opsz axis, so the second value is inert on this site; the pairing is kept as the library wrote it, for an Inter that carries the axis. Headings keep the serif and take none of these."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(10rem,max-content)"
              template="minmax(11rem,max-content) minmax(12rem,max-content) minmax(16rem,1fr)"
              columns={["sample", "setting", "use"]}
              rows={LIBRARY_WEIGHTS.map((w) => ({
                label: `fontWeights.${w.name}`,
                cells: [
                  <span key="s" className="text-body-lg text-primary-foreground" style={{ fontVariationSettings: fontWeights[w.name] }}>
                    Saved to Launch ideas
                  </span>,
                  <Mono key="v">{fontWeights[w.name]}</Mono>,
                  <span key="u" className="text-body-sm text-secondary-foreground">
                    {w.use}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Weights as classes"
        description="Tailwind's weight classes, for pages and Text. The serif column is the same four times: Hedvig has one weight and html sets font-synthesis-weight: none, so a heavier class does nothing rather than fake a bold. On Inter, never font-light (thin at 13px) or font-bold (louder than anything else on the page), and never change weight on hover or selection with a class: it reflows the line (a shared component tweens the setting instead)."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(9rem,max-content)"
              template="3.5rem minmax(11rem,max-content) minmax(13rem,max-content) minmax(14rem,1fr)"
              columns={["value", "Inter", "Hedvig", "use"]}
              rows={WEIGHTS.map((w) => ({
                label: w.cls,
                cells: [
                  <Mono key="v">{w.value}</Mono>,
                  <span key="i" className={cx("text-body-lg text-primary-foreground", w.cls)}>
                    Saved to Launch ideas
                  </span>,
                  <span key="h" className={cx("font-display text-h6 text-primary-foreground", w.cls)}>
                    {HEADING_SAMPLE}
                  </span>,
                  <span key="u" className="text-body-sm text-secondary-foreground">
                    {w.use}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Families"
        description="Three, defined as --font-sans, --font-display and --font-mono in global.css. Never add a fourth."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(8rem,max-content)"
              template="minmax(12rem,max-content) minmax(16rem,1fr) minmax(16rem,1fr)"
              align="start"
              columns={["sample", "loaded", "use"]}
              rows={FAMILIES.map((f) => ({
                label: f.cls,
                cells: [
                  <span key="s" className="flex flex-col gap-1">
                    <span className={cx("text-h4 font-normal text-primary-foreground", f.cls)}>Aa 0123</span>
                    <span className="text-body-sm text-secondary-foreground">{f.name}</span>
                  </span>,
                  <span key="l" className="text-body-sm text-secondary-foreground">
                    {f.loaded}
                  </span>,
                  <span key="u" className="text-body-sm text-secondary-foreground">
                    {f.use}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Features"
        description={
          <>
            Set once on <Mono>:root</Mono> and inherited everywhere; the right-hand column turns each one off
            for comparison. What the font files next/font serves actually carry: Inter&rsquo;s Latin subset
            has <Mono>calt</Mono>, <Mono>ccmp</Mono>, <Mono>dnom</Mono>, <Mono>frac</Mono>, <Mono>locl</Mono>,{" "}
            <Mono>numr</Mono>, <Mono>pnum</Mono> and <Mono>tnum</Mono>, so <Mono>ss03</Mono> does nothing
            today; Hedvig has no <Mono>tnum</Mono>, so a number in a heading stays proportional.
          </>
        }
      >
        <Sheet split>
          {() => (
            <Matrix
              first="minmax(8rem,12rem)"
              columns={["on (the default)", "off"]}
              rows={[
                {
                  label: `"tnum" 1`,
                  sub: "Tabular figures, in Inter",
                  cells: [
                    <Figures key="on" />,
                    <Figures key="off" style={{ fontFeatureSettings: `"tnum" 0, "ss03" 1` }} />,
                  ],
                },
                {
                  label: `"tnum" 1`,
                  sub: "In Hedvig: no such feature, so no change",
                  cells: [
                    <Figures key="on" serif />,
                    <Figures key="off" serif style={{ fontFeatureSettings: `"tnum" 0, "ss03" 1` }} />,
                  ],
                },
                {
                  label: `"ss03" 1`,
                  sub: "Round quotes and commas: not in the Inter we load, so no change",
                  cells: [
                    <Quotes key="on" />,
                    <Quotes key="off" style={{ fontFeatureSettings: `"tnum" 1, "ss03" 0` }} />,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Wrapping"
        description="The same copy in the same 15rem column, with the base style and without it (text-wrap, which is what copy in a div or span gets)."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(9rem,12rem)"
              template="repeat(2,minmax(16rem,1fr))"
              align="start"
              columns={["the base style", "without it"]}
              rows={[
                {
                  label: "h1–h6",
                  sub: "text-wrap: balance",
                  cells: [
                    <div key="b" className="w-60 rounded-lg bg-card p-3">
                      <p className="font-display text-h6 font-normal text-balance text-primary-foreground">
                        Bring Curatit to your AI assistant
                      </p>
                    </div>,
                    <div key="w" className="w-60 rounded-lg bg-card p-3">
                      <p className="font-display text-h6 font-normal text-wrap text-primary-foreground">
                        Bring Curatit to your AI assistant
                      </p>
                    </div>,
                  ],
                },
                {
                  label: "p, li, label …",
                  sub: "text-wrap: pretty",
                  cells: [
                    <div key="p" className="w-60 rounded-lg bg-card p-3">
                      <p className="text-body-base text-primary-foreground">
                        Every tile is a real post. Hover to shuffle, or tap on touch screens.
                      </p>
                    </div>,
                    <div key="w" className="w-60 rounded-lg bg-card p-3">
                      <p className="text-body-base text-wrap text-primary-foreground">
                        Every tile is a real post. Hover to shuffle, or tap on touch screens.
                      </p>
                    </div>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="The six roles"
        description={
          <>
            Fluid Functionalism&rsquo;s scale (<Mono>src/lib/type-scale.ts</Mono>): six roles, each a size and a
            leading, at two steps. The dashboard writes the default step; the shared components take the compact
            step, which is the site&rsquo;s setting (<Mono>FluidRoot</Mono> wraps the app in{" "}
            <Mono>{`<SizeProvider defaultSize="compact">`}</Mono>, so <Mono>useSize().text</Mono> is body 12/18 and a
            control is 28px tall). Display is the serif; the rest are Inter.
          </>
        }
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(10rem,13rem)"
              template="minmax(11rem,1fr) minmax(11rem,1fr) minmax(17rem,max-content)"
              columns={["default", "compact", "write"]}
              rows={ROLES.map((r) => ({
                label: r.role,
                sub: r.use,
                cells: [
                  <span key="d" className="flex flex-col gap-1">
                    <span className={cx(r.write, "text-primary-foreground")}>{r.sample}</span>
                    <Mono>{sizeOf(r.role, "default")}</Mono>
                  </span>,
                  <span key="c" className="flex flex-col gap-1">
                    <span className={cx(typeClasses.compact[r.role], r.extra, "text-primary-foreground")}>
                      {r.sample}
                    </span>
                    <Mono>{sizeOf(r.role, "compact")}</Mono>
                  </span>,
                  // A plain code element, not Mono: Mono's own colour would win over a second one
                  <code key="w" className="font-mono text-caption-lg text-primary-foreground">
                    {r.write}
                  </code>,
                ],
              }))}
            />
          )}
        </Sheet>
        <div className="mt-6 flex flex-col gap-6">
          <Rules
            items={[
              {
                term: "Base",
                text: (
                  <>
                    The dashboard&rsquo;s layout wraps every page in <Mono>contents text-body</Mono>, so 13/20 is
                    inherited. Set a role only where it differs.
                  </>
                ),
              },
              {
                term: "Display",
                text: (
                  <>
                    Written <Mono>font-display text-display font-light</Mono>, as every dashboard title is. Hedvig
                    has one weight, so it renders regular.
                  </>
                ),
              },
              {
                term: "Fields",
                text: (
                  <>
                    Every editable field adds <Mono>pointer-coarse:text-[16px]</Mono> after its role (
                    <Mono>fieldTouchClass</Mono> in <Mono>@/lib/type-scale</Mono>). iOS Safari zooms the page
                    into a focused field under 16px; this sets 16px on touch screens only and leaves the leading
                    and the field&rsquo;s height alone.
                  </>
                ),
              },
              {
                term: "Compact",
                text: (
                  <>
                    The site&rsquo;s setting for every shared control since 2026-10-23: body 12/18 in a Button, an
                    Input, a tab or a Menu row (<Mono>useSize().text</Mono>), the caption 11/14 in a compact Badge.
                    No utility of its own: <Mono>{`typeClass(role, "compact")`}</Mono> from{" "}
                    <Mono>@/lib/type-scale</Mono>, or <Mono>useSize().type[role]</Mono> from{" "}
                    <Mono>@/lib/size-context</Mono> in a client component (<Mono>{`useSize("default")`}</Mono> for the
                    36px step, which the lg sizes of Button and Input take).
                  </>
                ),
              },
            ]}
          />
          <Code
            correct={`<h1 className="font-display text-display font-light text-primary-foreground">
  {board.name}
</h1>
<input className="h-9 rounded-lg px-3 text-body pointer-coarse:text-[16px]" />`}
            incorrect={{
              why: "marketing type in the app, and a 13px field an iPhone zooms into",
              code: `<Text tag="h1" variant="h1">
  {board.name}
</Text>
<input className="h-9 rounded-lg px-3 text-body" />`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        title="Older names"
        description="Text still takes the template's names and maps each onto the scale, so older pages render the same; most existing pages use them. New code uses the new names. Don't rename old call sites in an unrelated change."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(10rem,14rem)"
              template="minmax(6rem,max-content) minmax(18rem,1fr)"
              columns={["same as", "live, under its old name"]}
              rows={LEGACY.map((l) => ({
                label: l.name,
                sub: l.also && `also ${l.also}`,
                cells: [
                  <code key="s" className="font-mono text-caption-lg text-primary-foreground">
                    {l.same}
                  </code>,
                  <Text key="l" variant={l.name} className="text-balance text-primary-foreground">
                    {l.same.startsWith("h") ? HEADING_SAMPLE : "Notes live on the images."}
                  </Text>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>
    </div>
  );
}
