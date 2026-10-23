// /system/colour: every colour token in src/styles/global.css, in both themes
import { Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection, Swatch } from "../SheetParts";
import { cx } from "@/lib/cx";

// Each token: its utility as used in markup (full class names, so Tailwind sees them), what it's
// built from in global.css, and its job. `text` tokens are shown as type, the rest as fills
type Token = { cls: string; from: string; use: string; text?: boolean };

const GROUPS: { title: string; description: string; tokens: Token[] }[] = [
  {
    title: "Surfaces",
    description: "The page is neutral; the post covers bring the colour. A surface a step lighter sits above the one under it, in both themes.",
    tokens: [
      { cls: "bg-page", from: "white", use: "The canvas (bg-white is the same)" },
      { cls: "bg-container", from: "i-container", use: "A white card, with shadow-xs as its edge" },
      { cls: "bg-card", from: "gray-a2", use: "The grey mat under images and cards" },
      { cls: "bg-modal", from: "i-modal", use: "Menus, popovers and dialogs (lighter than the page in dark)" },
      { cls: "bg-component", from: "gray-a3", use: "Chips, tertiary buttons, the segmented track" },
      { cls: "bg-component-hover", from: "gray-a4", use: "Their hover" },
      { cls: "bg-component-active", from: "gray-a5", use: "Their press" },
      { cls: "bg-component-on-container-subtle", from: "i-container-subtle", use: "A white control on a white surface: inputs, the secondary button" },
      { cls: "bg-sunken", from: "i-sunken", use: "A well below the page" },
      { cls: "bg-standout", from: "i-standout", use: "The rare dark surface: code blocks" },
      { cls: "bg-inverted-solid", from: "i-inverted", use: "The primary button" },
      { cls: "bg-disabled", from: "gray-a3", use: "A disabled control's fill" },
    ],
  },
  {
    title: "Text",
    description: "Three steps of emphasis. Tertiary is under 4.5:1, so it's for hints and placeholders, never for words that carry meaning.",
    tokens: [
      { cls: "text-primary-foreground", from: "gray-a12", use: "Headings and body", text: true },
      { cls: "text-secondary-foreground", from: "gray-a11", use: "Leads, labels, secondary copy", text: true },
      { cls: "text-tertiary-foreground", from: "gray-a9", use: "Placeholders and hints only", text: true },
      { cls: "text-disabled-foreground", from: "gray-a8", use: "Disabled labels", text: true },
      { cls: "text-on-inverted-foreground", from: "i-on-inverted", use: "Text on the primary button", text: true },
      { cls: "text-on-standout-primary-foreground", from: "i-on-standout", use: "Text on a standout surface", text: true },
    ],
  },
  {
    title: "Brand",
    description: "Curatit's terracotta in Interfere's brand roles. It's an event: hovers, focus rings, links and the accent button, never headings, body copy or panels.",
    tokens: [
      { cls: "bg-brand-solid", from: "accent-600", use: "The accent button" },
      { cls: "bg-brand-solid-hover", from: "accent-700", use: "Its hover" },
      { cls: "bg-brand-subtle", from: "accent-500 at 10%", use: "The brand badge, a selected tint" },
      { cls: "text-brand-foreground", from: "accent-600", use: "Link hovers, brand text", text: true },
      { cls: "text-on-brand-subtle-foreground", from: "accent-700", use: "Text on brand-subtle", text: true },
      { cls: "bg-brand-border-focus", from: "accent-500", use: "Every focus ring (outline-brand-border-focus)" },
    ],
  },
  {
    title: "Status",
    description: "Red is for errors only, and always comes with an icon and words. Green and amber exist for the password meter.",
    tokens: [
      { cls: "bg-danger-solid", from: "danger-500", use: "Confirming something that can't be undone" },
      { cls: "bg-danger-subtle", from: "danger-500 at 6%", use: "The error panel (AuthNotice)" },
      { cls: "text-danger-foreground", from: "danger-700", use: "A field's error note", text: true },
      { cls: "bg-danger-border-default", from: "danger-500 at 45%", use: "A field's ring when it has a problem" },
      { cls: "bg-positive-solid", from: "success-600", use: "Strength meter: strong" },
      { cls: "text-positive-foreground", from: "success-700", use: "Strength meter label", text: true },
      { cls: "bg-warning-solid", from: "warning-500", use: "Strength meter: fair" },
      { cls: "text-warning-foreground", from: "warning-700", use: "Strength meter label", text: true },
    ],
  },
  {
    title: "Borders",
    description: "Alpha tints over whatever is underneath, so an edge recedes instead of sitting on top. Rings and dividers, never border-2.",
    tokens: [
      { cls: "bg-border-subtle", from: "gray-a2", use: "Faint dividers (divide-border-subtle)" },
      { cls: "bg-border-default", from: "gray-a3", use: "Rings and dividers (ring-border-default)" },
      { cls: "bg-border-strong", from: "gray-a6", use: "The outline badge" },
      { cls: "bg-edge", from: "black / white at 10%", use: "The 1px line inside images" },
    ],
  },
];

// The older scales: still read by the dashboard and older pages, and the source of the brand
// and status tokens above. New code uses the semantic names
const BASE = [
  "bg-base-50", "bg-base-100", "bg-base-200", "bg-base-300", "bg-base-400", "bg-base-500",
  "bg-base-600", "bg-base-700", "bg-base-800", "bg-base-900", "bg-base-950",
];
const ACCENT = [
  "bg-accent-50", "bg-accent-100", "bg-accent-200", "bg-accent-300", "bg-accent-400", "bg-accent-500",
  "bg-accent-600", "bg-accent-700", "bg-accent-800", "bg-accent-900", "bg-accent-950",
];

function Sample({ token }: { token: Token }) {
  return token.text ? (
    <span
      aria-hidden
      className={cx(
        "flex h-9 w-16 items-center justify-center rounded-lg text-body-base font-medium shadow-xs",
        token.cls.startsWith("text-on-inverted") ? "bg-inverted-solid" : token.cls.startsWith("text-on-standout") ? "bg-standout" : token.cls === "text-on-brand-subtle-foreground" ? "bg-brand-subtle" : "bg-page",
        token.cls,
      )}
    >
      Aa
    </span>
  ) : (
    <Swatch className={cx("h-9 w-16", token.cls)} />
  );
}

export default function Colour() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Colour">
        Interfere&rsquo;s semantic tokens on Radix&rsquo;s neutral grey, with Curatit&rsquo;s terracotta as the
        brand. The tokens flip in dark mode; the classes never change.
      </SheetHeader>

      <Rules
        items={[
          { term: "Use", text: <>The semantic names: <Mono>bg-card</Mono>, <Mono>text-secondary-foreground</Mono>, <Mono>ring-border-default</Mono>.</> },
          { term: "Fine to read", text: <>The older <Mono>base-*</Mono> and <Mono>accent-*</Mono> scales (the dashboard uses them). They hold the same values.</> },
          { term: "Never", text: <>Tailwind&rsquo;s <Mono>gray</Mono>, <Mono>zinc</Mono> or <Mono>slate</Mono>; hex in markup; <Mono>dark:</Mono> for a colour or a shadow (the tokens already flip); accent on headings, body copy or section backgrounds.</> },
          { term: "Inline colours", text: <>In client components, <Mono>light-dark()</Mono>, so they follow the theme too.</> },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which background?
 ├── The page itself → bg-page
 ├── A grey mat under images or cards → bg-card
 ├── A white card → bg-container + shadow-xs
 ├── A menu, popover or dialog → bg-modal + shadow-lg / shadow-xl
 ├── A chip or a quiet control → bg-component (+ -hover, -active)
 └── The one main action → bg-inverted-solid (the default Button)`}
        />
        <Flow
          tree={`Which text colour?
 ├── Headings and body → text-primary-foreground
 ├── Leads, labels, meta → text-secondary-foreground
 ├── A placeholder or a hint → text-tertiary-foreground
 ├── An error → text-danger-foreground, with an icon
 └── A link on hover → text-brand-foreground`}
        />
      </div>

      {GROUPS.map((group) => (
        <SheetSection key={group.title} title={group.title} description={group.description}>
          <Sheet>
            {() => (
              <Matrix
                first="minmax(13rem,max-content)"
                template="5rem minmax(9rem,max-content) minmax(16rem,1fr)"
                columns={["sample", "built from", "use"]}
                rows={group.tokens.map((token) => ({
                  label: token.cls,
                  cells: [
                    <Sample key="s" token={token} />,
                    <Mono key="f">{token.from}</Mono>,
                    <span key="u" className="text-body-sm text-secondary-foreground">
                      {token.use}
                    </span>,
                  ],
                }))}
              />
            )}
          </Sheet>
        </SheetSection>
      ))}

      <SheetSection
        title="Scales"
        description="The primitives under the tokens. The grey reverses in dark mode; the accent loses a quarter of its chroma so it doesn't vibrate on the dark page."
      >
        <Sheet>
          {() => (
            <div className="flex flex-col gap-6">
              {[
                ["base", BASE],
                ["accent", ACCENT],
              ].map(([name, scale]) => (
                <div key={name as string}>
                  <Mono tone="primary">{name}</Mono>
                  <div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-11">
                    {(scale as string[]).map((cls) => (
                      <div key={cls} className="flex flex-col gap-1.5">
                        <Swatch className={cx("h-10", cls)} />
                        <Mono>{cls.split("-").pop()}</Mono>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Sheet>
      </SheetSection>
    </div>
  );
}
