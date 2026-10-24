"use client";

// /system/dialog: Glaze's Dialog (src/components/glaze/ui/dialog). The specimens are open in a frame
// (contained, Glaze's docs specimen: never modal), each frame its own stage portal so the dialog centres in
// it; the live one opens over the page from its trigger. Rules from glaze-docs/dialog.md
import { useState, type ReactNode } from "react";
import { GlazePortalProvider } from "@/lib/glaze/portal";
import { Button } from "@/components/glaze/ui/button";
import {
  Dialog,
  DialogAction,
  DialogBody,
  DialogClose,
  DialogConfirmField,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/glaze/ui/dialog";
import { Field, FieldLabel } from "@/components/glaze/ui/field";
import { Input } from "@/components/glaze/ui/input";
import { Example, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection, Specimen } from "../SheetParts";

/** A frame that holds a contained dialog: its translate makes it the dialog's containing block. The
 *  dialogs in frames take no focus on load (initialFocus false), or each would pull the page to it */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-80 translate-x-0 overflow-hidden rounded-overlay border border-line-faint bg-page">
      <GlazePortalProvider>{children}</GlazePortalProvider>
    </div>
  );
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function LiveDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Rename board
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Spring launch</DialogTitle>
          <DialogDescription>The new name shows on the share link at once.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input defaultValue="Spring launch" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
          <DialogAction onAction={() => wait(900)}>Rename board</DialogAction>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DialogSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Dialog"
        importLine={`import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose, DialogAction} from '@/components/glaze/ui/dialog'`}
      >
        Asks for a decision on top of the page. A card raised to the top of the surface ladder: its title, a body, and a
        footer that ends with Cancel and at most one action. An alert dialog asks one question and has no X; the scrim
        does nothing.
      </SheetHeader>

      <SheetSection title="Roles" description="Shown open in a frame. 400, 480 or 640px wide on a page.">
        <Sheet>
          {() => (
            <div className="grid gap-6 xl:grid-cols-2">
              <Specimen label={<Mono>dialog</Mono>} stretch>
                <Frame>
                  <Dialog contained defaultOpen>
                    <DialogContent initialFocus={false}>
                      <DialogHeader>
                        <DialogTitle>New board</DialogTitle>
                        <DialogDescription>Boards are private until you share them.</DialogDescription>
                      </DialogHeader>
                      <DialogBody>
                        <Field>
                          <FieldLabel>Name</FieldLabel>
                          <Input placeholder="Spring launch" />
                        </Field>
                      </DialogBody>
                      <DialogFooter>
                        <DialogClose>Cancel</DialogClose>
                        <DialogAction>Create board</DialogAction>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </Frame>
              </Specimen>
              <Specimen label={<Mono>alertdialog, destructive</Mono>} stretch>
                <Frame>
                  <Dialog contained defaultOpen role="alertdialog">
                    <DialogContent size="sm" initialFocus={false}>
                      <DialogHeader>
                        <DialogTitle>Delete Spring launch?</DialogTitle>
                        <DialogDescription>Its 12 saved posts stay in the library. The share link stops working.</DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose>Cancel</DialogClose>
                        <DialogAction variant="destructive">Delete board</DialogAction>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </Frame>
              </Specimen>
              <Specimen label={<Mono>alertdialog with confirmText</Mono>} stretch>
                <Frame>
                  <Dialog contained defaultOpen role="alertdialog" confirmText="Spring launch">
                    <DialogContent size="sm" initialFocus={false}>
                      <DialogHeader>
                        <DialogTitle>Delete Spring launch and its notes?</DialogTitle>
                      </DialogHeader>
                      <DialogBody>
                        <DialogConfirmField />
                      </DialogBody>
                      <DialogFooter>
                        <DialogClose>Cancel</DialogClose>
                        <DialogAction variant="destructive">Delete board</DialogAction>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </Frame>
              </Specimen>
              <Specimen label="Live, over the page: the action waits on its request">
                <LiveDialog />
              </Specimen>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger render={<Button variant="secondary"/>}>Rename board</DialogTrigger>
  <DialogContent>
    <DialogHeader><DialogTitle>Rename Spring launch</DialogTitle></DialogHeader>
    <DialogBody>…</DialogBody>
    <DialogFooter><DialogClose>Cancel</DialogClose><DialogAction onAction={rename}>Rename board</DialogAction></DialogFooter>
  </DialogContent>
</Dialog>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Pass open and onOpenChange; never mount the dialog only while it is open." },
            { kind: "do", text: "Return the request's promise from onAction, so the dialog waits and shows a failure in place." },
            { kind: "do", text: "Title an alert as a question that names the thing (Delete Spring launch?), never Are you sure?" },
            { kind: "do", text: "Give every dialog a DialogTitle, sr-only when the design shows none." },
            { kind: "dont", text: "Confirm an action that can be undone; do it and offer Undo in a toast." },
            { kind: "dont", text: "Set defaultAction primary beside a destructive action, or add a shadow or your own scrim." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
