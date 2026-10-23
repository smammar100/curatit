// /system/checkbox: Checkbox (src/components/fundations/elements/Checkbox.tsx), its two sizes in
// every state, a labelled list and a live "select all". A server component: the indeterminate
// specimens come from ../../demos/FormDemos.tsx, since that state is set through a ref
import Checkbox from "@/components/fundations/elements/Checkbox";
import Field from "@/components/fundations/molecules/Field";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection, type Theme } from "../../SheetParts";
import { MixedCheckbox, SelectAllDemo } from "../../demos/FormDemos";

// Keyboard focus forced on: the outline the box draws on focus-visible
const FOCUS = "[&_input]:outline-2 [&_input]:outline-offset-2 [&_input]:outline-brand-border-focus";

const SIZES = [
  { size: "sm", sub: "16px · dense lists, table rows" },
  { size: "md", sub: "20px · the default" },
] as const;

function states(theme: Theme, size: "sm" | "md") {
  const id = (state: string) => `${theme}-${size}-${state}`;
  const name = (state: string) => `Include Finance, ${state}`;
  return [
    <Checkbox key="off" id={id("off")} aria-label={name("off")} size={size} />,
    <Checkbox key="on" id={id("on")} aria-label={name("on")} size={size} defaultChecked />,
    <MixedCheckbox key="mixed" id={id("mixed")} aria-label={name("some")} size={size} />,
    <span key="focus" className={`flex ${FOCUS}`}>
      <Checkbox id={id("focus")} aria-label={name("focused")} size={size} defaultChecked />
    </span>,
    <Checkbox key="invalid" id={id("invalid")} aria-label={name("required")} size={size} invalid />,
    <Checkbox key="disabled" id={id("disabled")} aria-label={name("disabled")} size={size} disabled />,
    <Checkbox key="disabled-on" id={id("disabled-on")} aria-label={name("on, disabled")} size={size} disabled defaultChecked />,
  ];
}

export default function CheckboxSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Checkbox">
        A real checkbox that draws itself: a white box with the default shadow and a strong hairline, filled with the
        primary button&rsquo;s ink when it&rsquo;s checked, Phosphor&rsquo;s Check or a bar over it. For choices that
        don&rsquo;t depend on each other, and for the one &ldquo;I agree&rdquo; a form reads when it&rsquo;s sent.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: <>Independent yes/no choices, any number of them on: a token&rsquo;s scopes, the categories to include. Or a single box a form reads on submit (&ldquo;Email me the weekly edition&rdquo;).</>,
          },
          {
            term: "Instead",
            text: (
              <>
                A setting that applies the moment it&rsquo;s flipped is <Mono>Switch</Mono> (a checkbox promises
                nothing happens until you send the form). Exactly one of two to five is <Mono>Segmented</Mono>. An action
                is a <Mono>Button</Mono>. Segmented and Switch are on <Mono>/system/controls</Mono>.
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                <Mono>size</Mono> <Mono>md</Mono> (20px, the default) or <Mono>sm</Mono> (16px, for dense lists and table
                rows). Nothing else exists: no colours, no round one (that&rsquo;s a radio, which the system doesn&rsquo;t
                have; one of a few is Segmented).
              </>
            ),
          },
          {
            term: "State",
            text: (
              <>
                Native: <Mono>defaultChecked</Mono> in a server form, or <Mono>checked</Mono> with{" "}
                <Mono>onCheckedChange</Mono> (or <Mono>onChange</Mono>) in a client one. <Mono>indeterminate</Mono> is
                for a &ldquo;select all&rdquo; over a group that&rsquo;s partly on; it&rsquo;s set through a ref, so it
                works in client components only (React refuses a ref in a server one), and it&rsquo;s controlled: the
                parent recomputes it on every change.
              </>
            ),
          },
          {
            term: "Naming",
            text: (
              <>
                Inside <Mono>{'<Field layout="inline">'}</Mono>, which ties the label to it and makes the whole label line,
                gap included, click it. A box with no visible words (a table row&rsquo;s select) takes{" "}
                <Mono>aria-label</Mono> naming its row: &ldquo;Select Spring launch&rdquo;, not &ldquo;Select&rdquo;.
              </>
            ),
          },
          {
            term: "Touch",
            text: (
              <>
                The hit area reaches 44px on touch screens through an invisible <Mono>::after</Mono>. Field&rsquo;s inline
                rows grow to 44px there, so neighbouring boxes never share a tap; a list built without Field spaces its
                boxes 44px apart.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                A checkbox for something that happens at once (that&rsquo;s a Switch); a group of checkboxes standing in
                for one-of-many; red for a required box before anyone has tried to send the form; a{" "}
                <Mono>{'<div role="checkbox">'}</Mono> or a hand-drawn box (it loses Space, forms and autofill).
              </>
            ),
          },
          {
            term: "Gap",
            text: (
              <>
                The unchecked edge is <Mono>ring-border-strong</Mono>, about 1.4:1 on white. WCAG asks 3:1 for a
                control&rsquo;s boundary, and no border token reaches it yet; the label beside the box is what carries it
                until one does.
              </>
            ),
          },
        ]}
      />

      <Flow
        tree={`Yes or no, or one of a few?
 ├── Several choices, any number on → Checkbox, each in an inline Field
 ├── Some of a group, with a "select all" → the parent box indeterminate
 ├── One setting that applies at once → Switch (layout="inline-end")
 ├── Exactly one of two to five → Segmented
 └── It does something → Button`}
      />

      <SheetSection
        title="Sizes and states"
        description="Each size in every state. Keyboard focus is forced on here with the outline it draws; tab onto any box to compare. The red edge appears only once a form has been tried."
      >
        <Sheet>
          {(theme) => (
            <Matrix
              first="minmax(11rem,max-content)"
              columns={["off", "on", "some", "focus", "invalid", "disabled", "disabled · on"]}
              rows={SIZES.map(({ size, sub }) => ({ label: size, sub, cells: states(theme, size) }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="With labels"
        description="The real use: each box in an inline Field. Click a label or the gap beside the box. A hint sits under its label; the error under the one that needs it."
      >
        <Sheet split>
          {(theme) => (
            <fieldset className="flex max-w-sm flex-col gap-3">
              <legend className="mb-3 text-body-sm font-medium text-primary-foreground">Scopes</legend>
              <Field label="Read" layout="inline" description="Search the library, read posts, carousels and images">
                <Checkbox id={`${theme}-scope-read`} name="scope" value="curatit:read" defaultChecked />
              </Field>
              <Field label="Briefs" layout="inline" description="Create grounded creative briefs">
                <Checkbox id={`${theme}-scope-brief`} name="scope" value="curatit:brief" />
              </Field>
              <Field
                label="I've read how tokens are stored and what they can't do"
                layout="inline"
                error="Tick this to create the token. Tokens are shown once, so keep it somewhere safe."
              >
                <Checkbox id={`${theme}-agree`} name="agree" />
              </Field>
            </fieldset>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Select all"
        description="Live: the parent box is on when every category is, off when none is, and indeterminate between. Clicking it while indeterminate turns them all on."
      >
        <Sheet split>{() => <SelectAllDemo />}</Sheet>
        <div className="mt-6">
          <Code
            correct={`<Field label="Briefs" layout="inline" description="Create grounded creative briefs">
  <Checkbox name="scope" value="curatit:brief" checked={on} onCheckedChange={setOn} />
</Field>

{/* A client component: some of the group picked */}
<Field label="All categories" layout="inline">
  <Checkbox checked={all} indeterminate={some} onCheckedChange={() => setPicked(all ? [] : CATEGORIES)} />
</Field>`}
            incorrect={{
              why: "the forms plugin's box recoloured by hand: a brand fill (brand is for interaction) and no disabled, invalid or touch states",
              code: `<label className="flex items-start gap-3">
  <input
    type="checkbox"
    className="mt-0.5 size-4 rounded border-border-strong bg-transparent text-brand-solid checked:bg-current focus:ring-0 …"
  />
  <span>Briefs</span>
</label>`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
