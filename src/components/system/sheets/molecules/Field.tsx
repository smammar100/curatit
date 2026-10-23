// /system/field: Field (src/components/fundations/molecules/Field.tsx): its three layouts, each
// part it adds and what it wires onto the control, and a live form checked at the right moments.
// FieldGroup, the heading over a set of controls, has its own section. A server component, like
// Field itself; the Switch rows and the form come from
// ../../demos/FormDemos.tsx, since they hold state
import Checkbox from "@/components/fundations/elements/Checkbox";
import Input from "@/components/fundations/elements/Input";
import Textarea from "@/components/fundations/elements/Textarea";
import TextLink from "@/components/fundations/elements/TextLink";
import Field, { FieldGroup } from "@/components/fundations/molecules/Field";
import { emailProblem } from "@/lib/auth";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection, type Theme } from "../../SheetParts";
import { FormDemo, SettingDemo } from "../../demos/FormDemos";

const EMAIL = { type: "email", inputMode: "email", autoComplete: "off", placeholder: "you@example.com" } as const;

function parts(theme: Theme) {
  const id = (part: string) => `${theme}-part-${part}`;
  return [
    {
      label: "label",
      sub: "always",
      specimen: (
        <Field label="Board name" className="w-full">
          <Input id={id("label")} defaultValue="Spring launch references" autoComplete="off" />
        </Field>
      ),
      wires: (
        <>
          <Mono>{"<label htmlFor>"}</Mono> to the control&rsquo;s <Mono>id</Mono> (the child&rsquo;s, or a generated one),
          and <Mono>aria-labelledby</Mono>, so a Segmented, which a label can&rsquo;t name, is named too. Drawn in the
          muted ink; click into the field and it brightens to the ink
        </>
      ),
    },
    {
      label: "description",
      sub: 'descriptionAt="label"',
      specimen: (
        <Field label="Board name" description="Only you see it, unless you share the board." className="w-full">
          <Input id={id("hint-label")} defaultValue="Spring launch references" autoComplete="off" />
        </Field>
      ),
      wires: (
        <>
          The default: read before typing. Its id joins <Mono>aria-describedby</Mono>. A caption in the muted ink
        </>
      ),
    },
    {
      label: "description",
      sub: 'descriptionAt="control"',
      specimen: (
        <Field
          label="Board name"
          description="1 to 120 characters."
          descriptionAt="control"
          className="w-full"
        >
          <Input id={id("hint-control")} defaultValue="Spring launch references" autoComplete="off" />
        </Field>
      ),
      wires: <>For a rule about the value (a format, a length) that reads best right where you type</>,
    },
    {
      label: "error",
      sub: "wraps, under the control",
      specimen: (
        <Field label="Email address" error={emailProblem("maya@northwind")} className="w-full">
          <Input id={id("error")} {...EMAIL} defaultValue="maya@northwind" />
        </Field>
      ),
      wires: (
        <>
          <Mono>aria-invalid</Mono> on the control (its ring turns red, and the label with it) and the error first in{" "}
          <Mono>aria-describedby</Mono>: red, <Mono>WarningCircle</Mono> and words, never colour alone
        </>
      ),
    },
    {
      label: "required",
      sub: "an asterisk",
      specimen: (
        <Field label="Send the board to" required className="w-full">
          <Input id={id("required")} {...EMAIL} />
        </Field>
      ),
      wires: (
        <>
          <Mono>required</Mono> on the control, which screen readers announce; the asterisk is hidden from them
        </>
      ),
    },
    {
      label: "aside",
      sub: "at the label's right",
      specimen: (
        <Field
          label="Password"
          aside={
            <TextLink href="/forgot-password" variant="quiet" className="text-caption-lg">
              Forgot password?
            </TextLink>
          }
          className="w-full"
        >
          <Input id={id("aside")} type="password" autoComplete="off" defaultValue="Moodb0ard!" />
        </Field>
      ),
      wires: <>Nothing: it&rsquo;s beside the label, not part of it. A quiet TextLink or a character count</>,
    },
    {
      label: "disabled",
      sub: "on the control",
      specimen: (
        <Field label="Workspace" description="Set by your team's owner." className="w-full">
          <Input id={id("disabled")} defaultValue="Northwind Studio" disabled />
        </Field>
      ),
      wires: <>Nothing to pass: the label dims to half opacity, as the control inside does, when it&rsquo;s disabled</>,
    },
  ];
}

export default function FieldSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Field">
        A control with its words, set since 2026-10-23 as Fluid Functionalism&rsquo;s InputField sets them: the label
        in the muted ink, brightening to the ink while its control is focused and red while it has an error, a notch in
        from the control&rsquo;s edge; a hint as a muted caption; an error in red with an icon and the fix in words; a
        required marker; an aside at the label&rsquo;s right. It wires the ids by cloning its one child, with no
        context, so it works in server components.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: <>Around every Input, Textarea, SearchField, Checkbox, Switch or Segmented that has a visible label. One control per Field, as its only child.</>,
          },
          {
            term: "Instead",
            text: (
              <>
                A control with no visible label (a search pill in a header, a row&rsquo;s select box) takes{" "}
                <Mono>aria-label</Mono> and no Field. A set of controls under one heading (checkboxes, switches, a list
                of textareas) is a <Mono>FieldGroup</Mono>: a <Mono>{"<fieldset>"}</Mono> whose{" "}
                <Mono>{"<legend>"}</Mono> is set as a Field&rsquo;s label, around Fields or controls named with{" "}
                <Mono>aria-label</Mono>.
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                <Mono>layout</Mono>: <Mono>stacked</Mono> (the default: label above, for text entry and Segmented),{" "}
                <Mono>inline</Mono> (the control at the start of the label&rsquo;s line: Checkbox) or{" "}
                <Mono>inline-end</Mono> (label first, control at the end: Switch). <Mono>descriptionAt</Mono>:{" "}
                <Mono>label</Mono> (the default) or <Mono>control</Mono>, stacked only. Nothing else.
              </>
            ),
          },
          {
            term: "Drawn",
            text: (
              <>
                The stacked label is <Mono>text-body text-muted-foreground</Mono>, turning{" "}
                <Mono>text-foreground</Mono> through <Mono>group-focus-within/field</Mono> while the control has focus,{" "}
                <Mono>text-destructive</Mono> while the control is <Mono>aria-invalid</Mono>, and half opacity while
                it&rsquo;s disabled, each in 80ms. The label row, hint and error are inset <Mono>px-2.5</Mono>, the
                notch the library sets its labels in from a field&rsquo;s edge, so the words start where the typed text
                does. The hint is <Mono>text-caption text-muted-foreground</Mono>; the error{" "}
                <Mono>text-caption text-destructive</Mono> with a 14px <Mono>WarningCircle</Mono>. An inline label is the
                ink (<Mono>text-foreground</Mono>): it&rsquo;s the thing you click, not a caption over a box.
              </>
            ),
          },
          {
            term: "It sets",
            text: (
              <>
                On the child: <Mono>id</Mono>, <Mono>aria-labelledby</Mono> (unless it has its own name),{" "}
                <Mono>aria-describedby</Mono> (the error, then the hint, after any of its own), <Mono>aria-invalid</Mono>{" "}
                while there&rsquo;s an error, and <Mono>required</Mono>. So the child must be the control itself: a{" "}
                <Mono>{"<div>"}</Mono> around it gets the id instead, and the label points at nothing.
              </>
            ),
          },
          {
            term: "Errors",
            text: (
              <>
                What&rsquo;s wrong and how to fix it, in one or two sentences: &ldquo;Enter a valid email address, like
                name@example.com.&rdquo;, never &ldquo;Invalid&rdquo;. Check on submit (focus goes to the first problem),
                on leaving a field once something&rsquo;s typed, and live in a field already showing one, so it clears the
                moment it&rsquo;s fixed. Never on the first keystrokes. A problem with the whole form (the server said no)
                is a Notice above the button, not a field&rsquo;s error.
              </>
            ),
          },
          {
            term: "Required",
            text: (
              <>
                The asterisk marks a field people could skip by mistake. In a form where every field is needed, mark none:
                a row of asterisks says nothing. Where most are optional, mark the few that aren&rsquo;t.
              </>
            ),
          },
          {
            term: "Inline rows",
            text: (
              <>
                The whole label line clicks the control, the 12px gap included. On touch screens each row grows to 44px,
                so a list of them never shares a tap between neighbours. The control centres on the first line of the
                label however long it runs.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                Two controls in one Field (the second gets no label); a label made from a <Mono>{"<p>"}</Mono> or a{" "}
                <Mono>{"<span>"}</Mono>; a placeholder doing the label&rsquo;s job; an error with no words, or red text
                without the icon; a hint that repeats the label; a label set in the ink by hand to make it
                &ldquo;stand out&rdquo; (the muted ink is the design: the typed value is what&rsquo;s read).
              </>
            ),
          },
        ]}
      />

      <Flow
        tree={`Which layout?
 ├── Text entry, a search box, a Segmented → stacked (the default)
 │     ├── The hint is needed before typing → descriptionAt="label"
 │     └── It's a rule about the value → descriptionAt="control"
 ├── A Checkbox → inline
 └── A Switch, a setting row → inline-end`}
      />

      <SheetSection
        title="Layouts"
        description="The three, with real content. Click into the field and watch its label brighten; click any label, or the gap beside a box or a switch."
      >
        <Sheet split>
          {(theme) => (
            <div className="flex max-w-sm flex-col gap-8">
              <Field label="Board name" description="Only you see it, unless you share the board.">
                <Input id={`${theme}-layout-stacked`} defaultValue="Spring launch references" autoComplete="off" />
              </Field>
              <div className="flex flex-col gap-3">
                <Field label="Email me the weekly edition" layout="inline" description="New posts from the brands you follow, on Mondays.">
                  <Checkbox id={`${theme}-layout-inline`} defaultChecked />
                </Field>
                <Field label="Include video covers" layout="inline">
                  <Checkbox id={`${theme}-layout-inline-2`} />
                </Field>
              </div>
              <div className="flex flex-col gap-3">
                <SettingDemo label="Share with a link" description="Anyone with the link sees the board and its notes." />
                <SettingDemo label="Show notes on the shared board" defaultChecked disabled />
              </div>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="FieldGroup"
        description="A heading over several controls: the legend in the ink, an optional hint under it and an error under the set. Inside, Fields, or bare controls each named with aria-label (Takeaway 1, Takeaway 2), as in the review editor. The legend never dims: one disabled control doesn't disable the question."
      >
        <Sheet split>
          {(theme) => (
            <div className="flex max-w-sm flex-col gap-8">
              <FieldGroup legend="Takeaways (3 to 5)">
                <div className="space-y-2">
                  {["Name every face the same way.", "Hold the product back until the end."].map((text, i) => (
                    <Textarea key={i} id={`${theme}-group-${i}`} aria-label={`Takeaway ${i + 1}`} rows={2} defaultValue={text} />
                  ))}
                </div>
              </FieldGroup>
              <FieldGroup legend="Adaptation ideas (1 to 3)" error="Add at least one adaptation idea.">
                <Textarea id={`${theme}-group-error`} aria-label="Adaptation idea 1" rows={2} />
              </FieldGroup>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Parts"
        description="Each part on its own, stacked, and what it puts on the control. The error column is narrow on purpose, so the message wraps as it does on a phone."
      >
        <Sheet>
          {(theme) => (
            <Matrix
              first="minmax(11rem,max-content)"
              template="minmax(16rem,20rem) minmax(16rem,1fr)"
              align="start"
              columns={["specimen", "what it wires"]}
              rows={parts(theme).map((part) => ({
                label: part.label,
                sub: part.sub,
                cells: [
                  part.specimen,
                  <span key="w" className="text-body-sm text-secondary-foreground">
                    {part.wires}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Checked at the right moments"
        description="Live. Send it empty: focus goes to the first problem. Fix the email and its error clears as you type; type a wrong one and it waits until you leave the field. The note counts in the aside and grows to six lines."
      >
        <Sheet split>{() => <FormDemo />}</Sheet>
        <div className="mt-6">
          <Code
            correct={`<Field label="Email address" error={errors.email} required>
  <Input type="email" name="email" autoComplete="email" />
</Field>

<Field label="Briefs" layout="inline" description="Create grounded creative briefs">
  <Checkbox name="scope" value="curatit:brief" />
</Field>

<Field label="Share with a link" layout="inline-end">
  <Switch label="Share with a link" labelHidden checked={shared} onCheckedChange={setShared} />
</Field>`}
            incorrect={{
              why: "a wrapper as the child, so the label and the error point at the div",
              code: `<Field label="Email address" error={errors.email}>
  <div className="relative">
    <Input type="email" name="email" />
  </div>
</Field>

<p className="text-body text-foreground">Email address</p>
<Input placeholder="Email address" />
{error && <p className="text-destructive">Invalid</p>}`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
