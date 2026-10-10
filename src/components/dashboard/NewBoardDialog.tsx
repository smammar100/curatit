"use client";

// Making a board, after Cosmos's "New collection": a dialog with the name set large in the middle,
// a short line saying what the board is for, a switch to share it by link, and Create. It's a
// native <dialog> (showModal), so focus stays inside, Escape closes it, the page behind can't be
// reached, and focus goes back to whatever opened it.
import { useEffect, useId, useRef, useState } from "react";
import Close from "@/components/fundations/icons/Close";
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

  const field = "w-full rounded-xl border-0 bg-transparent px-3 text-center text-base-900 transition-colors duration-150 focus:bg-base-50 focus:ring-0 focus:outline-none";

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
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[28px] border-0 bg-white p-0 text-base-900 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.4)] backdrop:bg-black/40 backdrop:backdrop-blur-sm open:animate-[menu-in_200ms_cubic-bezier(0.23,1,0.32,1)] open:backdrop:animate-[fade-in_200ms_ease-out] motion-reduce:open:animate-none dark:ring-1 dark:ring-edge"
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
          <h2 id={`${id}-title`} className="text-title font-medium text-base-500">
            New board
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 flex size-10 items-center justify-center rounded-full text-base-900 transition-[background-color,scale] duration-150 hover:bg-base-50 active:scale-[0.96]"
          >
            <Close className="size-4" />
          </button>
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
            className={cx(field, "py-1 font-display text-display font-light placeholder:text-base-300")}
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
            className={cx(field, "resize-none py-2 text-body pointer-coarse:text-[16px] text-pretty text-base-600 placeholder:text-base-400")}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <span id={`${id}-share`}>
            <span className="block text-subtitle font-medium text-base-900">Share with a link</span>
            <span className="block text-body text-base-500">Anyone with the link can view it, read-only</span>
          </span>
          <Switch on={shared} onChange={setShared} labelledBy={`${id}-share`} />
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-6 h-12 w-full rounded-full bg-base-900 text-subtitle font-medium text-white transition-[background-color,scale] duration-150 hover:bg-base-800 active:scale-[0.96] disabled:bg-base-100 disabled:text-base-500"
        >
          Create board
        </button>
      </form>
    </dialog>
  );
}

function Switch({ on, onChange, labelledBy }: { on: boolean; onChange: (on: boolean) => void; labelledBy: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!on)}
      className={cx(
        "relative flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-150 before:absolute before:-inset-2",
        on ? "bg-base-900" : "bg-base-200",
      )}
    >
      <span className={cx("size-6 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none", on && "translate-x-5")} />
    </button>
  );
}
