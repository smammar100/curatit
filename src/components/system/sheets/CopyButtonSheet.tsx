"use client";

// /system/copy-button: Glaze's CopyButton (src/components/glaze/ui/copy-button). The states are shown
// with forceState, as Glaze's docs do; the first column copies for real. Rules from glaze-docs/copy-button.md
import { CopyButton } from "@/components/glaze/ui/copy-button";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

const ROWS = [
  { label: "ghost, glyph only", props: { variant: "ghost" as const } },
  { label: "ghost, with label", props: { variant: "ghost" as const, showLabel: true } },
  { label: "secondary, with label", props: { variant: "secondary" as const, showLabel: true } },
];

export default function CopyButtonSheet() {
  return (
    <SheetBody>
      <SheetHeader title="Copy button" importLine={`import {CopyButton} from '@/components/glaze/ui/copy-button'`}>
        Copies a value and confirms in place: the glyph turns to a check for a moment, and the button&rsquo;s name says
        what is copied.
      </SheetHeader>

      <SheetSection title="Variants and states" description="Ghost in a row or a code block; secondary only when copying is the card's own action.">
        <Sheet>
          {() => (
            <Matrix
              columns={["Rest (copies)", "Copied", "Failed", "Fetching", "Disabled"]}
              rows={ROWS.map((r) => ({
                label: r.label,
                cells: [
                  <CopyButton key="r" value="https://www.curatit.app/s/7Hq2" label="share link" {...r.props} />,
                  <CopyButton key="c" value="x" label="share link" forceState="copied" {...r.props} />,
                  <CopyButton key="f" value="x" label="share link" forceState="failed" {...r.props} />,
                  <CopyButton key="w" value="x" label="share link" forceState="fetching" {...r.props} />,
                  <CopyButton key="d" value="x" label="share link" disabled {...r.props} />,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<CopyButton value={shareUrl} label="share link"/>
<CopyButton value={() => fetchToken(id)} label="token" variant="secondary" showLabel/>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: <>Pass <Mono>label</Mono> naming what is copied: label=&quot;share link&quot; gives &ldquo;Copy share link&rdquo;.</> },
            { kind: "do", text: "Pass a function for a secret read on demand, never fetched on render." },
            { kind: "do", text: "Set showLabel where the glyph alone could be missed, such as beside a command." },
            { kind: "dont", text: "Show a toast or swap the label to confirm a copy; the button confirms in place." },
            { kind: "dont", text: "Make a copy button primary." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
