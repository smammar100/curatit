"use client";

// /system/button: Glaze's Button (src/components/glaze/ui/button), every variant by size and by
// state, built from the component itself. Rules from .design-system/glaze-docs/button.md
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/glaze/ui/button";
import { Add, Bookmark, Icon, More, TrashCan } from "@/components/glaze/icon";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

const VARIANTS = [
  { variant: "primary", label: "Save post", sub: "Ink glass, the default; one per group" },
  { variant: "destructive", label: "Delete board", sub: "Coral glass, for what can't be undone" },
  { variant: "confirm", label: "Approve analysis", sub: "Green glass, saying yes to something waiting" },
  { variant: "secondary", label: "Not now", sub: "The flat card surface" },
  { variant: "ghost", label: "Copy link", sub: "Plain, for a quiet action in a row" },
] as const;

const SIZES = ["sm", "default", "lg"] as const;
const ICON_SIZES = ["icon-sm", "icon", "icon-lg"] as const;

function PendingDemo() {
  const [saving, setSaving] = useState(false);
  return (
    <Button
      pending={saving}
      pendingLabel="Saving"
      onClick={() => {
        setSaving(true);
        window.setTimeout(() => setSaving(false), 1600);
      }}
    >
      Save post
    </Button>
  );
}

export default function ButtonSheet() {
  return (
    <SheetBody>
      <SheetHeader title="Button" importLine={`import {Button} from '@/components/glaze/ui/button'`}>
        Starts an action on this page. The primary family is glass (ink, coral, green) and a group leads with at most
        one of them; every other action beside it is the flat secondary. A control that goes to another page is a link.
      </SheetHeader>

      <SheetSection title="Variants and sizes" description="26, 32 and 36px tall. Icon sizes are square and need an aria-label.">
        <Sheet>
          {() => (
            <Matrix
              columns={[...SIZES, ...ICON_SIZES]}
              rows={VARIANTS.map((v) => ({
                label: <Mono>{v.variant}</Mono>,
                sub: v.sub,
                cells: [
                  ...SIZES.map((size) => (
                    <Button key={size} variant={v.variant} size={size}>
                      {v.label}
                    </Button>
                  )),
                  ...ICON_SIZES.map((size) => (
                    <Button key={size} variant={v.variant} size={size} aria-label={`${v.label}, ${size}`}>
                      <Icon icon={v.variant === "destructive" ? TrashCan : v.variant === "ghost" ? More : Bookmark} />
                    </Button>
                  )),
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="States"
        description="Hover and press any button to see its hover and held states. Focus shows the 2px ink ring on every variant; disabled drops glass and flat alike to one grey pill; pending keeps the name and the width and turns the arc."
      >
        <Sheet>
          {() => (
            <Matrix
              columns={["Rest", "Focus visible", "Disabled", "Pending"]}
              rows={VARIANTS.map((v) => ({
                label: <Mono>{v.variant}</Mono>,
                cells: [
                  <Button key="r" variant={v.variant}>
                    {v.label}
                  </Button>,
                  <Button key="f" variant={v.variant} data-force-focus-visible="">
                    {v.label}
                  </Button>,
                  <Button key="d" variant={v.variant} disabled>
                    {v.label}
                  </Button>,
                  <Button key="p" variant={v.variant} pending pendingLabel="Working">
                    {v.label}
                  </Button>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="In use" description="A group, an icon before the words, a link drawn as a button, and a press that waits on a request.">
        <Sheet split>
          {() => (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary">Cancel</Button>
                <Button variant="destructive">Delete board</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary">
                  <Icon icon={Add} />
                  New board
                </Button>
                <Button variant="secondary" render={<Link href="/dashboard" />} nativeButton={false}>
                  Open your feed
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PendingDemo />
                <span className="type-caption text-text-2">Press it: pending for 1.6s</span>
              </div>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<Button variant="secondary">Not now</Button>
<Button pending={saving} pendingLabel="Saving" onClick={save}>Save post</Button>
<Button render={<Link href="/signup"/>} nativeButton={false}>Create account</Button>
<Button size="icon-sm" variant="ghost" aria-label="More for this board"><Icon icon={More}/></Button>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Lead a card, footer, dialog or row with at most one primary; make every other action secondary." },
            { kind: "do", text: "Pick primary unless the action means loss (destructive) or approval of something waiting (confirm)." },
            { kind: "do", text: "Pass pending as a boolean from the first render with pendingLabel; set type=\"submit\" on a form's button." },
            { kind: "do", text: "Use sm in a card footer or a row, the default in forms and toolbars, lg for a page's one main action." },
            { kind: "dont", text: "Wrap a Button in a link; render it as the link with render and nativeButton={false}." },
            { kind: "dont", text: "Pass fills, heights, radii, type or shadows in className; it is for placement only." },
            { kind: "dont", text: "Leave an icon-only button without an aria-label." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
