"use client";

// /system/popover: Glaze's Popover and PopoverInfo (src/components/glaze/ui/popover). They open in the
// panel's theme through its stage portal. Rules from glaze-docs/popover.md
import { Button } from "@/components/glaze/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverInfo,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/glaze/ui/popover";
import { Input } from "@/components/glaze/ui/input";
import { Example, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection, Specimen } from "../SheetParts";

export default function PopoverSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Popover"
        importLine={`import {Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription, PopoverInfo} from '@/components/glaze/ui/popover'`}
      >
        Shows a few lines next to a control, on the overlay surface 6px from its trigger. PopoverInfo is the info button
        that explains a term in plain text; a tooltip only names a control.
      </SheetHeader>

      <SheetSection title="Openings" description="Press each to open it.">
        <Sheet>
          {() => (
            <div className="flex flex-wrap items-start gap-10">
              <Specimen label={<Mono>Popover</Mono>}>
                <Popover>
                  <PopoverTrigger render={<Button variant="secondary" />}>Share board</PopoverTrigger>
                  <PopoverContent>
                    <PopoverHeader>
                      <PopoverTitle>Share Spring launch</PopoverTitle>
                      <PopoverDescription>Anyone with the link sees the board and its notes.</PopoverDescription>
                    </PopoverHeader>
                    <Input mode="copy" value="curatit.app/s/7Hq2" noun="share link" aria-label="Share link" />
                    <div className="flex justify-end">
                      <PopoverClose render={<Button size="sm" variant="secondary" />}>Done</PopoverClose>
                    </div>
                  </PopoverContent>
                </Popover>
              </Specimen>
              <Specimen label={<Mono>PopoverInfo</Mono>}>
                <span className="flex items-center gap-1 type-label text-text-1">
                  Observed engagement
                  <PopoverInfo title="Observed engagement">
                    Likes and comments as they were when the post was scraped. Hidden counts read Not available.
                  </PopoverInfo>
                </span>
              </Specimen>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<Popover>
  <PopoverTrigger render={<Button variant="secondary"/>}>Share board</PopoverTrigger>
  <PopoverContent>
    <PopoverHeader><PopoverTitle>Share Spring launch</PopoverTitle></PopoverHeader>
  </PopoverContent>
</Popover>
<PopoverInfo title="Observed engagement">Likes and comments as scraped.</PopoverInfo>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Use PopoverInfo for an info icon that explains a term, with a title or label, in plain text only." },
            { kind: "do", text: "Give a popover at most one ink button; Done or Cancel beside it is secondary." },
            { kind: "do", text: "Make a hover preview's trigger a link that works on its own, and lead with the name and one line." },
            { kind: "dont", text: "Put actions in a hover preview, or add a shadow or an arrow." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
