"use client";

// /system/switch: Glaze's Switch (src/components/glaze/ui/switch) in a horizontal Field. Rules from
// glaze-docs/switch.md
import { useState } from "react";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/glaze/ui/field";
import { Switch } from "@/components/glaze/ui/switch";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

const SIZES = ["sm", "default"] as const;

function SharingSwitch() {
  const [on, setOn] = useState(false);
  const [saving, setSaving] = useState(false);
  return (
    <Field orientation="horizontal" className="max-w-sm">
      <FieldContent>
        <FieldLabel>Share with a link</FieldLabel>
        <FieldDescription>Anyone with the link can see the board and its notes.</FieldDescription>
      </FieldContent>
      <Switch
        checked={on}
        pending={saving}
        onCheckedChange={(next) => {
          setOn(next);
          setSaving(true);
          window.setTimeout(() => setSaving(false), 900);
        }}
      />
    </Field>
  );
}

export default function SwitchSheet() {
  return (
    <SheetBody>
      <SheetHeader title="Switch" importLine={`import {Switch} from '@/components/glaze/ui/switch'`}>
        Turns a setting on or off at once, with no Save. Off is a grey track; on, the track is small glaze. While the
        change saves, the knob turns the arc.
      </SheetHeader>

      <SheetSection title="Sizes and states" description="Hover and press a switch to see its hover and held states.">
        <Sheet>
          {() => (
            <Matrix
              columns={["Off", "On", "Focus visible", "Pending", "Invalid", "Disabled", "Disabled, on"]}
              rows={SIZES.map((size) => ({
                label: <Mono>{size}</Mono>,
                sub: size === "sm" ? "16 by 28, in a dense list" : "20 by 36, beside a label",
                cells: [
                  <Switch key="0" size={size} aria-label="Off" />,
                  <Switch key="1" size={size} aria-label="On" defaultChecked />,
                  <Switch key="2" size={size} aria-label="Focus visible" data-force-focus-visible="" />,
                  <Switch key="3" size={size} aria-label="Pending" pending defaultChecked />,
                  <Switch key="4" size={size} aria-label="Invalid" aria-invalid />,
                  <Switch key="5" size={size} aria-label="Disabled" disabled />,
                  <Switch key="6" size={size} aria-label="Disabled, on" disabled defaultChecked />,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="In a field" description="Flip it: it saves at once and shows the arc while it does.">
        <Sheet split>{() => <SharingSwitch />}</Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<Field orientation="horizontal">
  <FieldContent>
    <FieldLabel>Share with a link</FieldLabel>
    <FieldDescription>Anyone with the link can see the board.</FieldDescription>
  </FieldContent>
  <Switch checked={shared} onCheckedChange={setShared} pending={saving}/>
</Field>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Apply the change in onCheckedChange, pass pending while it saves, and set it back if it fails." },
            { kind: "do", text: "Name it with a FieldLabel in a horizontal Field, or an aria-label." },
            { kind: "dont", text: "Put a Switch in a form that waits for Save; that is a checkbox." },
            { kind: "dont", text: "Write the state into the label (On, Enabled), or colour the track green." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
