"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/fundations/elements/Button";
import { apiRequest } from "@/lib/client";

const field =
  "block w-full px-4 py-2 text-sm leading-tight bg-white border border-transparent h-10 rounded-md text-base-900 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm";

/** "New board" button + dialog. */
export default function CreateBoardForm({ label = "New board" }: { label?: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button type="button" size="base" variant="default" onClick={() => dialogRef.current?.showModal()} aria-haspopup="dialog">
        {label}
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="new-board-title"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-lg bg-base-50 p-0 text-left backdrop:bg-base-950/50 backdrop:backdrop-blur"
      >
        <form
          className="p-8"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            setError(null);
            try {
              const { id } = await apiRequest<{ id: string }>("POST", "/api/collections", { name, description });
              router.push(`/boards/${id}`);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Couldn't create the board.");
              setPending(false);
            }
          }}
        >
          <h2 id="new-board-title" className="font-display text-3xl font-light text-base-900">
            New board
          </h2>
          <p className="mt-1 text-xs text-base-500">Private by default. Only you can see it until you share a link.</p>

          <label htmlFor="board-name" className="mt-6 block text-sm font-medium text-base-600">
            Name
          </label>
          <input
            id="board-name"
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Autumn launch — sportswear"
            className={`${field} mt-1`}
            autoFocus
          />

          <label htmlFor="board-description" className="mt-4 block text-sm font-medium text-base-600">
            Private description <span className="font-normal text-base-400">(optional)</span>
          </label>
          <textarea
            id="board-description"
            maxLength={1000}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="The brief, client, or direction. Never shown on share links."
            className={`${field} mt-1 h-auto`}
          />

          <div role="alert" className="mt-2 min-h-5 text-sm text-red-700">
            {error}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" size="sm" variant="muted" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button type="submit" size="sm" variant="default" disabled={pending || !name.trim()}>
              {pending ? "Creating…" : "Create board"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
