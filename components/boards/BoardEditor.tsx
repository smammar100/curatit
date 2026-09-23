"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Link2, Pencil, Trash2, X } from "lucide-react";
import { apiRequest, ApiError } from "@/lib/client";
import type { BoardDetail, BoardItem } from "@/lib/services/boards";
import { fontWeights } from "@/lib/font-weight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputCopy } from "@/components/ui/input-copy";
import { Tooltip } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import PageHeader from "@/components/fundations/containers/PageHeader";
import SlideArt from "@/components/product/SlideArt";
import Tag from "@/components/product/Tag";
import { formatDate } from "@/components/product/format";

/** Plain input and textarea on the FF input recipe. */
const input =
  "h-9 w-full rounded-lg bg-background px-3 text-[13px] text-foreground shadow-surface-1 placeholder:text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]";
const textarea =
  "block min-h-24 w-full rounded-lg bg-background px-3 py-2 text-[13px] text-foreground shadow-surface-1 placeholder:text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]";
const fieldLabel = "pl-2.5 text-[13px] text-muted-foreground";
const proseLink =
  "text-foreground underline decoration-border underline-offset-[3px] transition-colors duration-80 hover:decoration-foreground";
const destructiveGhost = "text-destructive hover:text-destructive";

const expiryOptions = [
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
];

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
  const [savingDetails, setSavingDetails] = useState(false);

  async function saveDetails() {
    setSavingDetails(true);
    const result = await mutate(
      () => apiRequest<{ version: number }>("PATCH", `/api/collections/${board.id}`, { name, description, expectedVersion: version }),
      "Board details saved."
    );
    setSavingDetails(false);
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

  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [days, setDays] = useState(7);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function createShare() {
    setSharing(true);
    const result = await mutate(() =>
      apiRequest<{ shareUrl: string; expiresAt: string }>("POST", `/api/collections/${board.id}/share`, {
        expiresInDays: days,
      })
    );
    setSharing(false);
    if (result) {
      setShareUrl(result.shareUrl);
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
    setDeleting(true);
    const result = await mutate(() => apiRequest("DELETE", `/api/collections/${board.id}`).then(() => true));
    if (result) router.push("/boards");
    else setDeleting(false);
  }

  const availableCount = items.filter((item) => item.available).length;

  const eyebrow = (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/boards"
        className="inline-flex items-center gap-1 rounded-[2px] text-muted-foreground transition-colors duration-80 hover:text-foreground"
      >
        <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
        All boards
      </Link>
      {board.share ? (
        <Badge variant="dot" color="green" className="tabular-nums">
          Link active until {formatDate(board.share.expiresAt)}
        </Badge>
      ) : (
        <Tag>Private</Tag>
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      {editing ? (
        <div className="max-w-xl pb-8 pt-24 sm:pt-28">
          <div className="mb-4 text-[13px]">{eyebrow}</div>
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void saveDetails();
            }}
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="board-edit-name" className={fieldLabel}>
                Name
              </label>
              <input
                id="board-edit-name"
                className={input}
                value={name}
                maxLength={80}
                required
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            {board.share && name.trim() !== board.name && (
              <p className="rounded-xl bg-muted px-3 py-2.5 text-[13px] text-foreground">
                The new name will be visible to anyone who already has the share link.
              </p>
            )}
            <div className="flex flex-col gap-1">
              <label htmlFor="board-edit-description" className={fieldLabel}>
                Private description
              </label>
              <textarea
                id="board-edit-description"
                className={textarea}
                rows={3}
                value={description}
                maxLength={1000}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="mt-1 flex gap-2">
              <Button type="submit" variant="primary" loading={savingDetails} disabled={!name.trim()}>
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setName(board.name);
                  setDescription(board.description);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <PageHeader
          eyebrow={eyebrow}
          title={board.name}
          description={
            board.description ? (
              <span className="whitespace-pre-line">{board.description}</span>
            ) : (
              "No description."
            )
          }
          actions={
            <>
              <Button type="button" variant="ghost" className={destructiveGhost} leadingIcon={Trash2} onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
              <Button type="button" variant="secondary" leadingIcon={Pencil} onClick={() => setEditing(true)}>
                Edit details
              </Button>
              <Button
                type="button"
                variant="primary"
                leadingIcon={Link2}
                aria-haspopup="dialog"
                onClick={() => {
                  setShareUrl(null);
                  setShareOpen(true);
                }}
              >
                Share
              </Button>
            </>
          }
          className="pb-4"
        />
      )}

      {!editing && (
        <p className="text-[12px] text-muted-foreground">
          Description and notes are private. They&rsquo;re never included in share links.
        </p>
      )}

      {conflict && (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2.5 text-[13px] text-foreground"
        >
          <span>{conflict}</span>
          <Button type="button" variant="primary" size="compact" onClick={() => window.location.reload()}>
            Reload board
          </Button>
        </div>
      )}

      <div role="status" aria-live="polite" className="mt-4 min-h-5 text-[13px]">
        {error && <span className="text-destructive">{error}</span>}
        {!error && status && <span className="text-foreground">{status}</span>}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="mt-4 flex max-w-md flex-col items-start gap-2 border-t border-border py-12">
          <h2 className="heading-section text-foreground">This board is empty</h2>
          <p className="text-[14px] leading-6 text-muted-foreground">
            Find references in the{" "}
            <Link href="/library" className={proseLink}>
              library
            </Link>{" "}
            and press Save to add them here.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-[13px] tabular-nums text-muted-foreground">
            {items.length} reference{items.length === 1 ? "" : "s"}
          </p>
          <ol className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Saved references">
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
        </>
      )}

      {/* Share dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Share a read-only link</DialogTitle>
            <DialogDescription>
              Anyone with the link can view it until it expires or you revoke it. Links can be forwarded, and revoking
              can&rsquo;t recall screenshots already taken.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 border-y border-border py-4 sm:grid-cols-2">
            <div>
              <p className="text-[12px] text-muted-foreground">Recipients see</p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-foreground">
                <li className="flex gap-2">
                  <Check size={16} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0" />
                  <span className="min-w-0 break-words">
                    Board title: <span style={{ fontVariationSettings: fontWeights.medium }}>{board.name}</span>
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check size={16} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0" />
                  <span className="tabular-nums">
                    {availableCount} reference{availableCount === 1 ? "" : "s"} in this order, with source attribution
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground">Kept private</p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-foreground">
                <li className="flex gap-2">
                  <X size={16} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground" />
                  Your private description and notes
                </li>
                <li className="flex gap-2">
                  <X size={16} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground" />
                  Your email, workspace or other boards
                </li>
              </ul>
            </div>
          </div>

          {shareUrl ? (
            <div className="mt-4">
              <p className="text-[13px] text-foreground">Copy your link now. It won&rsquo;t be shown again.</p>
              <InputCopy
                value={shareUrl}
                label="Share link"
                variant="button"
                className="mt-2 [&>button]:bg-background [&>button]:px-2.5 [&>button]:shadow-surface-1"
              />
              {board.share && (
                <p className="mt-2 text-[12px] tabular-nums text-muted-foreground">Expires {formatDate(board.share.expiresAt)}.</p>
              )}
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1">
                <span id="share-expiry-label" className={fieldLabel}>
                  Expires after
                </span>
                <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
                  <SelectTrigger aria-labelledby="share-expiry-label" className="w-40" />
                  <SelectContent>
                    {expiryOptions.map((option, index) => (
                      <SelectItem key={option.value} index={index} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="primary" loading={sharing} onClick={() => void createShare()}>
                {board.share ? "Replace link" : "Create link"}
              </Button>
            </div>
          )}

          {board.share && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-[13px] text-muted-foreground">
                <span className="tabular-nums">A link is active until {formatDate(board.share.expiresAt)}.</span>
                {!shareUrl && " Replacing it stops the old link working."}
              </p>
              <Button type="button" variant="ghost" size="compact" className={destructiveGhost} onClick={() => void revokeShare()}>
                Revoke link
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShareOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Delete this board?</DialogTitle>
            <DialogDescription>
              This removes the board, its {items.length} saved reference{items.length === 1 ? "" : "s"} and your notes, and
              stops any share link working. The references stay in the library. You can&rsquo;t undo this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)} autoFocus>
              Cancel
            </Button>
            <Button type="button" variant="primary" leadingIcon={Trash2} loading={deleting} onClick={() => void deleteBoard()}>
              Delete board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    <li className="flex min-w-0 flex-col rounded-2xl bg-card p-3 shadow-surface-3">
      {item.creative ? (
        <Link
          href={`/creatives/${item.postId}`}
          className="block overflow-hidden rounded-[2px] shadow-surface-1 outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
          aria-label={label}
        >
          <SlideArt art={item.creative.cover} alt={item.creative.coverAlt} />
        </Link>
      ) : (
        <div className="flex aspect-[4/5] items-center justify-center rounded-[2px] bg-muted p-4 text-center text-[13px] text-foreground">
          No longer available
        </div>
      )}

      <div className="flex items-center justify-between gap-2 px-1 pt-3">
        <p className="min-w-0 truncate text-[12px] tabular-nums text-muted-foreground">
          {index + 1} · {item.creative ? item.creative.brandName : "Removed from the library"}
          {item.creative?.mediaType === "carousel" && ` · ${item.creative.slideCount} slides`}
        </p>
        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip content="Move earlier">
            <Button
              id={`move-up-${item.id}`}
              type="button"
              variant="ghost"
              size="icon-compact"
              disabled={index === 0}
              onClick={() => onMove(index, -1)}
              aria-label={`Move up: ${label}`}
            >
              <ArrowLeft strokeWidth={1.5} aria-hidden="true" className="max-sm:rotate-90" />
            </Button>
          </Tooltip>
          <Tooltip content="Move later">
            <Button
              id={`move-down-${item.id}`}
              type="button"
              variant="ghost"
              size="icon-compact"
              disabled={index === total - 1}
              onClick={() => onMove(index, 1)}
              aria-label={`Move down: ${label}`}
            >
              <ArrowRight strokeWidth={1.5} aria-hidden="true" className="max-sm:rotate-90" />
            </Button>
          </Tooltip>
          <Tooltip content="Remove from board">
            <Button
              type="button"
              variant="ghost"
              size="icon-compact"
              className={destructiveGhost}
              onClick={() => onRemove(item)}
              aria-label={`Remove from board: ${label}`}
            >
              <Trash2 strokeWidth={1.5} aria-hidden="true" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="px-1">
        {item.creative ? (
          <Link
            href={`/creatives/${item.postId}`}
            className="mt-0.5 block text-[14px] leading-5 text-foreground underline decoration-transparent underline-offset-[3px] transition-colors duration-80 hover:decoration-foreground"
            style={{ fontVariationSettings: fontWeights.medium }}
          >
            {item.creative.hook}
          </Link>
        ) : (
          <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
            This reference was removed from the library, so it&rsquo;s hidden here and on share links. You can remove it from the board.
          </p>
        )}

        <form
          className="mt-3 flex flex-col gap-1"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            await onSaveNote(item, note);
            setSaving(false);
          }}
        >
          <label htmlFor={`note-${item.id}`} className="text-[12px] text-muted-foreground">
            Private note: what to adapt
          </label>
          <textarea
            id={`note-${item.id}`}
            rows={2}
            maxLength={2000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Use this pacing; swap product shots for UI."
            className={textarea}
          />
          {dirty && (
            <div className="mt-1 flex gap-2">
              <Button type="submit" variant="primary" size="compact" loading={saving}>
                Save note
              </Button>
              <Button type="button" variant="ghost" size="compact" onClick={() => setNote(item.note)}>
                Discard
              </Button>
            </div>
          )}
        </form>
      </div>
    </li>
  );
}
