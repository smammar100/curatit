"use client";

// /system/alert: Glaze's Alert (src/components/glaze/ui/alert). Rules from glaze-docs/alert.md
import { Alert, AlertAction, AlertClose, AlertDescription, AlertTitle } from "@/components/glaze/ui/alert";
import { Button } from "@/components/glaze/ui/button";
import { Example, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection, Specimen } from "../SheetParts";

export default function AlertSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Alert"
        importLine={`import {Alert, AlertTitle, AlertDescription, AlertAction, AlertClose} from '@/components/glaze/ui/alert'`}
      >
        Reports a problem or a note about the current view, in place, and stays until it no longer applies. A neutral
        note is paper with a line; a status takes its tint and its glyph.
      </SheetHeader>

      <SheetSection title="Statuses" description="Each one names the thing in its title, in words.">
        <Sheet>
          {() => (
            <div className="grid gap-5">
              <Specimen label={<Mono>neutral, dismissible</Mono>} stretch>
                <Alert announce={false}>
                  <AlertTitle>Boards are private until you share them</AlertTitle>
                  <AlertDescription>A shared link shows the board and its notes to anyone who has it.</AlertDescription>
                  <AlertClose />
                </Alert>
              </Specimen>
              <Specimen label={<Mono>ok</Mono>} stretch>
                <Alert status="ok" announce={false}>
                  <AlertTitle>162 analyses published</AlertTitle>
                </Alert>
              </Specimen>
              <Specimen label={<Mono>warn, with an action</Mono>} stretch>
                <Alert status="warn" announce={false}>
                  <AlertTitle>Your token expires tomorrow</AlertTitle>
                  <AlertDescription>Claude Code stops reaching Curatit when it does.</AlertDescription>
                  <AlertAction>
                    <Button size="sm" variant="secondary">
                      Make a new token
                    </Button>
                  </AlertAction>
                </Alert>
              </Specimen>
              <Specimen label={<Mono>fail</Mono>} stretch>
                <Alert status="fail" announce={false}>
                  <AlertTitle>Couldn&rsquo;t load your boards</AlertTitle>
                  <AlertDescription>Check your connection, then reload the page.</AlertDescription>
                </Alert>
              </Specimen>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<Alert status="warn">
  <AlertTitle>Your token expires tomorrow</AlertTitle>
  <AlertAction><Button size="sm" variant="secondary">Make a new token</Button></AlertAction>
</Alert>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Name the thing in the title (Your token expires tomorrow), never Warning or Error." },
            { kind: "do", text: "Pick the status by the news: fail, warn, ok, or neutral for a note." },
            { kind: "do", text: "Set announce={false} on a note that is part of the page when it loads." },
            { kind: "dont", text: "Give a warn or fail alert a close button; it stays until the problem is fixed." },
            { kind: "dont", text: "Put more than one action in it, an ink action, a coloured bar on one edge or a shadow." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
