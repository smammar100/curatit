"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, ApiError } from "@/lib/client";
import type { BoardDetail, BoardItem } from "@/lib/services/boards";
import SlideArt from "@/components/product/SlideArt";
import Tag from "@/components/product/Tag";
import { formatDate } from "@/components/product/format";

const field =
  "block w-full px-3 py-2 rounded-md text-sm bg-white ring-1 ring-base-200 border-transparent focus:ring-2 focus:ring-accent-100 focus:border-accent-500";
const buttonMuted = "h-9 px-4 rounded-lg text-sm font-medium bg-base-50 text-base-900 hover:bg-base-100 disabled:opacity-40";
const buttonDark = "h-9 px-4 rounded-lg text-sm font-medium text-white bg-base-800 hover:bg-base-700 disabled:opacity-50";

export default function BoardEditor({ initial }: { initial: BoardDetail }) {
  const router = useRouter();
  const [board, setBoard] = useState(initial);
  const [items, setItems] = useState<BoardItem[]>(initial.items);
  const [version, setVersion] = useState(initial.version);
  const [conflict, setConflict] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Run a mutation; route 409s to the conflict banner instead of a toast. */
  async function mutate<T>(fn: () => Promise<T>, success?: string): Promise<T | undefined> {
    setError(null);
    setStatus(null);
    try {
      const result = await fn();
      if (success) setStatus(success);
      return result;
    } catch (err) {
      if (err instanceof ApiError && err.code === "conflict") setConflict(err.message);
      else if (err instanceof ApiError && err.status === 404) setError("This board no longer exists or you don't have access.");
      else setError(err instanceof Error ? err.message : "Something went wrong.");
      return undefined;
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Details                                                                */
  /* ---------------------------------------------------------------------- */

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description);

  async function saveDetails() {
    const result = await mutate(
      () => apiRequest<{ version: number }>("PATCH", `/api/collections/${board.id}`, { name, description, expectedVersion: version }),
      "Board details saved."
    );
    if (result) {
      setVersion(result.version);
      setBoard((current) => ({ ...current, name: name.trim(), description: description.trim() }));
      setEditing(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Items                                                                  */
  /* ---------------------------------------------------------------------- */

  async function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const previous = items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next); // optimistic

    const result = await mutate(() =>
      apiRequest<{ version: number }>("PUT", `/api/collections/${board.id}/order`, {
        itemIds: next.map((item) => item.id),
        expectedVersion: version,
      })
    );
    if (result) {
      setVersion(result.version);
      setStatus(`Moved to position ${target + 1} of ${next.length}.`);
      // Keep keyboard focus on the moved item's matching control.
      requestAnimationFrame(() => {
        document.getElementById(`move-${delta < 0 ? "up" : "down"}-${next[target].id}`)?.focus();
      });
    } else {
      setItems(previous);
    }
  }

  async function remove(item: BoardItem) {
    const result = await mutate(
      () => apiRequest("DELETE", `/api/collections/${board.id}/items/${item.id}`).then(() => true),
      "Reference removed from this board."
    );
    if (result) {
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setVersion((current) => current + 1);
    }
  }

  async function saveNote(item: BoardItem, note: string) {
    const result = await mutate(
      () =>
        apiRequest<{ version: number }>("PATCH", `/api/collections/${board.id}/items/${item.id}`, {
          note,
          expectedVersion: item.version,
        }),
      "Note saved."
    );
    if (result) {
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, note: note.trim(), version: result.version } : entry))
      );
      return true;
    }
    return false;
  }

  /* ---------------------------------------------------------------------- */
  /*  Sharing and deletion                                                   */
  /* ---------------------------------------------------------------------- */

  const shareDialog = useRef<HTMLDialogElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const [days, setDays] = useState(7);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function createShare() {
    const result = await mutate(() =>
      apiRequest<{ shareUrl: string; expiresAt: string }>("POST", `/api/collections/${board.id}/share`, {
        expiresInDays: days,
      })
    );
    if (result) {
      setShareUrl(result.shareUrl);
      setCopied(false);
      setBoard((current) => ({
        ...current,
        share: { id: "current", expiresAt: result.expiresAt, createdAt: new Date().toISOString() },
      }));
    }
  }

  async function revokeShare() {
    const result = await mutate(
      () => apiRequest("DELETE", `/api/collections/${board.id}/share`).then(() => true),
      "Link revoked. Anyone opening it now sees an unavailable page."
    );
    if (result) {
      setShareUrl(null);
      setBoard((current) => ({ ...current, share: null }));
    }
  }

  async function deleteBoard() {
    const result = await mutate(() => apiRequest("DELETE", `/api/collections/${board.id}`).then(() => true));
    if (result) router.push("/boards");
  }

  const availableCount = items.filter((item) => item.available).length;

  return (
    <div>
      {conflict && (
        <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span>{conflict}</span>
          <button type="button" className={buttonDark} onClick={() => window.location.reload()}>
            Reload board
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl grow">
          <div className="flex items-center gap-2">
            <Link href="/boards" className="text-xs text-base-500 hover:text-base-900">
              ← All boards
            </Link>
            {board.share ? <Tag tone="accent">Link active until {formatDate(board.share.expiresAt)}</Tag> : <Tag>Private</Tag>}
          </div>

          {editing ? (
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void saveDetails();
              }}
            >
              <label className="block text-sm font-medium text-base-700">
                Name
                <input className={`${field} mt-1`} value={name} maxLength={80} required onChange={(event) => setName(event.target.value)} />
              </label>
              {board.share && name.trim() !== board.name && (
                <p className="text-xs text-amber-800">The new name will be visible to anyone who already has the share link.</p>
              )}
              <label className="block text-sm font-medium text-base-700">
                Private description
                <textarea className={`${field} mt-1`} rows={3} value={description} maxLength={1000} onChange={(event) => setDescription(event.target.value)} />
              </label>
              <div className="flex gap-2">
                <button type="submit" className={buttonDark} disabled={!name.trim()}>
                  Save
                </button>
                <button
                  type="button"
                  className={buttonMuted}
                  onClick={() => {
                    setName(board.name);
                    setDescription(board.description);
                    setEditing(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="mt-3 font-display font-thin text-3xl md:text-4xl lg:text-5xl text-base-900 text-balance break-words">
                {board.name}
              </h1>
              {board.description ? (
                <p className="mt-3 whitespace-pre-line text-sm text-base-600">{board.description}</p>
              ) : (
                <p className="mt-3 text-sm text-base-400">No description.</p>
              )}
              <p className="mt-2 text-xs text-base-400">Description and notes are private — never included in share links.</p>
            </>
          )}
        </div>

        {!editing && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonMuted} onClick={() => setEditing(true)}>
              Edit details
            </button>
            <button type="button" className={buttonDark} onClick={() => { setShareUrl(null); shareDialog.current?.showModal(); }}>
              Share
            </button>
            <button type="button" className="h-9 px-4 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => deleteDialog.current?.showModal()}>
              Delete
            </button>
          </div>
        )}
      </div>

      <div role="status" aria-live="polite" className="mt-4 min-h-5 text-sm">
        {error && <span className="text-red-700">{error}</span>}
        {!error && status && <span className="text-base-600">{status}</span>}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-base-200 p-10 text-center">
          <p className="font-display text-2xl text-base-900">This board is empty</p>
          <p className="mt-2 text-sm text-base-600">
            Find references in the{" "}
            <Link href="/library" className="text-accent-600 underline hover:text-base-900">
              library
            </Link>{" "}
            and use Save to add them here.
          </p>
        </div>
      ) : (
        <ol className="mt-6 space-y-4" aria-label="Saved references">
          {items.map((item, index) => (
            <ItemRow
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              onMove={move}
              onRemove={remove}
              onSaveNote={saveNote}
            />
          ))}
        </ol>
      )}

      {/* Share dialog */}
      <dialog
        ref={shareDialog}
        aria-labelledby="share-title"
        className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-xl bg-white p-0 shadow-xl backdrop:bg-base-950/50 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <h2 id="share-title" className="font-display text-2xl text-base-900">
            Share a read-only link
          </h2>
          <p className="mt-2 text-sm text-base-600">
            Anyone with the link can view it until it expires or you revoke it. Links can be forwarded, and revoking
            can&rsquo;t recall screenshots already taken.
          </p>

          <div className="mt-5 rounded-lg bg-base-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-base-500">What recipients will see</p>
            <ul className="mt-2 space-y-1 text-sm text-base-700">
              <li>✓ Board title: <span className="font-medium text-base-900">{board.name}</span></li>
              <li>✓ {availableCount} reference{availableCount === 1 ? "" : "s"} in this order, with source attribution</li>
              <li className="text-base-500">✕ Your private description and notes</li>
              <li className="text-base-500">✕ Your email, workspace, or other boards</li>
            </ul>
          </div>

          {shareUrl ? (
            <div className="mt-5">
              <p className="text-sm font-medium text-base-900">Your link — copy it now, it won&rsquo;t be shown again:</p>
              <div className="mt-2 flex gap-2">
                <input readOnly value={shareUrl} className={`${field} font-mono text-xs`} onFocus={(event) => event.currentTarget.select()} aria-label="Share link" />
                <button
                  type="button"
                  className={buttonDark}
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              {board.share && <p className="mt-2 text-xs text-base-500">Expires {formatDate(board.share.expiresAt)}.</p>}
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <label className="text-sm font-medium text-base-700">
                Expires after
                <select className={`${field} mt-1 w-40`} value={days} onChange={(event) => setDays(Number(event.target.value))}>
                  <option value={1}>1 day</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </label>
              <button type="button" className={buttonDark} onClick={() => void createShare()}>
                {board.share ? "Replace link" : "Create link"}
              </button>
            </div>
          )}

          {board.share && (
            <div className="mt-5 border-t border-base-100 pt-4 text-sm text-base-600">
              <p>
                A link is active until {formatDate(board.share.expiresAt)}.
                {!shareUrl && " Replacing it stops the old link working."}
              </p>
              <button type="button" className="mt-2 h-9 px-4 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => void revokeShare()}>
                Revoke link
              </button>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button type="button" className={buttonMuted} onClick={() => shareDialog.current?.close()}>
              Done
            </button>
          </div>
        </div>
      </dialog>

      {/* Delete dialog */}
      <dialog
        ref={deleteDialog}
        aria-labelledby="delete-title"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl bg-white p-0 shadow-xl backdrop:bg-base-950/50"
      >
        <div className="p-6">
          <h2 id="delete-title" className="font-display text-2xl text-base-900">
            Delete this board?
          </h2>
          <p className="mt-2 text-sm text-base-600">
            This removes the board, its {items.length} saved reference{items.length === 1 ? "" : "s"} and your notes, and stops
            any share link working. The references stay in the library. This can&rsquo;t be undone.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className={buttonMuted} onClick={() => deleteDialog.current?.close()} autoFocus>
              Cancel
            </button>
            <button type="button" className="h-9 px-4 rounded-lg text-sm font-medium text-white bg-red-700 hover:bg-red-600" onClick={() => void deleteBoard()}>
              Delete board
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

function ItemRow({
  item,
  index,
  total,
  onMove,
  onRemove,
  onSaveNote,
}: {
  item: BoardItem;
  index: number;
  total: number;
  onMove: (index: number, delta: -1 | 1) => void;
  onRemove: (item: BoardItem) => void;
  onSaveNote: (item: BoardItem, note: string) => Promise<boolean>;
}) {
  const [note, setNote] = useState(item.note);
  const [saving, setSaving] = useState(false);
  const dirty = note.trim() !== item.note;
  const label = item.creative ? `${item.creative.brandName}: ${item.creative.hook ?? "reference"}` : "Unavailable reference";

  return (
    <li className="grid grid-cols-1 gap-4 rounded-lg bg-base-50 p-4 sm:grid-cols-[7rem_1fr_auto]">
      <div className="w-28">
        {item.creative ? (
          <Link href={`/creatives/${item.postId}`} className="block rounded overflow-hidden shadow-sm">
            <SlideArt art={item.creative.cover} alt={item.creative.coverAlt} />
          </Link>
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center rounded bg-base-100 p-2 text-center text-[11px] text-base-500">
            No longer available
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-base-500">
          {index + 1}. {item.creative ? item.creative.brandName : "Removed from the library"}
          {item.creative?.mediaType === "carousel" && ` · Carousel, ${item.creative.slideCount} slides`}
        </p>
        {item.creative ? (
          <Link href={`/creatives/${item.postId}`} className="mt-1 block text-sm font-medium text-base-900 hover:text-accent-600">
            {item.creative.hook}
          </Link>
        ) : (
          <p className="mt-1 text-sm text-base-600">
            This reference was removed from the library, so it&rsquo;s hidden here and on share links. You can remove it from the board.
          </p>
        )}

        <form
          className="mt-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            await onSaveNote(item, note);
            setSaving(false);
          }}
        >
          <label htmlFor={`note-${item.id}`} className="text-xs font-medium text-base-600">
            Private note — what to adapt
          </label>
          <textarea
            id={`note-${item.id}`}
            rows={2}
            maxLength={2000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Use this pacing for the launch carousel; swap product shots for UI."
            className={`${field} mt-1`}
          />
          {dirty && (
            <div className="mt-2 flex gap-2">
              <button type="submit" className="h-8 px-3 rounded-lg text-xs font-medium text-white bg-base-800 hover:bg-base-700" disabled={saving}>
                {saving ? "Saving…" : "Save note"}
              </button>
              <button type="button" className="h-8 px-3 rounded-lg text-xs font-medium bg-white ring-1 ring-base-200" onClick={() => setNote(item.note)}>
                Discard
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="flex gap-2 sm:flex-col">
        <button
          id={`move-up-${item.id}`}
          type="button"
          className={buttonMuted}
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          aria-label={`Move up: ${label}`}
        >
          ↑ Up
        </button>
        <button
          id={`move-down-${item.id}`}
          type="button"
          className={buttonMuted}
          disabled={index === total - 1}
          onClick={() => onMove(index, 1)}
          aria-label={`Move down: ${label}`}
        >
          ↓ Down
        </button>
        <button
          type="button"
          className="h-9 px-4 rounded-lg text-sm font-medium text-red-700 hover:bg-red-100"
          onClick={() => onRemove(item)}
          aria-label={`Remove from board: ${label}`}
        >
          Remove
        </button>
      </div>
    </li>
  );
}
