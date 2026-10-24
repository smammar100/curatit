"use client";

// /system/chip: Glaze's Chip and ChipGroup (src/components/glaze/ui/chip), as a filter and as a chosen
// value. Rules from glaze-docs/chip.md
import { useRef, useState } from "react";
import { Chip, ChipGroup } from "@/components/glaze/ui/chip";
import { Field, FieldLabel } from "@/components/glaze/ui/field";
import { Input } from "@/components/glaze/ui/input";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

const BRANDS = ["Nike", "Revolut", "Duolingo", "Airbnb"];

function BrandPicker() {
  const [brands, setBrands] = useState(BRANDS);
  const field = useRef<HTMLInputElement>(null);
  return (
    <div className="grid max-w-sm gap-3">
      <Field>
        <FieldLabel>Brands you follow</FieldLabel>
        <Input
          ref={field}
          placeholder="Add a brand and press Enter"
          onKeyDown={(e) => {
            const value = e.currentTarget.value.trim();
            if (e.key === "Enter" && value && !brands.includes(value)) {
              setBrands((b) => [...b, value]);
              e.currentTarget.value = "";
            }
          }}
        />
      </Field>
      <ChipGroup aria-label="Brands you follow">
        {brands.map((b) => (
          <Chip key={b} onRemove={() => setBrands((all) => all.filter((x) => x !== b))} focusAfterEmpty={field}>
            {b}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  );
}

export default function ChipSheet() {
  return (
    <SheetBody>
      <SheetHeader title="Chip" importLine={`import {Chip, ChipGroup} from '@/components/glaze/ui/chip'`}>
        The small pill a person acts on: a filter that is on or off, or a value someone chose, with its own remove
        button. Flat, never glass: a row of filters has no lead.
      </SheetHeader>

      <SheetSection title="Kinds and states" description="Press a filter chip to turn it on; hover darkens its line.">
        <Sheet>
          {() => (
            <Matrix
              columns={["Off", "On", "With a count", "Focus visible", "Invalid", "Disabled"]}
              rows={[
                {
                  label: <Mono>filter</Mono>,
                  sub: "Toggle, aria-pressed",
                  cells: [
                    <Chip key="0">Carousels</Chip>,
                    <Chip key="1" defaultPressed>
                      Carousels
                    </Chip>,
                    <Chip key="2" count={94}>
                      Carousels
                    </Chip>,
                    <Chip key="3" data-force-focus-visible="">
                      Carousels
                    </Chip>,
                    <Chip key="4" invalid>
                      Carousels
                    </Chip>,
                    <Chip key="5" disabled>
                      Carousels
                    </Chip>,
                  ],
                },
                {
                  label: <Mono>value</Mono>,
                  sub: "With onRemove",
                  cells: [
                    <Chip key="0" onRemove={() => {}}>
                      Revolut
                    </Chip>,
                    <span key="1" className="type-caption text-text-2">
                      No on state
                    </span>,
                    <Chip key="2" onRemove={() => {}} count={12}>
                      Revolut
                    </Chip>,
                    <Chip key="3" onRemove={() => {}} data-force-focus-visible="">
                      Revolut
                    </Chip>,
                    <Chip key="4" onRemove={() => {}} invalid>
                      revolut.com
                    </Chip>,
                    <Chip key="5" onRemove={() => {}} disabled>
                      Revolut
                    </Chip>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Values in a group" description="Remove one and focus moves to its neighbour; remove the last and it returns to the field.">
        <Sheet split>{() => <BrandPicker />}</Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<ChipGroup aria-label="Brands you follow">
  {brands.map(b => <Chip key={b} onRemove={() => remove(b)} focusAfterEmpty={fieldRef}>{b}</Chip>)}
</ChipGroup>
<Chip pressed={only} onPressedChange={setOnly} count={94}>Carousels</Chip>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Put removable chips in a ChipGroup with focusAfterEmpty pointing at the field that adds them." },
            { kind: "do", text: "Make a chip removable with onRemove, and put a number in count, not in the label." },
            { kind: "do", text: "Keep a label to one to three words." },
            { kind: "dont", text: "Put glass or ink on a chip, on or off, or a Button inside one." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
