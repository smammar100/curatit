"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Plus } from "lucide-react";
import { apiRequest, ApiError } from "@/lib/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckboxGroup, CheckboxItem } from "@/components/ui/checkbox-group";
import { InputGroup, InputField } from "@/components/ui/input-group";
import { fontWeights } from "@/lib/font-weight";
import { cn } from "@/lib/utils";

type BoardOption = { id: string; name: string; saved: boolean };


/**
 * "Save" action + dialog: choose one or more boards, or create one inline.
 * Saving is idempotent; boards that already hold the post show as saved.
 */
export default function SaveButton({
  postId,
  variant = "default",
}: {
  postId: string;
  /** "overlay" sits on post artwork and shows on card hover or focus, staying put once saved. */
  variant?: "default" | "compact" | "overlay";
}) {
  const [open, setOpen] = useState(false);
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

  function show() {
    setSelected(new Set());
    setMessage(null);
    setNewName("");
    setOpen(true);
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
  const checkedIndices = new Set(
    (boards ?? []).flatMap((board, index) => (board.saved || selected.has(board.id) ? [index] : []))
  );

  return (
    <>
      {variant === "overlay" ? (
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={show}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[12px] shadow-surface-3 outline-none backdrop-blur-sm transition-opacity duration-80 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
            saved
              ? "bg-brand text-on-brand"
              : "bg-card/90 text-foreground opacity-0 hover:bg-card group-hover/card:opacity-100 group-focus-within/card:opacity-100 [@media(hover:none)]:opacity-100"
          )}
          style={{ fontVariationSettings: fontWeights.medium }}
        >
          {saved ? (
            <BookmarkCheck aria-hidden="true" size={14} strokeWidth={2} />
          ) : (
            <Bookmark aria-hidden="true" size={14} strokeWidth={1.5} />
          )}
          {saved ? "Saved" : "Save"}
        </button>
      ) : variant === "compact" ? (
        <Button
          type="button"
          size="compact"
          variant={saved ? "tertiary" : "secondary"}
          leadingIcon={saved ? BookmarkCheck : Bookmark}
          aria-haspopup="dialog"
          onClick={show}
        >
          {saved ? "Saved" : "Save"}
        </Button>
      ) : (
        <Button
          type="button"
          variant={saved ? "secondary" : "primary"}
          leadingIcon={saved ? BookmarkCheck : Bookmark}
          aria-haspopup="dialog"
          onClick={show}
        >
          {saved ? "Saved" : "Save"}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Save to boards</DialogTitle>
            <DialogDescription>Boards are private unless you create a share link.</DialogDescription>
          </DialogHeader>

          <div className="max-h-64 overflow-y-auto" aria-busy={status === "loading"}>
            {status === "loading" && !boards && <p className="px-1 text-[13px] text-muted-foreground">Loading your boards…</p>}
            {boards && boards.length === 0 && (
              <p className="px-1 text-[13px] text-muted-foreground">No boards yet. Create one below.</p>
            )}
            {boards && boards.length > 0 && (
              <CheckboxGroup checkedIndices={checkedIndices} aria-label="Boards">
                {boards.map((board, index) => (
                  <CheckboxItem
                    key={board.id}
                    index={index}
                    label={board.saved ? `${board.name} · saved` : board.name}
                    checked={board.saved || selected.has(board.id)}
                    onToggle={() => {
                      if (!board.saved) toggle(board.id);
                    }}
                  />
                ))}
              </CheckboxGroup>
            )}
          </div>

          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void createBoard();
            }}
          >
            <div className="min-w-0 flex-1">
              <InputGroup className="w-full">
                <InputField
                  index={0}
                  label="New board name"
                  labelHidden
                  icon={Plus}
                  placeholder="New board name"
                  value={newName}
                  onChange={setNewName}
                  maxLength={80}
                />
              </InputGroup>
            </div>
            <Button type="submit" variant="secondary" loading={status === "creating"} disabled={!newName.trim()}>
              Create
            </Button>
          </form>

          <div role="status" aria-live="polite" className="min-h-5 px-1 text-[13px]">
            {error && <span className="text-destructive">{error}</span>}
            {!error && message && (
              <span className="text-foreground">
                {message}{" "}
                <Link href="/boards" className="underline decoration-border underline-offset-[3px] hover:decoration-foreground">
                  View boards
                </Link>
              </span>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Done
            </Button>
            <Button
              type="button"
              onClick={() => void save()}
              loading={status === "saving"}
              disabled={selected.size === 0}
            >
              {selected.size > 1 ? `Save to ${selected.size} boards` : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
