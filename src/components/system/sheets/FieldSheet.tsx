"use client";

// /system/field: Glaze's Field (src/components/glaze/ui/field) around its Input
// (src/components/glaze/ui/input): the four modes by size, the states, the slots and a field that
// validates. Rules from glaze-docs/field.md and input.md
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/glaze/ui/field";
import { Input } from "@/components/glaze/ui/input";
import { Icon, Link as LinkGlyph } from "@/components/glaze/icon";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

const SIZES = ["sm", "default", "lg"] as const;

function emailProblem(value: unknown) {
  const v = String(value ?? "").trim();
  if (!v) return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter an email address like name@example.com.";
  return null;
}

export default function FieldSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Field and input"
        importLine={`import {Field, FieldLabel, FieldDescription, FieldError} from '@/components/glaze/ui/field'
import {Input} from '@/components/glaze/ui/input'`}
      >
        A Field gives one control its label, its hint and its error, and times validation: checked on blur, then on
        every change while it is wrong. Input takes one line of text in a pill whose line darkens on focus; it never
        draws a ring.
      </SheetHeader>

      <SheetSection title="Modes and sizes" description="26, 32 and 36px, to match the buttons beside them.">
        <Sheet>
          {(theme) => (
            <Matrix
              columns={SIZES}
              rows={[
                {
                  label: <Mono>text</Mono>,
                  cells: SIZES.map((size) => (
                    <Input key={size} size={size} aria-label={`Board name, ${size}, ${theme}`} placeholder="Spring launch" className="w-48" />
                  )),
                },
                {
                  label: <Mono>password</Mono>,
                  cells: SIZES.map((size) => (
                    <Input key={size} mode="password" size={size} aria-label={`Password, ${size}, ${theme}`} defaultValue="correct-horse" className="w-48" />
                  )),
                },
                {
                  label: <Mono>search</Mono>,
                  cells: SIZES.map((size) => (
                    <Input key={size} mode="search" size={size} aria-label={`Search, ${size}, ${theme}`} placeholder="Search brands" className="w-48" />
                  )),
                },
                {
                  label: <Mono>copy</Mono>,
                  cells: SIZES.map((size) => (
                    <Input key={size} mode="copy" size={size} aria-label={`Share link, ${size}, ${theme}`} value="curatit.app/s/7Hq2" noun="share link" className="w-48" />
                  )),
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="States" description="Focus a field to see its line darken.">
        <Sheet split>
          {() => (
            <Matrix
              align="start"
              columns={["Field"]}
              rows={[
                {
                  label: "Rest",
                  cells: [
                    <Field key="r" className="w-56">
                      <FieldLabel>Board name</FieldLabel>
                      <Input placeholder="Spring launch" />
                    </Field>,
                  ],
                },
                {
                  label: "Filled",
                  cells: [
                    <Field key="f" className="w-56">
                      <FieldLabel>Board name</FieldLabel>
                      <Input defaultValue="Spring launch" />
                    </Field>,
                  ],
                },
                {
                  label: "Invalid",
                  cells: [
                    <Field key="i" className="w-56" invalid>
                      <FieldLabel>Board name</FieldLabel>
                      <Input defaultValue="" />
                      <FieldError>Give the board a name.</FieldError>
                    </Field>,
                  ],
                },
                {
                  label: "Disabled",
                  cells: [
                    <Field key="d" className="w-56" disabled>
                      <FieldLabel>Board name</FieldLabel>
                      <Input defaultValue="Spring launch" />
                    </Field>,
                  ],
                },
                {
                  label: "Read only",
                  cells: [
                    <Field key="o" className="w-56">
                      <FieldLabel>Board name</FieldLabel>
                      <Input defaultValue="Spring launch" readOnly />
                    </Field>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Label, hint, slots and validation" description="Mark whichever kind is rarer in the form, required or optional. Tab out of the email field to validate it.">
        <Sheet split>
          {() => (
            <div className="grid max-w-sm gap-5">
              <Field>
                <FieldLabel optional>Description</FieldLabel>
                <Input placeholder="Launch posts we liked" />
                <FieldDescription>Shown under the board&rsquo;s name, up to 160 characters.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Website</FieldLabel>
                <Input type="url" autoComplete="url" placeholder="example.com" leading={<Icon icon={LinkGlyph} />} />
              </Field>
              <Field validate={emailProblem}>
                <FieldLabel required>Email</FieldLabel>
                <Input type="email" autoComplete="email" placeholder="name@example.com" />
                <FieldError />
              </Field>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<Field validate={emailProblem}>
  <FieldLabel>Email</FieldLabel>
  <Input type="email" autoComplete="email" placeholder="name@example.com"/>
  <FieldDescription>We send the sign-in link here.</FieldDescription>
  <FieldError/>
</Field>
<Input mode="search" aria-label="Search the library" shortcut="/"/>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Put exactly one control in a Field, with a FieldLabel; group several with FieldSet." },
            { kind: "do", text: "Say in FieldError what is wrong with this value and how to fix it, in one sentence." },
            { kind: "do", text: "Pass icons, units and buttons as leading or trailing, inside the pill; use mode=\"search\" for search." },
            { kind: "do", text: "Set type and autoComplete on an email, a URL or a phone number; make the placeholder an example." },
            { kind: "dont", text: "Let a placeholder stand in for the label, or mark required with a red asterisk." },
            { kind: "dont", text: "Validate with your own onChange check, or show an error before the first blur or submit." },
            { kind: "dont", text: "Draw a ring or a shadow to show focus, or set a field's height or radius in className." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
