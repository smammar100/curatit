"use client";

// /system/tooltip: Glaze's Tooltip (src/components/glaze/ui/tooltip): the chip in place (TooltipChip, Glaze's
// docs specimen) and live on a row of icon buttons. Rules from glaze-docs/tooltip.md
import { Button } from "@/components/glaze/ui/button";
import { Tooltip, TooltipChip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/glaze/ui/tooltip";
import { Bookmark, Copy, Icon, ShareNetwork } from "@/components/glaze/icon";
import { Example, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection, Specimen } from "../SheetParts";

const ACTIONS = [
  { label: "Save post", glyph: Bookmark, shortcut: ["S"] },
  { label: "Copy link", glyph: Copy, shortcut: undefined },
  { label: "Share board", glyph: ShareNetwork, shortcut: undefined },
];

export default function TooltipSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Tooltip"
        importLine={`import {Tooltip, TooltipTrigger, TooltipContent, TooltipProvider} from '@/components/glaze/ui/tooltip'`}
      >
        Names a control on hover or focus, in a few words on solid ink, with its shortcut when it has one. It names; it
        never explains. A sentence of help is a PopoverInfo.
      </SheetHeader>

      <SheetSection title="The chip">
        <Sheet split>
          {() => (
            <div className="flex flex-wrap items-center gap-6">
              <Specimen label="A name">
                <TooltipChip>Copy link</TooltipChip>
              </Specimen>
              <Specimen label="With a shortcut">
                <TooltipChip shortcut={["S"]}>Save post</TooltipChip>
              </Specimen>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Live" description="Hover or focus the buttons. One provider shares the delay, so moving along the row opens each at once.">
        <Sheet split>
          {() => (
            <TooltipProvider>
              <div className="flex gap-1">
                {ACTIONS.map((a) => (
                  <Tooltip key={a.label}>
                    <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={a.label} />}>
                      <Icon icon={a.glyph} />
                    </TooltipTrigger>
                    <TooltipContent shortcut={a.shortcut}>{a.label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<Tooltip>
  <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Save post"/>}><Icon icon={Bookmark}/></TooltipTrigger>
  <TooltipContent shortcut={['S']}>Save post</TooltipContent>
</Tooltip>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Name an icon-only button with the tooltip's words, also as its aria-label." },
            { kind: "do", text: <>Write a verb and its object under 32 characters with no period; pass a shortcut as <Mono>shortcut</Mono>, one string per key.</> },
            { kind: "do", text: "Wrap a row of three or more icon buttons in one TooltipProvider." },
            { kind: "dont", text: "Put a link, a button or a sentence of help in a tooltip, or explain a disabled button in one." },
            { kind: "dont", text: "Add a tooltip to a button with a text label unless it adds the shortcut, or restyle the chip." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
