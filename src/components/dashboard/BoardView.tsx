"use client";

// A board's page, /dashboard/b/<id>, after a Cosmos collection: a centred header (the name in
// the display serif, the description, how many posts and when it was last used, Share and a
// More menu) over the board's posts in the feed's masonry, newest first, each with its note.
// The name and description edit in place; notes too, under each post. Everything comes from
// BoardsProvider, so changes show at once and are written in the background.
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Fundations
import Button from "@/components/fundations/elements/Button";
import { cx } from "@/lib/cx";
import { NAME_MAX, useBoards } from "./boards";
import { feedHref } from "./Feed";
import Grid from "./Grid";
import Header from "./Header";
import { Block, GridSkeleton } from "./Skeleton";
import type { Board, DashPost } from "./types";

export const boardHref = (id: string) => `/dashboard/b/${id}`;
export const shareHref = (token: string) => `/s/${token}`;

const DESCRIPTION_MAX = 500;
const NOTE_MAX = 280;

// "Updated 2 hours ago"
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function ago(iso: string) {
  const seconds = (Date.parse(iso) - Date.now()) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  return "just now";
}

export default function BoardView({ id }: { id: string }) {
  const router = useRouter();
  const { boards, status, posts } = useBoards();
  const [query, setQuery] = useState("");
  const board = boards.find((b) => b.id === id);
  const shown = board ? board.items.flatMap((item) => posts.get(item.post) ?? []) : [];

  const name = board?.name;
  useEffect(() => {
    if (name) document.title = `${name} | Curatit`;
  }, [name]);

  return (
    <div className="min-h-dvh bg-white">
      {/* Boards live under Saved, so that tab is the current one */}
      <Header
        view="Saved"
        onView={(view) => router.push(feedHref(view))}
        query={query}
        onQuery={setQuery}
        onSearch={(text) => router.push(feedHref("For you", text))}
      />
      <main className="px-4 pb-24 sm:px-6">
        {status === "loading" ? (
          <BoardSkeleton />
        ) : !board ? (
          <Message title="This board isn’t here" body="It may have been deleted, or it belongs to someone else." action="Back to Saved" href={feedHref("Saved")} />
        ) : (
          <>
            <BoardHeading board={board} count={shown.length} />
            {shown.length ? (
              <Grid posts={shown} footer={(post) => <Note board={board} post={post} />} />
            ) : (
              <Message title="Nothing on this board yet" body="Save posts to it from the feed: Save is on every post." action="Browse the feed" href="/dashboard" />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function BoardHeading({ board, count }: { board: Board; count: number }) {
  const { updateBoard } = useBoards();
  const [editing, setEditing] = useState<"name" | "description" | null>(null);

  return (
    <header className="mx-auto flex max-w-3xl flex-col items-center pt-6 pb-12 text-center">
      <Link href={feedHref("Saved")} className="text-sm text-base-500 hover:text-base-900">
        Saved
      </Link>
      <h1 className="mt-3 w-full font-display text-4xl leading-[1.1] font-light text-balance text-base-900 sm:text-5xl">
        <Editable
          value={board.name}
          editing={editing === "name"}
          onEdit={(on) => setEditing(on ? "name" : null)}
          onSave={(name) => name && updateBoard(board.id, { name })}
          maxLength={NAME_MAX}
          label="Board name"
          className="text-center"
        />
      </h1>
      <div className="mt-4 w-full max-w-xl text-base text-pretty text-base-600">
        <Editable
          value={board.description ?? ""}
          placeholder="Add a description"
          editing={editing === "description"}
          onEdit={(on) => setEditing(on ? "description" : null)}
          onSave={(text) => updateBoard(board.id, { description: text || null })}
          maxLength={DESCRIPTION_MAX}
          label="Description"
          multiline
          className="text-center"
        />
      </div>
      <p className="mt-3 text-sm text-base-500 tabular-nums">
        {count} {count === 1 ? "post" : "posts"} · Updated {ago(board.updatedAt)}
        {board.shareToken && " · Shared"}
      </p>
      <div className="mt-6 flex items-center gap-2">
        <SharePanel board={board} />
        <MoreMenu board={board} onRename={() => setEditing("name")} onDescribe={() => setEditing("description")} />
      </div>
    </header>
  );
}

// Text that turns into a field when clicked: Enter (or leaving the field) saves, Escape cancels.
// In a multi-line field Shift+Enter starts a new line.
function Editable({
  value,
  placeholder,
  editing,
  onEdit,
  onSave,
  maxLength,
  label,
  multiline = false,
  className,
}: {
  value: string;
  placeholder?: string;
  editing: boolean;
  onEdit: (on: boolean) => void;
  onSave: (value: string) => void;
  maxLength: number;
  label: string;
  multiline?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const cancelled = useRef(false);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      cancelled.current = false;
    }
  }, [editing, value]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => onEdit(true)}
        title={`Edit ${label.toLowerCase()}`}
        className={cx(
          "w-full rounded-lg px-2 py-0.5 transition-colors duration-150 hover:bg-base-50",
          !value && "text-base-400",
          multiline && "whitespace-pre-line",
          className,
        )}
      >
        {value || placeholder}
      </button>
    );
  }

  const finish = () => {
    if (!cancelled.current && draft.trim() !== value) onSave(draft.trim());
    onEdit(false);
  };
  const shared = {
    autoFocus: true,
    value: draft,
    maxLength,
    "aria-label": label,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(event.target.value),
    onBlur: finish,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelled.current = true;
        (event.currentTarget as HTMLElement).blur();
      } else if (event.key === "Enter" && !(multiline && event.shiftKey)) {
        event.preventDefault();
        (event.currentTarget as HTMLElement).blur();
      }
    },
    className: cx("w-full rounded-lg bg-base-50 px-2 py-0.5 outline-none ring-2 ring-accent-100 [font:inherit]", className),
  };
  return multiline ? <textarea rows={3} {...shared} className={cx(shared.className, "resize-none")} /> : <input {...shared} />;
}

// Share: a read-only link anyone can open, made and turned off here
function SharePanel({ board }: { board: Board }) {
  const { setSharing, notify } = useBoards();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = usePopover(open, setOpen);
  const url = board.shareToken ? `${location.origin}${shareHref(board.shareToken)}` : "";

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      notify("Couldn’t copy the link. Select it and copy it instead.", "error");
    }
  };

  return (
    <div ref={ref} className="relative">
      <Pill onClick={() => setOpen((o) => !o)} expanded={open}>
        Share
      </Pill>
      {open && (
        <div
          role="dialog"
          aria-label="Share this board"
          className="absolute top-full left-1/2 z-30 mt-2 w-80 -translate-x-1/2 animate-[menu-in_150ms_cubic-bezier(0.23,1,0.32,1)] rounded-2xl bg-white p-4 text-left shadow-[0_12px_32px_-12px_rgb(0_0_0/0.3)] ring-1 ring-edge motion-reduce:animate-none"
        >
          <p className="text-sm font-medium text-base-900">{board.shareToken ? "Anyone with the link can view" : "Share a read-only link"}</p>
          <p className="mt-1 text-sm text-pretty text-base-600">
            {board.shareToken
              ? "They see the posts and your notes, and can’t change anything."
              : "Anyone with the link sees this board’s posts and your notes. They can’t change anything."}
          </p>
          {board.shareToken ? (
            <>
              <div className="mt-3 flex gap-2">
                <input
                  readOnly
                  value={url}
                  aria-label="Share link"
                  onFocus={(event) => event.currentTarget.select()}
                  className="h-9 min-w-0 flex-1 rounded-md border-0 bg-white px-3 text-xs text-base-600 ring-1 ring-base-200 focus:ring-2 focus:ring-accent-100 focus:outline-none"
                />
                <Button type="button" size="sm" variant="default" onClick={copy} className="w-18 shrink-0">
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-base-900 hover:text-accent-600">
                  Open the link
                </a>
                <button type="button" onClick={() => setSharing(board.id, false)} className="text-base-500 hover:text-base-900">
                  Stop sharing
                </button>
              </div>
            </>
          ) : (
            <Button type="button" size="sm" variant="default" onClick={() => setSharing(board.id, true)} className="mt-3 w-full">
              Create link
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// More: rename, describe, delete (which asks first)
function MoreMenu({ board, onRename, onDescribe }: { board: Board; onRename: () => void; onDescribe: () => void }) {
  const router = useRouter();
  const { deleteBoard } = useBoards();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = usePopover(open, (value) => {
    setOpen(value);
    if (!value) setConfirming(false);
  });
  const item = "flex w-full rounded-xl px-3 py-2 text-left text-sm text-base-900 hover:bg-base-50";

  return (
    <div ref={ref} className="relative">
      <Pill onClick={() => setOpen((o) => !o)} expanded={open} label="More">
        <span aria-hidden="true" className="flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-[3px] rounded-full bg-current" />
          ))}
        </span>
      </Pill>
      {open && (
        <div
          role="menu"
          className="absolute top-full left-1/2 z-30 mt-2 w-60 -translate-x-1/2 animate-[menu-in_150ms_cubic-bezier(0.23,1,0.32,1)] rounded-2xl bg-white p-1.5 text-left shadow-[0_12px_32px_-12px_rgb(0_0_0/0.3)] ring-1 ring-edge motion-reduce:animate-none"
        >
          {confirming ? (
            <div className="p-2" role="alertdialog" aria-label={`Delete ${board.name}`}>
              <p className="text-sm font-medium text-pretty text-base-900">Delete “{board.name}”?</p>
              <p className="mt-1 text-sm text-pretty text-base-600">The board and its notes go for good. The posts stay in the library.</p>
              <div className="mt-3 flex gap-2">
                {/* Focus starts on Cancel, so Enter can't delete by accident */}
                <Button type="button" size="sm" variant="muted" autoFocus onClick={() => setConfirming(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={() => {
                    router.push(feedHref("Saved"));
                    deleteBoard(board.id);
                  }}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <>
              <button type="button" role="menuitem" className={item} onClick={() => (setOpen(false), onRename())}>
                Rename
              </button>
              <button type="button" role="menuitem" className={item} onClick={() => (setOpen(false), onDescribe())}>
                {board.description ? "Edit description" : "Add a description"}
              </button>
              <div className="mx-3 my-1 h-px bg-base-100" />
              <button type="button" role="menuitem" className={item} onClick={() => setConfirming(true)}>
                Delete board…
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// The note under a post on the board. Its space is kept even while "Add a note" is hidden (it
// shows on hover, on keyboard focus, and always on touch), so tiles don't jump.
function Note({ board, post }: { board: Board; post: DashPost }) {
  const { setNote } = useBoards();
  const note = board.items.find((item) => item.post === post.shortCode)?.note ?? "";
  const [editing, setEditing] = useState(false);
  return (
    <div className="mt-2 text-sm">
      {editing || note ? (
        <Editable
          value={note}
          editing={editing}
          onEdit={setEditing}
          onSave={(text) => setNote(post.shortCode, board.id, text)}
          maxLength={NOTE_MAX}
          label={`Note on ${post.brand.name}’s post`}
          multiline
          className="-mx-2 w-[calc(100%+1rem)] text-left text-base-600"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-base-400 opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100 hover:text-base-900 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        >
          Add a note
        </button>
      )}
    </div>
  );
}

function Pill({ onClick, expanded, label, children }: { onClick: () => void; expanded: boolean; label?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-haspopup="true"
      aria-expanded={expanded}
      className="flex h-11 min-w-11 items-center justify-center rounded-full px-5 text-[15px] font-medium text-base-900 ring-1 ring-base-200 transition-[background-color,scale] duration-150 hover:bg-base-50 active:scale-[0.96]"
    >
      {children}
    </button>
  );
}

// Closes a popover on a click outside it or Escape
function usePopover(open: boolean, setOpen: (open: boolean) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const setRef = useRef(setOpen);
  setRef.current = setOpen;
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => !ref.current?.contains(event.target as Node) && setRef.current(false);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setRef.current(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return ref;
}

function Message({ title, body, action, href }: { title: string; body: string; action: string; href: string }) {
  return (
    <div className="mx-auto max-w-sm py-24 text-center">
      <p className="text-base text-base-900">{title}</p>
      <p className="mt-2 text-sm text-base-600">{body}</p>
      <Button isLink href={href} size="sm" variant="muted" className="mx-auto mt-6 w-fit">
        {action}
      </Button>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div role="status" aria-label="Loading board">
      <div className="mx-auto flex max-w-3xl flex-col items-center pt-6 pb-12">
        <Block className="h-3.5 w-12 rounded-full" />
        <Block className="mt-5 h-11 w-80 max-w-full rounded-full" />
        <Block className="mt-5 h-4 w-64 max-w-full rounded-full" />
        <Block className="mt-4 h-3.5 w-40 rounded-full" />
        <div className="mt-6 flex gap-2">
          <Block className="h-11 w-24 rounded-full" />
          <Block className="size-11 rounded-full" />
        </div>
      </div>
      <GridSkeleton label="Loading the board’s posts" />
    </div>
  );
}
