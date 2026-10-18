"use client";

// Making a board, after Cosmos's "New collection": a dialog with the name set large in the middle,
// a short line saying what the board is for, a switch to share it by link, and Create. It's a
// native <dialog> (showModal), so focus stays inside, Escape closes it, the page behind can't be
// reached, and focus goes back to whatever opened it. It scales in and fades, and out again a
// little faster, through the shared .dialog-motion (global.css), still under reduced motion.
import { useEffect, useId, useRef, useState } from "react";
import Close from "@/components/fundations/icons/Close";
import Button from "@/components/fundations/elements/Button";
import Switch from "@/components/fundations/elements/Switch";
import { cx } from "@/lib/cx";
import { NAME_MAX, useBoards } from "./boards";

// A description is a line about the board, not a brief
export const DESCRIPTION_MAX = 160;

export default function NewBoardDialog({ open, onClose, firstPost }: { open: boolean; onClose: () => void; firstPost?: string }) {
  const { createBoard } = useBoards();
  const ref = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shared, setShared] = useState(false);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setName("");
      setDescription("");
      setShared(false);
      dialog.showModal();
      // showModal focuses the first control (Close); the name is where typing should start
      nameRef.current?.focus();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);

  // The fills are alpha tints (card, component), so they read on the modal surface in both themes.
  // Each field sets its own text colour (cx doesn't merge, so a second one here would fight it)
  const field = "w-full rounded-xl border-0 bg-transparent px-3 text-center transition-colors duration-150 ease-out-quint focus:bg-card focus:ring-0 focus:outline-hidden";

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      // Escape: let React close it, so open stays in step
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // However it closes, open follows
      onClose={() => open && onClose()}
      // A click on the dimmed page behind (the dialog's own box, outside the card) closes it
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="dialog-motion m-auto w-[calc(100%-2rem)] max-w-md rounded-[28px] border-0 bg-modal p-0 text-primary-foreground shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <form
        className="p-6"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;
          createBoard(trimmed, { description, shared, firstPost });
          onClose();
        }}
      >
        <div className="flex items-center justify-between">
          <h2 id={`${id}-title`} className="text-title font-medium text-secondary-foreground">
            New board
          </h2>
          <Button variant="transparent" size="base" shape="pill" iconOnly onClick={onClose} aria-label="Close" className="-mr-2">
            <Close className="size-4" />
          </Button>
        </div>

        <div className="space-y-2 py-10">
          <label htmlFor={`${id}-name`} className="sr-only">
            Board name
          </label>
          <input
            ref={nameRef}
            id={`${id}-name`}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={NAME_MAX}
            placeholder="Board name"
            autoComplete="off"
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

        <div className="flex items-center justify-between gap-4">
          {/* The words are the switch's label, so a tap on them flips it too */}
          <label htmlFor={`${id}-switch`} className="min-w-0 flex-1 select-none">
            <span id={`${id}-share`} className="block text-subtitle font-medium text-primary-foreground">
              Share with a link
            </span>
            <span id={`${id}-share-note`} className="block text-body text-secondary-foreground">
              Anyone with the link can view it, read-only
            </span>
          </label>
          <Switch
            id={`${id}-switch`}
            checked={shared}
            onCheckedChange={setShared}
            aria-labelledby={`${id}-share`}
            aria-describedby={`${id}-share-note`}
          />
        </div>

        <Button type="submit" variant="default" size="xl" shape="pill" disabled={!name.trim()} className="mt-6 w-full">
          Create board
        </Button>
      </form>
    </dialog>
  );
}
