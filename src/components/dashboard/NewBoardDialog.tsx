"use client";

// Making a board, after Cosmos's "New collection": a dialog with the name set large in the middle,
// a short line saying what the board is for, a switch to share it by link, and Create. Since
// 2026-10-19 it's the shared Dialog (fundations/molecules/Dialog; since 2026-10-23 Fluid
// Functionalism's: Radix keeps focus inside, Escape closes it, the page behind can't be reached
// or scrolled, focus starts in the name and goes back to whatever opened it, and it enters on the
// slow spring). "New board" is a quiet label (titleVariant="quiet"), since the name below is the
// subject; the footer's one primary action is Create board, and the switch sits in a Field.
//
// The name and the description stay their own fields, not Input / Textarea: they are the text in
// place, transparent until focus fills them with the hover tint, the name in the display serif at
// 28px and both centred. Input's 28px pill, ring and type would turn them back into a form. They
// sit on the system's tokens and the control corner (2026-10-23).
import { useId, useState } from "react";
import Button from "@/components/fundations/elements/Button";
import Switch from "@/components/fundations/elements/Switch";
import Dialog from "@/components/fundations/molecules/Dialog";
import Field from "@/components/fundations/molecules/Field";
import { cx } from "@/lib/cx";
import { NAME_MAX, useBoards } from "./boards";

// A description is a line about the board, not a brief
export const DESCRIPTION_MAX = 160;

// The fills are alpha tints (the hover tint), so they read on the dialog's surface in both
// themes. Each field sets its own text colour (cx doesn't merge, so a second one here would fight
// it). border-0 and focus:ring-0 take off what @tailwindcss/forms gives text fields
const field =
  "w-full rounded-[20px] border-0 bg-transparent px-3 text-center transition-colors duration-80 focus:bg-hover focus:ring-0 focus:outline-hidden";

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

  // Once something's typed, a stray press on the backdrop doesn't throw it away (Escape and the
  // ✕ still close it, on purpose)
  const typed = Boolean(name.trim() || description.trim());

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="New board"
      titleVariant="quiet"
      dismissible={!typed}
      footer={
        <Button type="submit" form={formId} variant="default" disabled={!name.trim()} className="w-full">
          Create board
        </Button>
      }
    >
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
        <div className="space-y-2 pt-10 pb-10">
          <label htmlFor={`${id}-name`} className="sr-only">
            Board name
          </label>
          <input
            id={`${id}-name`}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={NAME_MAX}
            placeholder="Board name"
            autoComplete="off"
            spellCheck={false}
            className={cx(field, "py-1 font-display text-display font-light text-foreground placeholder:text-tertiary-foreground")}
          />
          <label htmlFor={`${id}-about`} className="sr-only">
            Short description
          </label>
          {/* Two lines that wrap (a centred one-line field would scroll its start out of view);
              Enter still creates the board, since a description has no line breaks */}
          <textarea
            id={`${id}-about`}
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value.replace(/\n/g, " "))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            maxLength={DESCRIPTION_MAX}
            placeholder="What’s this board for? (optional)"
            className={cx(field, "resize-none py-2 text-body pointer-coarse:text-[16px] text-pretty text-muted-foreground placeholder:text-tertiary-foreground")}
          />
        </div>

        {/* The words are the switch's label, so a tap on them flips it too */}
        <Field label="Share with a link" layout="inline-end" description="Anyone with the link can view it, read-only">
          <Switch label="Share with a link" labelHidden checked={shared} onCheckedChange={setShared} />
        </Field>
      </form>
    </Dialog>
  );
}
