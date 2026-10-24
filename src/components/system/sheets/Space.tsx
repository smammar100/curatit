// /system/space: Glaze's 4px grid and sizes (tokens.css), and the marketing pages' gutter and rhythm
// (fundations/containers/Wrapper, page-start and section-y in global.css)
import { Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";
import { cn } from "@/lib/glaze/utils";

const SPACE = [
  { token: "--space-0-5", px: 2, use: "An optical nudge", w: "w-(--space-0-5)" },
  { token: "--space-1", px: 4, use: "Icon to label in a tag", w: "w-(--space-1)" },
  { token: "--space-1-5", px: 6, use: "Icon to label inside a control", w: "w-(--space-1-5)" },
  { token: "--space-2", px: 8, use: "Between controls in a row", w: "w-(--space-2)" },
  { token: "--space-3", px: 12, use: "A panel's padding, a field's text inset", w: "w-(--space-3)" },
  { token: "--space-4", px: 16, use: "Between groups in a form; the phone gutter", w: "w-(--space-4)" },
  { token: "--space-5", px: 20, use: "A dialog's padding", w: "w-(--space-5)" },
  { token: "--space-6", px: 24, use: "Between sections", w: "w-(--space-6)" },
  { token: "--space-8", px: 32, use: "Between page regions; the gutter from sm", w: "w-(--space-8)" },
  { token: "--space-10", px: 40, use: "A page's top padding", w: "w-(--space-10)" },
] as const;

const SIZES = [
  { token: "--control-sm", px: "26px", use: "A small control: button sm, chip, a card footer's action", h: "h-(--control-sm)" },
  { token: "--control", px: "32px", use: "The default control: button, input, select, segmented control", h: "h-(--control)" },
  { token: "--control-lg", px: "36px", use: "A large control, for a page's one main action", h: "h-(--control-lg)" },
  { token: "--row", px: "36px", use: "One row of a list or a table", h: "h-(--row)" },
  { token: "--menu-row", px: "32px", use: "One row of a menu (28px in a small menu)", h: "h-(--menu-row)" },
] as const;

const ICONS = [
  { token: "--icon-sm", px: "12px", use: "In a small control or a tag" },
  { token: "--icon", px: "14px", use: "In a control, the default" },
  { token: "--icon-lg", px: "16px", use: "In a large control or on its own" },
] as const;

const PAGE = [
  { what: <Mono>Wrapper</Mono>, value: "max-w-7xl, 16px gutter on phones, 32px from sm", use: "Every marketing section" },
  { what: <Mono>{`Wrapper variant="narrow"`}</Mono>, value: "max-w-xl", use: "A single column: the auth card's page, a form" },
  { what: <Mono>page-start</Mono>, value: "112px above the first line on phones, 160px from lg", use: "The first section's Wrapper" },
  { what: <Mono>section-y</Mono>, value: "Neighbours 96px apart on phones, 128px from lg", use: "Every later section's Wrapper" },
];

export default function Space() {
  return (
    <SheetBody>
      <SheetHeader title="Space and sizes">
        A 4px grid, 32px controls and 36px rows. Use the Tailwind scale (each step is 4px) or a Glaze token in brackets,
        such as <Mono>h-(--control)</Mono>; never an arbitrary pixel value.
      </SheetHeader>

      <SheetSection title="Space">
        <Sheet split>
          {() => (
            <ul className="grid gap-2">
              {SPACE.map((s) => (
                <li key={s.token} className="flex items-center gap-3">
                  <span className="flex w-12 shrink-0">
                    <span aria-hidden className={cn("block h-4 bg-ink", s.w)} />
                  </span>
                  <span className="w-28 shrink-0">
                    <Mono>{s.token}</Mono>
                  </span>
                  <span className="type-caption text-text-2">
                    {s.px}px, {s.use}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Control and row heights" description="Buttons, inputs, selects and the segmented control share one height per size, so a row of them lines up.">
        <Sheet split>
          {() => (
            <ul className="grid gap-3">
              {SIZES.map((s) => (
                <li key={s.token} className="flex items-center gap-3">
                  <span aria-hidden className={cn("block w-16 shrink-0 rounded-tag border border-line bg-paper", s.h)} />
                  <span className="min-w-0">
                    <Mono>{s.token}</Mono> <span className="type-caption text-text-2">{s.px}</span>
                    <span className="block type-caption text-text-2">{s.use}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Icon sizes" description="Pass size to Icon: 12, 14 or 16 in controls; 20 and 24 on their own; 32 and 40 only for an empty state's glyph.">
        <Sheet split>
          {() => (
            <Matrix
              columns={["Size", "Use"]}
              rows={ICONS.map((i) => ({
                label: <Mono>{i.token}</Mono>,
                cells: [
                  <span key="p" className="type-caption text-text-2">
                    {i.px}
                  </span>,
                  <span key="u" className="type-body-sm text-text-2">
                    {i.use}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Page gutter and rhythm"
        description="The marketing pages share one gutter and one rhythm: every page starts at the same line and spaces its sections the same."
      >
        <Sheet>
          {() => (
            <Matrix
              columns={["Value", "Use"]}
              rows={PAGE.map((p) => ({
                label: p.what,
                cells: [
                  <span key="v" className="type-body-sm text-text-2">
                    {p.value}
                  </span>,
                  <span key="u" className="type-body-sm text-text-2">
                    {p.use}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Group with space before reaching for a card or a rule." },
            { kind: "do", text: "Keep everything 16px from the screen's edge on phones." },
            { kind: "dont", text: <>Set a control&rsquo;s height in className; pass its size.</> },
            { kind: "dont", text: <>Put <Mono>py-*</Mono> or <Mono>pt-*</Mono> on a section&rsquo;s Wrapper; use page-start and section-y.</> },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
