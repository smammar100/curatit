// /system/colour: every colour token in src/styles/global.css, in both themes. Since 2026-10-23 the
// base is Fluid Functionalism's variables (set in :root and :root[data-theme="dark"] on Curatit's
// primitives); Interfere's semantic names stay, and the ones that overlap now alias the library's
import { Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection, Swatch } from "../SheetParts";
import { cx } from "@/lib/cx";

// Each token: its utility as used in markup (full class names, so Tailwind sees them), what it's
// built from in global.css, and its job. `text` tokens are shown as type, the rest as fills
type Token = { cls: string; from: string; use: string; text?: boolean };

const GROUPS: { title: string; description: string; tokens: Token[] }[] = [
  {
    title: "The base",
    description:
      "Fluid Functionalism's variables (fluidfunctionalism.com, installed 2026-10-23 at the owner's request with its pill, compact, Phosphor and Radix settings), set in :root on Curatit's grey primitives. One ink, one ground, one stroke, two overlays, a neutral fill and a surface ladder. The library's components read these, and every older token below that overlaps is mapped onto them.",
    tokens: [
      { cls: "bg-background", from: "--background: white (oklch 15% in dark)", use: "The page. bg-page and bg-white are the same colour" },
      { cls: "text-foreground", from: "--foreground: gray-a12", use: "The ink: primary text. In dark it is white", text: true },
      { cls: "bg-foreground", from: "--foreground", use: "The ink as a fill: the primary Button, the Switch when on, the Tooltip and the Toast. Text on it is text-background" },
      { cls: "text-background", from: "--background", use: "Text on the ink: the primary Button's label, the Toast", text: true },
      { cls: "text-muted-foreground", from: "--muted-foreground: gray-a11", use: "Labels, hints, the ghost Button, Kbd, an unselected tab", text: true },
      { cls: "bg-muted", from: "--muted: gray-a3", use: "Tracks and tiles: the Segmented track, a Card's media box, EmptyState's tile" },
      { cls: "bg-[var(--accent)]", from: "--accent: gray-a5", use: "The neutral fill: the default Badge, the Switch when off. There is no bg-accent class (accent-* is the brand scale), so write the variable" },
      { cls: "bg-hover", from: "--hover: black 4% (white 6% in dark)", use: "The hover overlay: the fluid hover highlight in menus and tabs, an Input under the pointer, Skeleton, Kbd" },
      { cls: "bg-active", from: "--active: black 7% (white 10% in dark)", use: "The pressed overlay: the Tabs' current pill" },
      { cls: "bg-tint", from: "--tint: black 8% (white 25% in dark)", use: "The see-through fill of the secondary (muted) Button; tint-hover is 6.5% (20%)" },
      { cls: "bg-border", from: "--border: the ink at 12%", use: "The one stroke: border-border, ring-border, divide-border, outline-border" },
      { cls: "bg-focus-ring", from: "--focus-ring: brand-border-focus (accent-500)", use: "Every focus ring, 1px with a 2px offset: the one place the library's blue is Curatit's terracotta" },
      { cls: "text-destructive", from: "--destructive: danger-500", use: "Field's error note, the Input's invalid ring (ring-destructive/50), the danger Button", text: true },
      { cls: "bg-destructive-light", from: "--destructive-light: danger-50", use: "The library's pale red ground; the error Notice" },
      { cls: "bg-success", from: "--success: success-600", use: "Notice, positive tone: the status glyph" },
      { cls: "bg-warning", from: "--warning: warning-500", use: "Notice, warning tone: the status glyph" },
      { cls: "bg-info", from: "--info: #3b82f6 (#93c5fd in dark)", use: "The library's blue; no tone uses it yet" },
    ],
  },
  {
    title: "Surfaces",
    description:
      "Interfere's surface names. The page is neutral; the post covers bring the colour. Since 2026-10-23 a surface that floats takes a step of the library's ladder (bg-surface-N, in Shape) rather than bg-modal; the names here stay for the mat and for older pages.",
    tokens: [
      { cls: "bg-page", from: "white: the same as --background", use: "The canvas" },
      { cls: "bg-card", from: "gray-a2", use: "The grey mat under images and cards (Card mat)" },
      { cls: "bg-container", from: "i-container", use: "A white card on older pages; new cards are Card raised (bg-surface-3 shadow-surface-2)" },
      { cls: "bg-modal", from: "i-modal", use: "The dashboard's own menus and search panel (usePopover); shared Menu and Dialog sit on the ladder instead" },
      { cls: "bg-component", from: "gray-a3", use: "Chips and quiet controls on older pages" },
      { cls: "bg-component-hover", from: "gray-a4", use: "Their hover" },
      { cls: "bg-component-active", from: "gray-a5", use: "Their press" },
      { cls: "bg-inverted-solid", from: "--foreground (an alias since 2026-10-23)", use: "The ink again: older primary surfaces. Its hover and active mix 10% and 20% of the page back in" },
      { cls: "bg-sunken", from: "i-sunken", use: "A well below the page" },
      { cls: "bg-standout", from: "i-standout", use: "The rare dark surface: code blocks" },
      { cls: "bg-disabled", from: "gray-a3", use: "A disabled control's fill on older pages; the library dims the control to 50% instead" },
    ],
  },
  {
    title: "Text",
    description:
      "Three steps of emphasis. primary-foreground and secondary-foreground hold the same values as the library's foreground and muted-foreground, so either name reads the same. Tertiary is under 4.5:1, so it's for hints and placeholders, never for words that carry meaning.",
    tokens: [
      { cls: "text-primary-foreground", from: "gray-a12: the same as text-foreground", use: "Headings and body", text: true },
      { cls: "text-secondary-foreground", from: "gray-a11: the same as text-muted-foreground", use: "Leads, labels, secondary copy", text: true },
      { cls: "text-tertiary-foreground", from: "gray-a9", use: "Placeholders and hints only", text: true },
      { cls: "text-disabled-foreground", from: "gray-a8", use: "Disabled labels on older pages", text: true },
      { cls: "text-on-inverted-foreground", from: "i-on-inverted: white (black in dark)", use: "Text on the ink on older pages; the components write text-background", text: true },
      { cls: "text-on-standout-primary-foreground", from: "i-on-standout", use: "Text on a standout surface", text: true },
    ],
  },
  {
    title: "Brand",
    description:
      "Curatit's terracotta in Interfere's brand roles. It's an event: hovers, focus rings, links and the accent button, never headings, body copy or panels.",
    tokens: [
      { cls: "bg-brand-solid", from: "accent-600", use: "The accent Button (the primary recipe with the ink swapped for brand)" },
      { cls: "bg-brand-solid-hover", from: "accent-700", use: "Its hover" },
      { cls: "bg-brand-subtle", from: "accent-500 at 10%", use: "Avatar initials, a selected tint" },
      { cls: "text-brand-foreground", from: "accent-600", use: "Link hovers, brand text", text: true },
      { cls: "text-on-brand-subtle-foreground", from: "accent-700", use: "Text on brand-subtle", text: true },
      { cls: "bg-brand-border-focus", from: "accent-500", use: "The focus ring: what --focus-ring reads (3.6:1 on white, 5:1 on the dark page)" },
    ],
  },
  {
    title: "Status",
    description:
      "Red is for errors only, and always comes with an icon and words. Green and amber exist for the password meter and the Notice's glyphs. The library's destructive is the same red (danger-500).",
    tokens: [
      { cls: "bg-danger-solid", from: "danger-500: the same as --destructive", use: "Confirming something that can't be undone; the danger Button" },
      { cls: "bg-danger-subtle", from: "danger-500 at 6%", use: "The error panel (AuthNotice), the dangerSubtle Button" },
      { cls: "text-danger-foreground", from: "danger-700", use: "A field's error note on older forms; Field writes text-destructive", text: true },
      { cls: "bg-danger-border-default", from: "danger-500 at 45%", use: "A field's ring when it has a problem on older forms" },
      { cls: "bg-positive-solid", from: "success-600: the same as --success", use: "Strength meter: strong" },
      { cls: "text-positive-foreground", from: "success-700", use: "Strength meter label", text: true },
      { cls: "bg-warning-solid", from: "warning-500: the same as --warning", use: "Strength meter: fair" },
      { cls: "text-warning-foreground", from: "warning-700", use: "Strength meter label", text: true },
    ],
  },
  {
    title: "Borders",
    description:
      "One stroke since 2026-10-23. Every hairline, ring, divider and image edge is the library's --border, 12% of the ink, whichever of the older names draws it: the five rows below are one colour. Write ring-border or border-border in new code. A tint mixes with whatever is under it, so one token reads on the page, a mat and a cover.",
    tokens: [
      { cls: "bg-border", from: "--border: the ink at 12%", use: "The stroke: ring-1 ring-border, divide-y divide-border, the Input's ring, the outline Badge" },
      { cls: "bg-border-default", from: "--border (an alias)", use: "Older rings and dividers (ring-border-default)" },
      { cls: "bg-border-subtle", from: "--border (an alias)", use: "Older faint dividers; Separator's subtle variant is bg-border/60" },
      { cls: "bg-border-strong", from: "--border (an alias)", use: "Older strong hairlines" },
      { cls: "bg-edge", from: "--border (an alias)", use: "The 1px line inside images (outline-edge); Card media writes outline-border" },
    ],
  },
];

// The surface ladder: eight fills, each paired with a shadow of the same number (Shape shows the
// shadows). In light every step is white and the shadow carries the depth; in dark each step is
// a shade lighter than the one before
const SURFACES = [
  "bg-surface-1", "bg-surface-2", "bg-surface-3", "bg-surface-4",
  "bg-surface-5", "bg-surface-6", "bg-surface-7", "bg-surface-8",
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

// A type sample sits on the ground its token is meant for
function groundFor(cls: string) {
  if (cls === "text-background") return "bg-foreground";
  if (cls.startsWith("text-on-inverted")) return "bg-inverted-solid";
  if (cls.startsWith("text-on-standout")) return "bg-standout";
  if (cls === "text-on-brand-subtle-foreground") return "bg-brand-subtle";
  return "bg-page";
}

function Sample({ token }: { token: Token }) {
  return token.text ? (
    <span
      aria-hidden
      className={cx(
        "flex h-9 w-16 items-center justify-center rounded-lg text-body-base font-medium shadow-xs",
        groundFor(token.cls),
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
        Fluid Functionalism&rsquo;s variables as the base (one ink, one ground, one stroke, an eight-step
        surface ladder), Interfere&rsquo;s semantic names on top of them, and Curatit&rsquo;s terracotta as the
        brand. The tokens flip in dark mode; the classes never change.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                The library&rsquo;s names in new components: <Mono>text-foreground</Mono>, <Mono>text-muted-foreground</Mono>,{" "}
                <Mono>bg-muted</Mono>, <Mono>bg-hover</Mono>, <Mono>ring-border</Mono>, <Mono>bg-surface-3</Mono>. The semantic
                names (<Mono>bg-card</Mono>, <Mono>text-secondary-foreground</Mono>) still read the same values and are fine
                on pages.
              </>
            ),
          },
          {
            term: "Aliases",
            text: (
              <>
                Since 2026-10-23 <Mono>inverted-solid</Mono> is the ink (<Mono>--foreground</Mono>), and{" "}
                <Mono>border-default</Mono>, <Mono>border-subtle</Mono>, <Mono>border-strong</Mono> and <Mono>edge</Mono>{" "}
                are all the one stroke (<Mono>--border</Mono>). Tailwind&rsquo;s shadow names are steps of the surface
                ladder (Shape). Two names, one colour: don&rsquo;t expect them to differ.
              </>
            ),
          },
          { term: "Fine to read", text: <>The older <Mono>base-*</Mono> and <Mono>accent-*</Mono> scales (the dashboard uses them). They hold the same values.</> },
          { term: "Never", text: <>Tailwind&rsquo;s <Mono>gray</Mono>, <Mono>zinc</Mono> or <Mono>slate</Mono>; hex in markup; <Mono>dark:</Mono> for a colour or a shadow (the tokens already flip); accent on headings, body copy or section backgrounds.</> },
          { term: "Inline colours", text: <>In client components, <Mono>light-dark()</Mono> or the variables themselves (<Mono>var(--foreground)</Mono>), so they follow the theme too. The Switch&rsquo;s track and the Badge&rsquo;s brand tint are written that way.</> },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which background?
 ├── The page itself → bg-background (bg-page)
 ├── A grey mat under images or cards → bg-card
 ├── A raised card → bg-surface-3 shadow-surface-2 (Card raised)
 ├── A menu or a dialog → a step of the ladder: Menu and
 │   Dialog set it (substrate + 2, substrate + 4)
 ├── A track or a tile → bg-muted
 ├── A neutral chip or the switch at rest → bg-[var(--accent)]
 ├── Under the pointer → bg-hover; pressed or current → bg-active
 └── The one main action → bg-foreground (the default Button)`}
        />
        <Flow
          tree={`Which text colour?
 ├── Headings and body → text-foreground (text-primary-foreground)
 ├── Labels, hints, meta → text-muted-foreground (text-secondary-foreground)
 ├── A placeholder → text-tertiary-foreground
 ├── On the ink (the primary button, the toast) → text-background
 ├── An error → text-destructive, with an icon
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
        description="The primitives under the tokens. The surface ladder is all white in light (the shadows carry the depth) and climbs seven shades from the page in dark. The grey reverses in dark mode; the accent loses a quarter of its chroma so it doesn't vibrate on the dark page."
      >
        <Sheet>
          {() => (
            <div className="flex flex-col gap-6">
              <div>
                <Mono tone="primary">surface</Mono>
                <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {SURFACES.map((cls) => (
                    <div key={cls} className="flex flex-col gap-1.5">
                      <Swatch className={cx("h-10", cls)} />
                      <Mono>{cls.split("-").pop()}</Mono>
                    </div>
                  ))}
                </div>
              </div>
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
