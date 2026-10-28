"use client";

// Making a board, after Cosmos's "New collection": a dialog with the name set large in the middle,
// a short line saying what the board is for, a box to share it by link, and Create board. Since
// 2026-10-24 it's Glaze's Dialog: Base UI keeps focus inside, Escape closes it, the page behind is
// inert, focus starts in the name and goes back to whatever opened it. "New board" is the title,
// since the name below is the subject; the footer is Cancel and the one primary action, Create
// board. Sharing is a Checkbox, not a Switch: a switch applies at once, and this waits for Create.
//
// The name and the description are Glaze's Input (the large one) and Textarea, their text
// centred, named by aria-label since the dialog's title already says what they are for.
import { useId, useState } from "react";
import { Checkbox } from "@/components/glaze/ui/checkbox";
import { Dialog, DialogAction, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/glaze/ui/dialog";
import { Input } from "@/components/glaze/ui/input";
import { Textarea } from "@/components/glaze/ui/textarea";
import { NAME_MAX, useBoards } from "./boards";

// A description is a line about the board, not a brief
export const DESCRIPTION_MAX = 160;

export default function NewBoardDialog({ open, onClose, firstPost }: { open: boolean; onClose: () => void; firstPost?: string }) {
  const { createBoard } = useBoards();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shared, setShared] = useState(false);
  const id = useId();
  const formId = `${id}-form`;

  // Every open starts empty (reset while rendering, so the first frame is already blank)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName("");
      setDescription("");
      setShared(false);
    }
  }

  // Once something's typed, a stray press on the backdrop doesn't throw it away (Escape, Cancel
  // and the X still close it, on purpose)
  const typed = Boolean(name.trim() || description.trim());

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()} disablePointerDismissal={typed}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New board</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form
            id={formId}
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = name.trim();
              if (!trimmed) return;
              createBoard(trimmed, { description, shared, firstPost });
              onClose();
            }}
          >
            {/* The name is the first field, so the dialog puts focus there */}
            <div className="space-y-2 pt-2 pb-5">
              <Input
                size="lg"
                aria-label="Board name"
                data-autofocus=""
                required
                value={name}
                onValueChange={setName}
                maxLength={NAME_MAX}
                placeholder="Board name"
                autoComplete="off"
                spellCheck={false}
                controlClassName="text-center"
              />
              {/* Two lines that wrap (a centred one-line field would scroll its start out of view);
                  Enter still creates the board, since a description has no line breaks */}
              <Textarea
                aria-label="Short description"
                rows={2}
                value={description}
                onValueChange={(value) => setDescription(value.replace(/\n/g, " "))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                maxLength={DESCRIPTION_MAX}
                placeholder="What’s this board for? (optional)"
                className="text-center text-pretty"
              />
            </div>

            {/* The words are the box's label, so a tap on them ticks it too */}
            <label className="flex items-start gap-3">
              <Checkbox checked={shared} onCheckedChange={setShared} className="mt-0.5" />
              <span className="min-w-0">
                <span className="block type-label text-text-1">Share with a link</span>
                <span className="block type-body-sm text-text-2">Anyone with the link can view it and your notes, read-only</span>
              </span>
            </label>
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
          <DialogAction type="submit" form={formId} disabled={!name.trim()}>
            Create board
          </DialogAction>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
