"use client";

// /system/checkbox: Glaze's Checkbox and CheckboxGroup (src/components/glaze/ui/checkbox). Rules from
// glaze-docs/checkbox.md
import { useState } from "react";
import { Checkbox, CheckboxGroup } from "@/components/glaze/ui/checkbox";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

const FORMATS = [
  { value: "static", label: "Single images" },
  { value: "carousel", label: "Carousels" },
  { value: "video", label: "Video covers" },
];

function SelectAll() {
  const [value, setValue] = useState<string[]>(["carousel"]);
  return (
    <CheckboxGroup
      aria-label="Formats"
      value={value}
      onValueChange={setValue}
      allValues={FORMATS.map((f) => f.value)}
      className="grid gap-2"
    >
      <label className="flex items-center gap-3 type-label">
        <Checkbox parent />
        All formats
      </label>
      {FORMATS.map((f) => (
        <label key={f.value} className="ms-7 flex items-center gap-3 type-body-sm">
          <Checkbox value={f.value} />
          {f.label}
        </label>
      ))}
    </CheckboxGroup>
  );
}

export default function CheckboxSheet() {
  return (
    <SheetBody>
      <SheetHeader title="Checkbox" importLine={`import {Checkbox, CheckboxGroup} from '@/components/glaze/ui/checkbox'`}>
        Turns one option on or off, in a list or a form that waits for Save. A ticked box is small glaze, the press
        recipe drawn for 16px; mixed is a dash. For a setting that applies at once, use a switch.
      </SheetHeader>

      <SheetSection title="States" description="Hover and press a box to see its hover and held states.">
        <Sheet>
          {() => (
            <Matrix
              columns={["Off", "On", "Mixed", "Focus visible", "Invalid", "Disabled", "Disabled, on"]}
              rows={[
                {
                  label: <Mono>Checkbox</Mono>,
                  cells: [
                    <Checkbox key="0" aria-label="Off" />,
                    <Checkbox key="1" aria-label="On" defaultChecked />,
                    <Checkbox key="2" aria-label="Mixed" indeterminate />,
                    <Checkbox key="3" aria-label="Focus visible" data-force-focus-visible="" />,
                    <Checkbox key="4" aria-label="Invalid" aria-invalid />,
                    <Checkbox key="5" aria-label="Disabled" disabled />,
                    <Checkbox key="6" aria-label="Disabled, on" disabled defaultChecked />,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="With labels and select-all" description="The label wraps the box and its words, so either is the target.">
        <Sheet split>
          {() => (
            <div className="grid gap-6">
              <label className="flex items-start gap-3">
                <Checkbox defaultChecked className="mt-0.5" />
                <span>
                  <span className="block type-label text-text-1">Share notes with the link</span>
                  <span className="block type-body-sm text-text-2">Anyone with the board&rsquo;s link sees them.</span>
                </span>
              </label>
              <SelectAll />
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<label className="flex items-center gap-3 type-label">
  <Checkbox name="notes" defaultChecked/>Share notes with the link
</label>
<CheckboxGroup value={value} onValueChange={setValue} allValues={all}>
  <label><Checkbox parent/>All formats</label>
  {formats.map(f => <label key={f.value}><Checkbox value={f.value}/>{f.label}</label>)}
</CheckboxGroup>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Wrap the box and its words in one label, and say what ticking does, in the positive." },
            { kind: "do", text: "Build select-all with Checkbox parent inside a CheckboxGroup with allValues." },
            { kind: "do", text: "Use items-start on a row whose label wraps or has a description." },
            { kind: "dont", text: "Set aria-invalid on the first render; only after a submit." },
            { kind: "dont", text: "Colour a ticked box, or show mixed with a lighter fill instead of the dash." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
