// /system/textarea: Textarea (src/components/fundations/elements/Textarea.tsx), the Input's recipe
// on several lines: its sizes in every state, the two resize choices and autoResize. A server
// component; the autoResize specimen grows as you type with no script (CSS field-sizing)
import Textarea from "@/components/fundations/elements/Textarea";
import Field from "@/components/fundations/molecules/Field";
import { Code, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection, type Theme } from "../../SheetParts";

// Focus forced on with what a focused textarea draws: the card surface (focus:bg-surface-3) and
// the page's 1px focus outline. A descendant selector outranks its rest fill and, with :hover,
// its hover tint; the red ring is a separate property and stays
const FOCUS =
  "[&_textarea]:bg-surface-3 [&_textarea:hover]:bg-surface-3 [&_textarea]:outline-1 [&_textarea]:outline-offset-2 [&_textarea]:outline-[color:var(--focus-ring)]";

const NOTE =
  "Start with the second slide: the type sits on the photo's horizon, and the colour comes from the product, not the brand.";
const TOO_LONG = `${NOTE} Then the third, where the grid breaks on purpose to make room for the price, and the last, which repeats the hook.`;

function states(theme: Theme, size: "md" | "lg") {
  const id = (state: string) => `${theme}-${size}-${state}`;
  const base = { size, rows: 3, className: "w-full", resize: "none" } as const;
  return [
    <Textarea key="rest" id={id("rest")} aria-label="Note, at rest" placeholder="What should they look at first?" {...base} />,
    <Textarea key="filled" id={id("filled")} aria-label="Note, filled" defaultValue={NOTE} {...base} />,
    <div key="focus" className={`w-full ${FOCUS}`}>
      <Textarea id={id("focus")} aria-label="Note, focused" defaultValue={NOTE} size={size} rows={3} resize="none" />
    </div>,
    <Textarea key="invalid" id={id("invalid")} aria-label="Note, too long" invalid defaultValue={TOO_LONG} {...base} />,
    <Textarea key="disabled" id={id("disabled")} aria-label="Note, disabled" disabled defaultValue={NOTE} {...base} />,
  ];
}

export default function TextareaSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Textarea">
        Several lines of text on the Input&rsquo;s recipe: the same 1px ring on no fill, hover tint, card surface
        while focused, red ring and touch-screen size. Its corners are the shape&rsquo;s container radius, 24px, a
        block of text wanting the larger corner as a card does; its first row is exactly an Input&rsquo;s height, so
        the two line up side by side. It can grow with its text, in CSS alone.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: <>Text that may run past one line: a board&rsquo;s description, a note on a saved post, a message to support. In a Field, like every control.</>,
          },
          {
            term: "Instead",
            text: <>One line (a name, an email, a title) is <Mono>Input</Mono>: a textarea there invites line breaks the value can&rsquo;t keep.</>,
          },
          {
            term: "The set",
            text: (
              <>
                <Mono>size</Mono> <Mono>md</Mono> (the default) or <Mono>lg</Mono>, the Input&rsquo;s two, both the
                compact step (<Mono>lg</Mono> is kept for call sites and renders the same). <Mono>resize</Mono>{" "}
                <Mono>vertical</Mono> (the default: a person can drag it
                taller) or <Mono>none</Mono> (a box whose size the layout owns). <Mono>autoResize</Mono> with an optional{" "}
                <Mono>maxRows</Mono>. Nothing else: no horizontal resize, which would push out of its column.
              </>
            ),
          },
          {
            term: "Drawn",
            text: (
              <>
                Input&rsquo;s <Mono>fieldClass</Mono> (<Mono>ring-1 ring-border bg-transparent hover:bg-hover
                focus:bg-surface-3 aria-invalid:ring-destructive/50 disabled:opacity-50</Mono>) with{" "}
                <Mono>rounded-[24px]</Mono> from the shape provider, where Input takes <Mono>rounded-[20px]</Mono>. The
                padding makes one row the control height: <Mono>px-2.5 py-[5px]</Mono> round an 18px line in md
                (5 + 18 + 5 = 28), <Mono>px-3 py-2</Mono> round a 20px line in lg (8 + 20 + 8 = 36).
              </>
            ),
          },
          {
            term: "Height",
            text: (
              <>
                <Mono>rows</Mono>, 3 by default: the first row is 28px (the control height, in md and lg alike), each
                row after it one 18px line. Never an <Mono>h-*</Mono> class: it fights <Mono>rows</Mono> and clips the
                last line at 16px on touch screens.
              </>
            ),
          },
          {
            term: "autoResize",
            text: (
              <>
                <Mono>field-sizing: content</Mono>: the browser grows it while laying out the page, so there&rsquo;s no
                measuring script and no jump a frame late. It never goes below <Mono>rows</Mono> (a floor of that many
                lines plus the padding, set in <Mono>lh</Mono> units), stops at <Mono>maxRows</Mono> and scrolls after
                that. Where it isn&rsquo;t supported yet (Firefox, older Safari) it stays at <Mono>rows</Mono> and
                scrolls, which is a plain textarea. It turns the drag handle off. Give it a <Mono>maxRows</Mono>, or one
                long paste pushes the page down.
              </>
            ),
          },
          {
            term: "Limits",
            text: (
              <>
                A limit people will reach shows as a count in Field&rsquo;s <Mono>aside</Mono> (&ldquo;96 / 160&rdquo;),
                and the error says how much to cut. <Mono>maxLength</Mono> alone cuts a paste off without a word.
              </>
            ),
          },
          {
            term: "Sending",
            text: (
              <>
                Enter makes a new line, so a form with a textarea has a submit button. In a client form,{" "}
                <Mono>Cmd/Ctrl+Enter</Mono> can send it too (<Mono>form.requestSubmit()</Mono>).
              </>
            ),
          },
          {
            term: "Never",
            text: <>A placeholder as the label; colour, padding or radius in <Mono>className</Mono> (it&rsquo;s for layout and lands on a wrapper); a raw <Mono>&lt;textarea&gt;</Mono> styled to look like this one.</>,
          },
        ]}
      />

      <SheetSection
        title="Sizes and states"
        description="Both sizes in every state, at three rows. Focus is forced on with what a focused textarea draws: the card surface and the page's 1px outline. The red ring is the danger colour at half strength; disabled is the whole box at half opacity."
      >
        <Sheet>
          {(theme) => (
            <Matrix
              first="minmax(9rem,max-content)"
              template="repeat(5, minmax(14rem,1fr))"
              columns={["rest", "filled", "focus", "invalid", "disabled"]}
              rows={[
                { label: "md", sub: "12/18 · 28px, then 18px a row", cells: states(theme, "md") },
                { label: "lg", sub: "the same as md, kept for call sites", cells: states(theme, "lg") },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Resizing"
        description="Drag the corner of the first; the second's size is the layout's; type into the third to watch it grow from one row to five, then scroll."
      >
        <Sheet split>
          {(theme) => (
            <div className="flex max-w-sm flex-col gap-6">
              <Field label="Description" description='resize="vertical", the default'>
                <Textarea id={`${theme}-vertical`} rows={2} defaultValue="Launch posts that sell one feature with one photo." />
              </Field>
              <Field label="Note on this post" description='resize="none"'>
                <Textarea id={`${theme}-none`} rows={2} resize="none" defaultValue={NOTE} />
              </Field>
              <Field label="Message" description="autoResize, rows={1}, maxRows={5}">
                <Textarea id={`${theme}-auto`} rows={1} autoResize maxRows={5} placeholder="Type a few lines…" />
              </Field>
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`<Field
  label="Description"
  description="What's this board for?"
  aside={<span className="text-caption-lg text-secondary-foreground">{text.length} / 160</span>}
  error={text.length > 160 ? \`Keep it to 160 characters. Cut \${text.length - 160}.\` : undefined}
>
  <Textarea name="description" rows={2} autoResize maxRows={6} value={text} onChange={(e) => setText(e.target.value)} />
</Field>`}
            incorrect={{
              why: "a raw textarea with a fixed height, sideways resize and a placeholder for a label",
              code: `<textarea
  placeholder="Description"
  maxLength={160}
  className="h-32 w-full resize rounded-[24px] bg-surface-3 px-3 py-2 ring-1 ring-border"
/>`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
