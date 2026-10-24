"use client";

// /system/select: Glaze's Select (src/components/glaze/ui/select), its popup and its native form.
// The popup portals into the panel's stage, so it opens in the panel's theme. Rules from glaze-docs/select.md
import { Field, FieldError, FieldLabel } from "@/components/glaze/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/glaze/ui/select";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

const SIZES = ["sm", "default", "lg"] as const;
const EXPIRY = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "365", label: "1 year" },
];

function ExpiryField({
  size = "default",
  defaultValue,
  invalid,
  disabled,
  native,
  className = "w-40",
}: {
  size?: (typeof SIZES)[number];
  defaultValue?: string;
  invalid?: boolean;
  disabled?: boolean;
  native?: boolean;
  className?: string;
}) {
  if (native) {
    return (
      <Field className={className}>
        <FieldLabel>Expires in</FieldLabel>
        <Select native items={EXPIRY} size={size} defaultValue={defaultValue} placeholder="Pick an expiry" disabled={disabled} />
      </Field>
    );
  }
  return (
    <Field className={className} invalid={invalid}>
      <FieldLabel>Expires in</FieldLabel>
      <Select items={EXPIRY} defaultValue={defaultValue ?? null} disabled={disabled}>
        <SelectTrigger size={size} aria-invalid={invalid || undefined}>
          <SelectValue placeholder="Pick an expiry" />
        </SelectTrigger>
        <SelectContent size={size === "sm" ? "sm" : "default"}>
          {EXPIRY.map((e) => (
            <SelectItem key={e.value} value={e.value}>
              {e.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {invalid && <FieldError>Pick when the token expires.</FieldError>}
    </Field>
  );
}

export default function SelectSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Select"
        importLine={`import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from '@/components/glaze/ui/select'`}
      >
        Picks one option from a short list. The trigger is the field pill; the list opens on the overlay surface with
        a check beside the chosen row. Past thirty options, or for options that load, a combobox is the answer.
      </SheetHeader>

      <SheetSection title="Sizes and states" description="Open one: its popup opens in the panel's theme.">
        <Sheet>
          {() => (
            <Matrix
              align="start"
              columns={SIZES}
              rows={[
                { label: "Placeholder", cells: SIZES.map((size) => <ExpiryField key={size} size={size} />) },
                { label: "Chosen", cells: SIZES.map((size) => <ExpiryField key={size} size={size} defaultValue="90" />) },
                { label: "Invalid", cells: SIZES.map((size) => <ExpiryField key={size} size={size} invalid />) },
                { label: "Disabled", cells: SIZES.map((size) => <ExpiryField key={size} size={size} defaultValue="90" disabled />) },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Native" description="The platform's own select on the same pill: the phone's picker and no popup.">
        <Sheet split>
          {() => (
            <ExpiryField native className="max-w-xs" />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<Field>
  <FieldLabel>Expires in</FieldLabel>
  <Select items={expiry} defaultValue="90">
    <SelectTrigger><SelectValue placeholder="Pick an expiry"/></SelectTrigger>
    <SelectContent>{expiry.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
  </Select>
</Field>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Pass the options as items on Select as well as rendering SelectItems." },
            { kind: "do", text: "Name the trigger with a FieldLabel; say what to pick in the placeholder." },
            { kind: "do", text: "Match SelectContent's size to a small trigger, and use native for a form used mostly on phones." },
            { kind: "dont", text: "Add a None option, draw a ring on the trigger, or set its height in className." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
