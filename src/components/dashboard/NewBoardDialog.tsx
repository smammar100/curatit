"use client";

// Making a board, after Cosmos's "New collection": a dialog with the name set large in the middle,
// a short line saying what the board is for, a switch to share it by link, and Create. Since
// 2026-10-19 it's the shared Dialog (fundations/molecules/Dialog): showModal keeps focus inside,
// Escape closes it, the page behind can't be reached or scrolled, focus starts in the name and goes
// back to whatever opened it (Create in the header), and it scales in and fades through
// .dialog-motion. Its own look rides on two Dialog options: the 28px corners (radius="large") and
// "New board" as a quiet label (titleVariant="quiet"), since the name below is the subject.
//
// The name and the description stay their own fields, not Input / Textarea: they are the text in
// place, transparent until focus fills them with bg-card, the name in the display serif at 28px.
// Input's surface, height and type would turn them back into a form.
import { useId, useState } from "react";
import Button from "@/components/fundations/elements/Button";
import Switch from "@/components/fundations/elements/Switch";
import Dialog from "@/components/fundations/molecules/Dialog";
import Field from "@/components/fundations/molecules/Field";
import { cx } from "@/lib/cx";
import { NAME_MAX, useBoards } from "./boards";

// A description is a line about the board, not a brief
export const DESCRIPTION_MAX = 160;

// The fills are alpha tints (card), so they read on the modal surface in both themes. Each field
// sets its own text colour (cx doesn't merge, so a second one here would fight it)
const field =
  "w-full rounded-xl border-0 bg-transparent px-3 text-center transition-colors duration-150 ease-out-quint focus:bg-card focus:ring-0 focus:outline-hidden";

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
      radius="large"
      dismissible={!typed}
      footer={
        <Button type="submit" form={formId} variant="default" size="xl" shape="pill" disabled={!name.trim()} className="w-full">
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
            className={cx(field, "py-1 font-display text-display font-light text-primary-foreground placeholder:text-tertiary-foreground")}
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
            className={cx(field, "resize-none py-2 text-body pointer-coarse:text-[16px] text-pretty text-secondary-foreground placeholder:text-tertiary-foreground")}
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
