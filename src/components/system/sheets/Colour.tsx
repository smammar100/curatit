// /system/colour: Glaze's colour roles (src/components/glaze/tokens.css), live in both themes. The
// surfaces read Fluid Functionalism's ladder through the bridge (src/styles/glaze-bridge.css)
import { Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";
import { cn } from "@/lib/glaze/utils";

type Role = { token: string; swatch: string; job: string };

const SURFACES: Role[] = [
  { token: "page", swatch: "bg-page", job: "The page, a half step under paper" },
  { token: "paper", swatch: "bg-paper", job: "A card's panel, a field, an overlay (surface 3)" },
  { token: "shell", swatch: "bg-shell", job: "A card's grey frame and its footer row" },
  { token: "field", swatch: "bg-field", job: "A well, a track, a grey tile" },
  { token: "code-surface", swatch: "bg-code-surface", job: "Where a block of code sits" },
  { token: "hover", swatch: "bg-hover", job: "A plain button or menu row under the pointer" },
  { token: "hover-row", swatch: "bg-hover-row", job: "A list row under the pointer" },
  { token: "pressed", swatch: "bg-pressed", job: "A held control, a selected row" },
  { token: "scrim", swatch: "bg-scrim", job: "The dim behind a dialog" },
];

const INK: Role[] = [
  { token: "ink", swatch: "bg-ink", job: "Solid ink, for a chart mark or a tooltip" },
  { token: "ink-80", swatch: "bg-(--ink-80)", job: "The text colour and the focus ring" },
  { token: "ink-60", swatch: "bg-(--ink-60)", job: "Secondary text" },
  { token: "ink-45", swatch: "bg-(--ink-45)", job: "A mark or a control's edge, never text" },
  { token: "ink-32", swatch: "bg-(--ink-32)", job: "A focused field's line" },
  { token: "ink-15", swatch: "bg-(--ink-15)", job: "A field's resting line" },
  { token: "ink-10", swatch: "bg-(--ink-10)", job: "An overlay's ring" },
  { token: "ink-06", swatch: "bg-(--ink-06)", job: "A card's edge, a row rule" },
  { token: "ink-03", swatch: "bg-(--ink-03)", job: "The faintest wash" },
];

const TEXT: { token: string; text: string; job: string }[] = [
  { token: "text-1", text: "text-text-1", job: "Headings, body, labels and values (11.9:1 on paper)" },
  { token: "text-2", text: "text-text-2", job: "Descriptions, hints and meta: the floor for anything read (5.5:1)" },
  { token: "text-3", text: "text-text-3", job: "Placeholders and icons beside a label only (3.3:1)" },
  { token: "text-disabled", text: "text-text-disabled", job: "A disabled label" },
];

const LINES: Role[] = [
  { token: "line-faint", swatch: "border-line-faint", job: "A card or panel's edge, a row rule, an image's hairline" },
  { token: "line", swatch: "border-line", job: "An overlay's ring, a divider that must read" },
  { token: "line-control", swatch: "border-line-control", job: "A field's line at rest (the components draw it)" },
  { token: "line-focus", swatch: "border-line-focus", job: "A field's line with the cursor in it" },
  { token: "line-strong", swatch: "border-line-strong", job: "The edge of an empty checkbox or switch" },
  { token: "focus", swatch: "border-focus", job: "The 2px focus ring on every focusable" },
];

const STATUS = [
  { name: "ok", mark: "bg-ok", text: "text-ok-text", tint: "bg-ok-tint", word: "Published" },
  { name: "warn", mark: "bg-warn", text: "text-warn-text", tint: "bg-warn-tint", word: "Expires tomorrow" },
  { name: "fail", mark: "bg-fail", text: "text-fail-text", tint: "bg-fail-tint", word: "Couldn't save" },
];

function SwatchList({ roles, kind }: { roles: Role[]; kind: "fill" | "line" }) {
  return (
    <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {roles.map((r) => (
        <li key={r.token} className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              "size-10 shrink-0 rounded-tag",
              kind === "fill" ? cn("border border-line-faint", r.swatch) : cn("border-2 bg-paper", r.swatch),
            )}
          />
          <span className="min-w-0">
            <Mono>{`--${r.token}`}</Mono>
            <span className="block type-caption text-text-2">{r.job}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Colour() {
  return (
    <SheetBody>
      <SheetHeader title="Colour">
        Glaze is ink and paper. Every grey is ink at an alpha, so it always sits between the text and the page it is
        on, and colour means a status: green for done, amber for a warning, coral for a failure. There is no brand
        accent; the posts are the colour. Use the roles through their classes, such as <Mono>text-text-2</Mono> and{" "}
        <Mono>bg-paper</Mono>.
      </SheetHeader>

      <SheetSection
        title="Surfaces"
        description="Paper and the shell come from Fluid Functionalism's surface ladder (see Surfaces); the washes are ink at an alpha, so they work on any surface."
      >
        <Sheet split>{() => <SwatchList roles={SURFACES} kind="fill" />}</Sheet>
      </SheetSection>

      <SheetSection title="Ink" description="Read as values (bg-(--ink-60)) only where no role fits; prefer the text and line roles built on them.">
        <Sheet split>{() => <SwatchList roles={INK} kind="fill" />}</Sheet>
      </SheetSection>

      <SheetSection title="Text" description="Two roles for anything a person reads; the third only beside a label.">
        <Sheet split>
          {() => (
            <ul className="grid gap-3">
              {TEXT.map((t) => (
                <li key={t.token} className="flex items-baseline gap-4">
                  <span className={cn("w-28 shrink-0 type-heading", t.text)}>Saved posts</span>
                  <span className="min-w-0">
                    <Mono>{t.text}</Mono>
                    <span className="block type-caption text-text-2">{t.job}</span>
                  </span>
                </li>
              ))}
              <li className="flex items-baseline gap-4">
                <span className="w-28 shrink-0 rounded-tag bg-ink px-2 type-heading text-text-inverse">On ink</span>
                <span className="min-w-0">
                  <Mono>text-text-inverse</Mono>
                  <span className="block type-caption text-text-2">Text on solid ink, as in a tooltip</span>
                </span>
              </li>
            </ul>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Lines" description="One hairline weight, from the faint edge of a card to the field line that darkens on focus.">
        <Sheet split>{() => <SwatchList roles={LINES} kind="line" />}</Sheet>
      </SheetSection>

      <SheetSection
        title="Status"
        description="Each status is a mark, a word and a tint. A status is always a glyph and a word, never a colour alone and never a dot."
      >
        <Sheet split>
          {() => (
            <ul className="grid gap-3">
              {STATUS.map((s) => (
                <li key={s.name} className="flex flex-wrap items-center gap-3">
                  <span aria-hidden className={cn("size-10 shrink-0 rounded-tag", s.mark)} />
                  <span className={cn("flex h-10 items-center rounded-(--corner-xs) px-3 type-label", s.tint, s.text)}>{s.word}</span>
                  <span className="min-w-0">
                    <Mono>{`--${s.name}, --${s.name}-text, --${s.name}-tint`}</Mono>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Carry emphasis with ink and the text roles: text-1 for what matters, text-2 for the rest." },
            { kind: "do", text: "Pair a status colour with its glyph and its word, so it never rides on hue alone." },
            { kind: "dont", text: "Write a hex, a Tailwind palette colour, base-* or accent-*, or a dark: variant; the dark theme swaps the roles and a raw value stays behind." },
            { kind: "dont", text: "Use text-3 for a sentence or a value; it is 3.3:1, for placeholders and icons only." },
            { kind: "dont", text: "Add a brand accent, a gradient or a tinted panel. Colour in the interface means a status." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
