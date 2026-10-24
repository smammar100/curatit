"use client";

// /system/collapsible: Glaze's Collapsible and CollapsibleGroup (src/components/glaze/ui/collapsible).
// Rules from glaze-docs/collapsible.md
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleGroup,
  CollapsibleTrigger,
} from "@/components/glaze/ui/collapsible";
import { Example, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection, Specimen } from "../SheetParts";

const FAQ = [
  { q: "Do shared links expire?", a: "No. A link stops working only when you turn sharing off, which makes a new one." },
  { q: "Can people see my notes?", a: "Anyone with a board's share link sees its notes." },
  { q: "Is Curatit free?", a: "It is free while Curatit is in beta, with everything included." },
];

export default function CollapsibleSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Collapsible"
        importLine={`import {Collapsible, CollapsibleGroup, CollapsibleTrigger, CollapsibleContent} from '@/components/glaze/ui/collapsible'`}
      >
        Shows and hides a region. On its own the trigger is a pill with a caret; in a group each trigger is a 36px row,
        on one paper box (framed) or between hairlines (plain).
      </SheetHeader>

      <SheetSection title="Forms" description="Open them. The summary shows while a region is closed.">
        <Sheet>
          {() => (
            <div className="grid gap-6 lg:grid-cols-2">
              <Specimen label="Single, default and sm, with a summary">
                <div className="grid w-full gap-2">
                  <Collapsible>
                    <CollapsibleTrigger summary="2 potential concerns" summaryStatus="warn">
                      Data checks
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      The chart starts its axis at 40, and the period isn&rsquo;t labelled.
                    </CollapsibleContent>
                  </Collapsible>
                  <Collapsible>
                    <CollapsibleTrigger size="sm">Caveats</CollapsibleTrigger>
                    <CollapsibleContent>Slides 4 and 5 have no record, so they weren&rsquo;t read.</CollapsibleContent>
                  </Collapsible>
                  <Collapsible disabled>
                    <CollapsibleTrigger summary="0">Older drafts</CollapsibleTrigger>
                  </Collapsible>
                </div>
              </Specimen>
              <Specimen label={<Mono>framed group</Mono>}>
                <CollapsibleGroup className="w-full">
                  {FAQ.map((f) => (
                    <Collapsible key={f.q} value={f.q}>
                      <CollapsibleTrigger>{f.q}</CollapsibleTrigger>
                      <CollapsibleContent>{f.a}</CollapsibleContent>
                    </Collapsible>
                  ))}
                </CollapsibleGroup>
              </Specimen>
              <Specimen label={<Mono>plain group, inside a card</Mono>}>
                <CollapsibleGroup variant="plain" className="w-full">
                  {FAQ.slice(0, 2).map((f) => (
                    <Collapsible key={f.q} value={f.q}>
                      <CollapsibleTrigger>{f.q}</CollapsibleTrigger>
                      <CollapsibleContent>{f.a}</CollapsibleContent>
                    </Collapsible>
                  ))}
                </CollapsibleGroup>
              </Specimen>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<Collapsible>
  <CollapsibleTrigger summary="2 potential concerns" summaryStatus="warn">Data checks</CollapsibleTrigger>
  <CollapsibleContent>…</CollapsibleContent>
</Collapsible>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Name what is inside in the trigger (Data checks), never Show more." },
            { kind: "do", text: "Pass summary with the count and the one fact that matters, with summaryStatus for a problem." },
            { kind: "do", text: "Use plain for a group inside a card, framed only on its own; disable an empty region and say 0." },
            { kind: "dont", text: "Put glass or a Button look on the trigger, or add a plus or a second chevron." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
