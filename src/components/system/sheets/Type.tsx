// /system/type: Fluid Functionalism's scale as Glaze's type roles (glaze-bridge.css), the Text scale
// the marketing pages keep (fundations/elements/Text), the two families and the three weights
import Text, { type TextVariant } from "@/components/fundations/elements/Text";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";
import { cn } from "@/lib/glaze/utils";

const ROLES = [
  { role: "type-title", spec: "Hedvig 28/34, 400", job: "The one page title in the app", sample: "Saved for the spring launch" },
  { role: "type-heading", spec: "16/22, 550", job: "A section or dialog title", sample: "Creative breakdown" },
  { role: "type-heading-sm", spec: "14/20, 550", job: "A subsection, an empty state's title", sample: "Key creative decisions" },
  { role: "type-body", spec: "14/20, 400", job: "Paragraphs and descriptions", sample: "A carousel that opens on the product and ends on the price." },
  { role: "type-body-sm", spec: "13/20, 400", job: "Dense text, a card's description, a hint", sample: "Saved to 3 boards. Notes are visible on shared links." },
  { role: "type-label-lg", spec: "14/20, 550", job: "A large control", sample: "Create account" },
  { role: "type-label", spec: "13/20, 550", job: "Controls, labels, a card title", sample: "New board" },
  { role: "type-label-sm", spec: "12/16, 550", job: "A small control, a badge, a column head", sample: "Carousel" },
  { role: "type-caption", spec: "12/16, 400, tabular", job: "Meta beside a value", sample: "Posted 12 Oct · 4,218 likes" },
] as const;

const CODE_ROLES = [
  { role: "type-code", spec: "0.8 of 14px", job: "Mono beside body text", sample: "curatit_pat_8f2a91" },
  { role: "type-code-sm", spec: "0.8 of 13px", job: "Mono beside body-sm or a label", sample: "nike/carousel/C9xk2" },
  { role: "type-code-xs", spec: "0.8 of 12px", job: "Mono beside a caption", sample: "run_2026_10_24" },
  { role: "type-code-block", spec: "12/20", job: "A block of code, read line by line", sample: "npm run creative -- work" },
] as const;

const FF_ROLES = [
  { role: "text-display", spec: "28/34 (24/30)" },
  { role: "text-title", spec: "16/22 (15/20)" },
  { role: "text-subtitle", spec: "14/20 (13/18)" },
  { role: "text-body", spec: "13/20 (12/18)" },
  { role: "text-caption", spec: "12/16 (11/14)" },
  { role: "text-micro", spec: "11/14 (10/12)" },
] as const;

const TEXT_VARIANTS: { variant: TextVariant; spec: string }[] = [
  { variant: "h1", spec: "56/56 from lg, 44 from sm, 36 on phones" },
  { variant: "h2", spec: "44/56 from lg, 36 from md, 28" },
  { variant: "h3", spec: "36/44 from lg, 28 from md, 24" },
  { variant: "h4", spec: "28/36 from lg, 24" },
  { variant: "h5", spec: "24/32 from lg, 20" },
  { variant: "h6", spec: "20/24" },
  { variant: "bodyLG", spec: "18/24" },
  { variant: "body", spec: "15/24, the default" },
  { variant: "bodySM", spec: "13/20" },
  { variant: "captionLG", spec: "12/16" },
  { variant: "caption", spec: "11/16" },
];

export default function Type() {
  return (
    <SheetBody>
      <SheetHeader title="Type">
        Inter for every word, Hedvig Letters Serif for titles. In the app, Glaze&rsquo;s type roles carry Fluid
        Functionalism&rsquo;s six-step scale and its weights; the marketing, auth and share pages keep the Text
        component&rsquo;s larger scale. Each role sets size, leading, weight and tracking together, so never add a size,
        a weight or a letter-spacing beside one.
      </SheetHeader>

      <SheetSection title="Glaze roles" description="The classes for app screens and every Glaze component.">
        <Sheet>
          {() => (
            <Matrix
              columns={["Specimen", "Size and weight", "Use"]}
              rows={ROLES.map((r) => ({
                label: <Mono>{r.role}</Mono>,
                cells: [
                  <span key="s" className={cn("text-text-1", r.role)}>
                    {r.sample}
                  </span>,
                  <span key="v" className="type-caption text-text-2">
                    {r.spec}
                  </span>,
                  <span key="j" className="type-body-sm text-text-2">
                    {r.job}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Mono"
        description="Only for what a person copies: an ID, a key, a path, a command. Inline it is the mono class or <code>, at 0.8 of the text around it; beside sans it takes a type-code role."
      >
        <Sheet>
          {() => (
            <div className="grid gap-4">
              <p className="type-body text-text-1">
                Paste <code>curatit_pat_8f2a91</code> into your client&rsquo;s settings, then restart it.
              </p>
              <Matrix
                columns={["Specimen", "Size", "Use"]}
                rows={CODE_ROLES.map((r) => ({
                  label: <Mono>{r.role}</Mono>,
                  cells: [
                    <span key="s" className={cn("text-text-1", r.role)}>
                      {r.sample}
                    </span>,
                    <span key="v" className="type-caption text-text-2">
                      {r.spec}
                    </span>,
                    <span key="j" className="type-body-sm text-text-2">
                      {r.job}
                    </span>,
                  ],
                }))}
              />
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Fluid Functionalism roles"
        description="The scale under the Glaze roles, as utilities. Allowed where a line already uses them; prefer a type-* role where you rewrite one. The compact step is in brackets."
      >
        <Sheet split>
          {() => (
            <ul className="grid gap-2">
              {FF_ROLES.map((r) => (
                <li key={r.role} className="flex items-baseline justify-between gap-4 border-b border-line-faint pb-2">
                  <span className={cn("text-text-1", r.role, r.role === "text-display" && "font-display")}>
                    {r.role.replace("text-", "")}
                  </span>
                  <span className="type-caption text-text-2">
                    <Mono>{r.role}</Mono> {r.spec}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Text, for marketing pages"
        description="The marketing site, the auth card and the share page set type with Text. Headings are Hedvig in its one weight and step down on smaller screens; every page's h1 is variant h1."
      >
        <Sheet>
          {() => (
            <Matrix
              columns={["Specimen", "Size"]}
              rows={TEXT_VARIANTS.map((t) => ({
                label: <Mono>{`variant="${t.variant}"`}</Mono>,
                cells: [
                  <Text key="s" variant={t.variant} className="text-text-1">
                    {t.variant.startsWith("h") ? "Find ideas for your next post" : "Every tile is a real post."}
                  </Text>,
                  <span key="v" className="type-caption whitespace-nowrap text-text-2">
                    {t.spec}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
        <div className="mt-4">
          <Example
            code={`import Text from "@/components/fundations/elements/Text";

<Text tag="h1" variant="h1" className="text-text-1">Find ideas for your next social media post.</Text>`}
          />
        </div>
      </SheetSection>

      <SheetSection title="Families and weights" description="Two families and three weights. Hedvig has one weight and is never bold.">
        <Sheet split>
          {() => (
            <div className="grid gap-5">
              <div>
                <p className="font-display text-display text-text-1">Hedvig Letters Serif</p>
                <p className="type-caption text-text-2">
                  Titles: <Mono>type-title</Mono>, <Mono>font-display</Mono>, Text&rsquo;s headings
                </p>
              </div>
              <div>
                <p className="text-display text-text-1">Inter</p>
                <p className="type-caption text-text-2">Every other word, without its optical-size axis</p>
              </div>
              <ul className="grid gap-1">
                <li className="flex items-baseline justify-between gap-4">
                  <span className="type-body font-normal text-text-1">Regular, 400</span>
                  <span className="type-caption text-text-2">Running text</span>
                </li>
                <li className="flex items-baseline justify-between gap-4">
                  <span className="type-body font-medium text-text-1">Medium, 550</span>
                  <span className="type-caption text-text-2">
                    Labels and headings, <Mono>font-medium</Mono>
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-4">
                  <span className="type-body font-semibold text-text-1">Strong, 700</span>
                  <span className="type-caption text-text-2">
                    Rare emphasis in prose, <Mono>font-semibold</Mono>
                  </span>
                </li>
              </ul>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Set one role per line of text and let it carry the size, leading, weight and tracking." },
            { kind: "do", text: "Write sentence case, with no emoji and no em dash." },
            { kind: "dont", text: "Use Tailwind's text-sm or text-lg, a pixel font size, or fontVariationSettings for weight." },
            { kind: "dont", text: "Set text in capitals or spread its letters, or put a small label above a title." },
            { kind: "dont", text: "Set labels, headings or numbers in mono to look technical; mono is for what a person copies." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
