"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { apiRequest, ApiError } from "@/lib/client";

type BoardOption = { id: string; name: string; saved: boolean };

const inputClass =
  "block w-full px-3 py-2 text-sm leading-tight bg-white border border-transparent h-9 rounded-md text-base-900 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none";

/**
 * "Save" action + dialog: choose one or more boards, or create one inline.
 * Saving is idempotent; boards that already hold the post show as saved.
 */
export default function SaveButton({ postId, compact = false }: { postId: string; compact?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [boards, setBoards] = useState<BoardOption[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "creating">("idle");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  async function load() {
    setStatus("loading");
    setError(null);
    try {
      const data = await apiRequest<{ boards: BoardOption[] }>("GET", `/api/creatives/${postId}/boards`);
      setBoards(data.boards);
      setSavedCount(data.boards.filter((board) => board.saved).length);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = `/signin?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      setError(err instanceof Error ? err.message : "Couldn't load your boards.");
    } finally {
      setStatus("idle");
    }
  }

  function open() {
    setSelected(new Set());
    setMessage(null);
    setNewName("");
    dialogRef.current?.showModal();
    void load();
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createBoard() {
    const name = newName.trim();
    if (!name) return;
    setStatus("creating");
    setError(null);
    try {
      const { id } = await apiRequest<{ id: string }>("POST", "/api/collections", { name });
      setBoards((current) => [{ id, name, saved: false }, ...(current ?? [])]);
      setSelected((current) => new Set(current).add(id));
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the board.");
    } finally {
      setStatus("idle");
    }
  }

  async function save() {
    if (selected.size === 0) return;
    setStatus("saving");
    setError(null);
    try {
      const result = await apiRequest<{ savedTo: string[] }>("POST", `/api/creatives/${postId}/boards`, {
        boardIds: [...selected],
      });
      setBoards((current) => current?.map((board) => (selected.has(board.id) ? { ...board, saved: true } : board)) ?? null);
      setSavedCount((count) => count + result.savedTo.length);
      setSelected(new Set());
      setMessage(
        result.savedTo.length === 1 ? "Saved to 1 board." : `Saved to ${result.savedTo.length} boards.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save. Try again.");
    } finally {
      setStatus("idle");
    }
  }

  const saved = savedCount > 0;

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className={
          compact
            ? `shrink-0 rounded-lg px-3 h-8 text-xs font-medium transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-accent-500 ${
                saved ? "bg-accent-50 text-accent-700 hover:bg-accent-100" : "bg-base-50 text-base-900 hover:bg-base-100"
              }`
            : "flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium text-white bg-accent-600 hover:bg-accent-500 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-accent-500"
        }
      >
        {saved ? "Saved" : "Save"}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg bg-base-50 p-0 backdrop:bg-base-950/50 backdrop:backdrop-blur"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="p-8">
          <div className="flex items-center justify-between">
            <h2 id={titleId} className="font-display text-2xl text-base-900">
              Save to boards
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="text-sm text-base-500 hover:text-base-900 rounded focus:outline-2 focus:outline-accent-500"
            >
              Close
            </button>
          </div>
          <p className="mt-1 text-xs text-base-500">Boards are private unless you create a share link.</p>

          <div className="mt-5 max-h-64 overflow-y-auto" aria-busy={status === "loading"}>
            {status === "loading" && !boards && <p className="text-sm text-base-500">Loading your boards…</p>}
            {boards && boards.length === 0 && (
              <p className="text-sm text-base-500">You don&rsquo;t have any boards yet. Create one below.</p>
            )}
            {boards && boards.length > 0 && (
              <fieldset>
                <legend className="sr-only">Boards</legend>
                <ul className="divide-y divide-base-100">
                  {boards.map((board) => (
                    <li key={board.id}>
                      <label className="flex items-center gap-3 py-2 text-sm text-base-900 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-base-300 text-accent-600 focus:ring-accent-500 size-4"
                          checked={board.saved || selected.has(board.id)}
                          disabled={board.saved}
                          onChange={() => toggle(board.id)}
                        />
                        <span className="grow truncate">{board.name}</span>
                        {board.saved && <span className="text-xs text-accent-600">Saved</span>}
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}
          </div>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void createBoard();
            }}
          >
            <label htmlFor={`${titleId}-new`} className="sr-only">
              New board name
            </label>
            <input
              id={`${titleId}-new`}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={80}
              placeholder="New board name"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={!newName.trim() || status === "creating"}
              className="shrink-0 h-9 px-4 rounded-lg text-sm font-medium bg-white text-base-900 hover:bg-base-100 disabled:opacity-50"
            >
              {status === "creating" ? "Creating…" : "Create"}
            </button>
          </form>

          <div role="status" aria-live="polite" className="mt-3 min-h-5 text-sm">
            {error && <span className="text-red-700">{error}</span>}
            {!error && message && (
              <span className="text-accent-700">
                {message}{" "}
                <Link href="/boards" className="underline">
                  View boards
                </Link>
              </span>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="h-10 px-5 rounded-lg text-sm font-medium bg-white text-base-900 hover:bg-base-100"
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={selected.size === 0 || status === "saving"}
              className="h-10 px-5 rounded-lg text-sm font-medium text-white bg-accent-600 hover:bg-accent-500 disabled:opacity-50"
            >
              {status === "saving" ? "Saving…" : selected.size > 1 ? `Save to ${selected.size} boards` : "Save"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
