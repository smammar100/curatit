"use client";

// /system/textarea: Glaze's Textarea (src/components/glaze/ui/textarea) in a Field. Rules from
// glaze-docs/textarea.md
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/glaze/ui/field";
import { Textarea } from "@/components/glaze/ui/textarea";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

const NOTE = "Opens on the product, then three slides of people using it. Steal the price slide.";
const LONG =
  "Opens on the product, then three slides of people using it, each with one line of copy set large over the photo. The price arrives last, on the brand's own colour, with the offer's end date under it in small type.";

export default function TextareaSheet() {
  return (
    <SheetBody>
      <SheetHeader title="Textarea" importLine={`import {Textarea} from '@/components/glaze/ui/textarea'`}>
        Takes several lines of text, in the 10px corner of a box that holds lines. It can grow with its text and carry a
        soft limit with a counter that stays quiet until the last fifth.
      </SheetHeader>

      <SheetSection title="States" description="Focus a box to see its line darken.">
        <Sheet split>
          {() => (
            <Matrix
              align="start"
              columns={["rows=3, a fixed height"]}
              rows={[
                {
                  label: "Rest",
                  cells: [
                    <Field key="r" className="w-56">
                      <FieldLabel>Note</FieldLabel>
                      <Textarea placeholder="What to steal from this post" />
                    </Field>,
                  ],
                },
                {
                  label: "Filled",
                  cells: [
                    <Field key="f" className="w-56">
                      <FieldLabel>Note</FieldLabel>
                      <Textarea defaultValue={NOTE} />
                    </Field>,
                  ],
                },
                {
                  label: "Near the limit",
                  cells: [
                    <Field key="n" className="w-56">
                      <FieldLabel>Note</FieldLabel>
                      <Textarea defaultValue={LONG.slice(0, 120)} limit={140} />
                    </Field>,
                  ],
                },
                {
                  label: "Over the limit",
                  cells: [
                    <Field key="o" className="w-56">
                      <FieldLabel>Note</FieldLabel>
                      <Textarea defaultValue={LONG} limit={140} />
                      <FieldError>Keep the note to 140 characters.</FieldError>
                    </Field>,
                  ],
                },
                {
                  label: "Disabled",
                  cells: [
                    <Field key="d" className="w-56" disabled>
                      <FieldLabel>Note</FieldLabel>
                      <Textarea defaultValue={NOTE} />
                    </Field>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Growing with its text" description="autoGrow from three lines to six, then it scrolls inside. Type in it.">
        <Sheet split>
          {() => (
            <Field className="max-w-sm">
              <FieldLabel>Note</FieldLabel>
              <Textarea autoGrow maxRows={6} limit={280} placeholder="What to steal from this post" />
              <FieldDescription>Visible to anyone with the board&rsquo;s share link.</FieldDescription>
            </Field>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<Field>
  <FieldLabel>Note</FieldLabel>
  <Textarea autoGrow maxRows={6} limit={280}/>
</Field>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Put a Textarea in a Field with a FieldLabel." },
            { kind: "do", text: "Use limit for a length cap, so a long paste is kept and marked rather than cut; never maxLength." },
            { kind: "do", text: "With autoGrow, set maxRows so a long paste scrolls inside the box." },
            { kind: "dont", text: "Make a Textarea a pill, change its corner, or draw a ring to show focus." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
