"use client";

// /system/segmented-control: Glaze's SegmentedControl (src/components/glaze/ui/segmented-control).
// Rules from glaze-docs/segmented-control.md
import { SegmentedControl, SegmentedControlItem } from "@/components/glaze/ui/segmented-control";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

const SIZES = ["sm", "default", "lg"] as const;
const GRID = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export default function SegmentedSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Segmented control"
        importLine={`import {SegmentedControl, SegmentedControlItem} from '@/components/glaze/ui/segmented-control'`}
      >
        Switches between two to five views of one thing. The chosen segment is a small glaze thumb that slides to it on
        the 160ms tier. Panels of different content are tabs.
      </SheetHeader>

      <SheetSection title="Sizes and states" description="Press a segment to move the thumb; arrow keys move it too.">
        <Sheet>
          {(theme) => (
            <Matrix
              columns={["Rest", "With counts", "A disabled segment", "Fill"]}
              rows={SIZES.map((size) => ({
                label: <Mono>{size}</Mono>,
                cells: [
                  <SegmentedControl key="r" size={size} defaultValue="medium" aria-label={`Grid size, ${size}, ${theme}`}>
                    {GRID.map((g) => (
                      <SegmentedControlItem key={g.value} value={g.value}>
                        {g.label}
                      </SegmentedControlItem>
                    ))}
                  </SegmentedControl>,
                  <SegmentedControl key="c" size={size} defaultValue="all" aria-label={`Formats, ${size}, ${theme}`}>
                    <SegmentedControlItem value="all" count={162}>
                      All
                    </SegmentedControlItem>
                    <SegmentedControlItem value="carousel" count={94}>
                      Carousels
                    </SegmentedControlItem>
                  </SegmentedControl>,
                  <SegmentedControl key="d" size={size} defaultValue="small" aria-label={`Grid size with one off, ${size}, ${theme}`}>
                    {GRID.map((g) => (
                      <SegmentedControlItem key={g.value} value={g.value} disabled={g.value === "large"}>
                        {g.label}
                      </SegmentedControlItem>
                    ))}
                  </SegmentedControl>,
                  <div key="f" className="w-64">
                    <SegmentedControl fill size={size} defaultValue="light" aria-label={`Theme, ${size}, ${theme}`}>
                      <SegmentedControlItem value="light">Light</SegmentedControlItem>
                      <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
                      <SegmentedControlItem value="system">System</SegmentedControlItem>
                    </SegmentedControl>
                  </div>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<SegmentedControl value={size} onValueChange={setSize} aria-label="Grid size">
  <SegmentedControlItem value="small">Small</SegmentedControlItem>
  <SegmentedControlItem value="medium">Medium</SegmentedControlItem>
  <SegmentedControlItem value="large">Large</SegmentedControlItem>
</SegmentedControl>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Pass value or defaultValue, and name the control with aria-label or aria-labelledby." },
            { kind: "do", text: "Keep it to two to five segments of one or two words; match its size to the buttons in the row." },
            { kind: "do", text: "Put a number in count, with countMax when it changes live." },
            { kind: "dont", text: "Fill the track or a segment with a hue, or restyle the thumb." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
