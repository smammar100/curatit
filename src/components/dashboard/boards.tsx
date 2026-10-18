"use client";

// The dashboard's boards: the signed-in person's boards from public.boards / board_posts, saving
// a post to one or taking it off, making, renaming, describing, sharing and deleting boards,
// notes on a board's posts, the toast that confirms each, and the "Save" menu on each tile. The pages are static, so the boards load in the browser once the
// page is up (Row Level Security limits them to the owner's). Every change shows at once and is
// written in the background; if the write fails it's undone and the toast says so. A new board
// gets its id here (crypto.randomUUID), so a post can be saved to it while it's still being
// written: writes to a board wait for its creation.
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
// Icons
import Check from "@/components/fundations/icons/Check";
import Plus from "@/components/fundations/icons/Plus";
import WarningCircle from "@/components/fundations/icons/WarningCircle";
import { cx } from "@/lib/cx";
import { usePresence } from "@/lib/motion";
import { createClient } from "@/utils/supabase/client";
import { track } from "@/lib/analytics";
import type { Board, DashPost } from "./types";
import { GLIDE_HIGHLIGHT, GLIDE_ROW, usePopover } from "./usePopover";

type BoardsValue = {
  // Most recently used first
  boards: Board[];
  status: "loading" | "ready" | "error";
  // Every library post, in feed order, and the same posts by short code
  list: DashPost[];
  posts: Map<string, DashPost>;
  save: (post: string, board: string) => void;
  remove: (post: string, board: string) => void;
  // Makes a board and returns its id straight away: with a short description, shared by link,
  // and with a first post, if given
  createBoard: (name: string, options?: { description?: string; shared?: boolean; firstPost?: string }) => string;
  // Renames a board, or changes its description (null clears it)
  updateBoard: (id: string, patch: { name?: string; description?: string | null }) => void;
  deleteBoard: (id: string) => void;
  // A post's note on a board ("" clears it)
  setNote: (post: string, board: string, note: string) => void;
  // Turns the read-only link on (a new token every time, so an old link stays dead) or off
  setSharing: (id: string, on: boolean) => void;
  // Shows a short confirmation, or a problem, at the bottom of the screen
  notify: (text: string, tone?: "done" | "error") => void;
};

type Row = {
  id: string;
  name: string;
  description: string | null;
  share_token: string | null;
  updated_at: string;
  board_posts: { post_id: string; note: string | null; added_at: string }[];
};

// Board names are 1 to 120 characters (a check on public.boards)
export const NAME_MAX = 120;

const BoardsContext = createContext<BoardsValue | null>(null);

export function useBoards() {
  const value = useContext(BoardsContext);
  if (!value) throw new Error("useBoards outside BoardsProvider");
  return value;
}

const newestFirst = (a: { addedAt: string }, b: { addedAt: string }) => b.addedAt.localeCompare(a.addedAt);

type Toast = { id: number; text: string; tone: "done" | "error" };
// How long a toast stays: long enough to read, longer for a problem
const TOAST_MS = { done: 2400, error: 4000 };

// Whether this tab is in the background, where a toast's clock stops
const onVisibility = (change: () => void) => {
  document.addEventListener("visibilitychange", change);
  return () => document.removeEventListener("visibilitychange", change);
};
const usePageHidden = () => useSyncExternalStore(onVisibility, () => document.hidden, () => false);

export function BoardsProvider({ posts, children }: { posts: DashPost[]; children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [boards, setBoards] = useState<Board[]>([]);
  const [status, setStatus] = useState<BoardsValue["status"]>("loading");
  // The last toast, kept while it leaves; `toastOpen` is whether it's still meant to show
  const [toast, setToast] = useState<Toast | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const toastCount = useRef(0);
  const [byCode] = useState(() => new Map(posts.map((post) => [post.shortCode, post])));
  // Boards still being written, so a save to one waits for it
  const creating = useRef(new Map<string, Promise<boolean>>());

  const notify = useCallback((text: string, tone: Toast["tone"] = "done") => {
    setToast({ id: ++toastCount.current, text, tone });
    setToastOpen(true);
  }, []);
  const change = (id: string, edit: (board: Board) => Board) => setBoards((list) => list.map((b) => (b.id === id ? edit(b) : b)));

  useEffect(() => {
    const codeById = new Map(posts.map((post) => [post.id, post.shortCode]));
    let live = true;
    supabase
      .from("boards")
      .select("id, name, description, share_token, updated_at, board_posts(post_id, note, added_at)")
      .returns<Row[]>()
      .then(({ data, error }) => {
        if (!live) return;
        if (error) {
          setStatus("error");
          notify("Couldn’t load your boards. Reload the page to try again.", "error");
          return;
        }
        setBoards(
          data.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description ?? undefined,
            shareToken: row.share_token,
            updatedAt: row.updated_at,
            // A post that's been unpublished since can't be shown, so it's left out
            items: row.board_posts
              .flatMap((item) => {
                const post = codeById.get(item.post_id);
                return post ? [{ post, note: item.note ?? undefined, addedAt: item.added_at }] : [];
              })
              .sort(newestFirst),
          })),
        );
        setStatus("ready");
      });
    return () => {
      live = false;
    };
  }, [supabase, posts, notify]);

  // A toast's clock stops while the pointer is on it and while the tab is in the background, and
  // runs on with the time it had left; then the toast leaves (toast-out) and unmounts
  const { mounted: toastMounted, closing: toastClosing } = usePresence(toastOpen, 120);
  const [pointedAt, setPointedAt] = useState<number | null>(null);
  const hidden = usePageHidden();
  const paused = hidden || (toast !== null && pointedAt === toast.id);
  const left = useRef<{ id: number; ms: number } | null>(null);
  useEffect(() => {
    if (!toast || !toastOpen || paused) return;
    if (left.current?.id !== toast.id) left.current = { id: toast.id, ms: TOAST_MS[toast.tone] };
    const entry = left.current;
    const start = Date.now();
    const timer = setTimeout(() => setToastOpen(false), entry.ms);
    return () => {
      clearTimeout(timer);
      entry.ms -= Date.now() - start;
    };
  }, [toast, toastOpen, paused]);

  // Runs a write once the board exists; undoes the change if either fails. A post that's
  // already on the board (saved from another tab) counts as saved.
  const write = async (boardId: string, run: () => PromiseLike<{ error: { code?: string } | null }>, undo: () => void) => {
    if (!(await (creating.current.get(boardId) ?? true))) return false;
    const { error } = await run();
    if (error && error.code !== "23505") {
      undo();
      return false;
    }
    return true;
  };

  const save = (code: string, boardId: string) => {
    const board = boards.find((b) => b.id === boardId);
    const post = byCode.get(code);
    if (!board || !post) return;
    if (board.items.some((item) => item.post === code)) return notify(`Already in ${board.name}`);
    const now = new Date().toISOString();
    change(boardId, (b) => ({ ...b, updatedAt: now, items: [{ post: code, addedAt: now }, ...b.items] }));
    notify(`Saved to ${board.name}`);
    void write(
      boardId,
      () => supabase.from("board_posts").insert({ board_id: boardId, post_id: post.id }),
      () => {
        change(boardId, (b) => ({ ...b, items: b.items.filter((item) => item.post !== code) }));
        notify(`Couldn’t save to ${board.name}. Try again.`, "error");
      },
    ).then((saved) => {
      if (saved) track("post_saved_to_board", { board_post_count: board.items.length + 1 });
    });
  };

  const remove = (code: string, boardId: string) => {
    const board = boards.find((b) => b.id === boardId);
    const post = byCode.get(code);
    const item = board?.items.find((i) => i.post === code);
    if (!board || !post || !item) return;
    change(boardId, (b) => ({ ...b, updatedAt: new Date().toISOString(), items: b.items.filter((i) => i.post !== code) }));
    notify(`Removed from ${board.name}`);
    void write(
      boardId,
      () => supabase.from("board_posts").delete().eq("board_id", boardId).eq("post_id", post.id),
      () => {
        change(boardId, (b) => ({ ...b, items: [item, ...b.items].sort(newestFirst) }));
        notify(`Couldn’t remove it from ${board.name}. Try again.`, "error");
      },
    ).then((removed) => {
      if (removed) track("post_removed_from_board", { board_post_count: board.items.length - 1 });
    });
  };

  const createBoard = (name: string, { description, shared, firstPost }: { description?: string; shared?: boolean; firstPost?: string } = {}) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const post = firstPost ? byCode.get(firstPost) : undefined;
    const shareToken = shared ? crypto.randomUUID() : null;
    const about = description?.trim() || undefined;
    setBoards((list) => [{ id, name, description: about, shareToken, updatedAt: now, items: post ? [{ post: post.shortCode, addedAt: now }] : [] }, ...list]);
    notify(post ? `Saved to ${name}` : `Created ${name}`);

    const created = Promise.resolve(supabase.from("boards").insert({ id, name, description: about ?? null, share_token: shareToken })).then(({ error }) => !error);
    creating.current.set(id, created);
    created.then((ok) => {
      creating.current.delete(id);
      if (ok) {
        track("board_created", {
          has_description: Boolean(about),
          initial_post_requested: Boolean(post),
          shared: Boolean(shared),
        });
        return;
      }
      setBoards((list) => list.filter((b) => b.id !== id));
      notify(`Couldn’t create ${name}. Try again.`, "error");
    });
    if (post) {
      write(
        id,
        () => supabase.from("board_posts").insert({ board_id: id, post_id: post.id }),
        () => {
          change(id, (b) => ({ ...b, items: b.items.filter((item) => item.post !== post.shortCode) }));
          notify(`Created ${name}, but couldn’t save the post to it. Try again.`, "error");
        },
      );
    }
    return id;
  };

  const updateBoard = (id: string, patch: { name?: string; description?: string | null }) => {
    const board = boards.find((b) => b.id === id);
    if (!board) return;
    const before = { name: board.name, description: board.description };
    const local = { ...(patch.name !== undefined && { name: patch.name }), ...(patch.description !== undefined && { description: patch.description ?? undefined }) };
    change(id, (b) => ({ ...b, ...local, updatedAt: new Date().toISOString() }));
    write(
      id,
      () => supabase.from("boards").update(patch).eq("id", id),
      () => {
        change(id, (b) => ({ ...b, ...before }));
        notify("Couldn’t save that change. Try again.", "error");
      },
    );
  };

  const deleteBoard = (id: string) => {
    const board = boards.find((b) => b.id === id);
    if (!board) return;
    setBoards((list) => list.filter((b) => b.id !== id));
    notify(`Deleted ${board.name}`);
    void write(
      id,
      () => supabase.from("boards").delete().eq("id", id),
      () => {
        setBoards((list) => [board, ...list]);
        notify(`Couldn’t delete ${board.name}. Try again.`, "error");
      },
    ).then((deleted) => {
      if (deleted) track("board_deleted", { board_post_count: board.items.length });
    });
  };

  const setNote = (code: string, boardId: string, note: string) => {
    const post = byCode.get(code);
    const item = boards.find((b) => b.id === boardId)?.items.find((i) => i.post === code);
    const text = note.trim();
    if (!post || !item || text === (item.note ?? "")) return;
    const withNote = (value?: string) => (b: Board) => ({ ...b, items: b.items.map((i) => (i.post === code ? { ...i, note: value } : i)) });
    change(boardId, withNote(text || undefined));
    write(
      boardId,
      () => supabase.from("board_posts").update({ note: text || null }).eq("board_id", boardId).eq("post_id", post.id),
      () => {
        change(boardId, withNote(item.note));
        notify("Couldn’t save the note. Try again.", "error");
      },
    );
  };

  const setSharing = (id: string, on: boolean) => {
    const board = boards.find((b) => b.id === id);
    if (!board) return;
    const token = on ? crypto.randomUUID() : null;
    change(id, (b) => ({ ...b, shareToken: token }));
    if (!on) notify(`${board.name} is private again`);
    void write(
      id,
      () => supabase.from("boards").update({ share_token: token }).eq("id", id),
      () => {
        change(id, (b) => ({ ...b, shareToken: board.shareToken }));
        notify(on ? "Couldn’t make a link. Try again." : "Couldn’t turn the link off. Try again.", "error");
      },
    ).then((updated) => {
      if (updated) track("board_sharing_changed", { shared: on });
    });
  };

  const sorted = useMemo(() => boards.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [boards]);

  return (
    <BoardsContext.Provider
      value={{ boards: sorted, status, list: posts, posts: byCode, save, remove, createBoard, updateBoard, deleteBoard, setNote, setSharing, notify }}
    >
      {children}
      {/* The live region stays mounted, so each toast that enters it is announced */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && toastMounted && (
          <p
            key={toast.id}
            role={toast.tone === "error" ? "alert" : undefined}
            data-closing={toastClosing || undefined}
            onPointerEnter={() => setPointedAt(toast.id)}
            onPointerLeave={() => setPointedAt(null)}
            className={cx(
              "flex max-w-sm items-center gap-2 rounded-lg bg-base-900 px-4 py-2.5 text-body text-white shadow-lg motion-reduce:animate-none",
              toastClosing
                ? "pointer-events-none animate-[toast-out_120ms_var(--ease-in-quart)_forwards]"
                : "pointer-events-auto animate-[toast-in_180ms_var(--ease-out-quint)]",
            )}
          >
            {toast.tone === "error" ? <WarningCircle className="size-4 shrink-0" /> : <Check className="size-3.5 shrink-0" />}
            <span className="min-w-0">{toast.text}</span>
          </p>
        )}
      </div>
    </BoardsContext.Provider>
  );
}

// A name for a new board: a "New board" row that opens into a field. `onCreate` gets the
// trimmed name, and whether it came from the keyboard (Enter in the field, or Create pressed
// with a key) rather than a pointer. Used in the Save menu, where `menuItem` makes the row one
// of its items.
export function NewBoardForm({
  onCreate,
  open: startOpen = false,
  label = "New board",
  menuItem = false,
  className,
}: {
  onCreate: (name: string, fromKeyboard: boolean) => void;
  open?: boolean;
  label?: string;
  menuItem?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(startOpen);
  const [name, setName] = useState("");
  // Set by Create's click (a key press clicks with no detail); Enter in the field counts as keyboard
  const fromKeyboard = useRef(true);
  if (!open) {
    return (
      <button
        type="button"
        role={menuItem ? "menuitem" : undefined}
        tabIndex={menuItem ? -1 : undefined}
        onClick={() => setOpen(true)}
        className={cx(
          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-body text-base-900 hover:bg-transparent-hover focus-visible:bg-transparent-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-border-focus active:bg-transparent-hover",
          className,
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded bg-component">
          <Plus className="size-3.5" />
        </span>
        {label}
      </button>
    );
  }
  return (
    <form
      className={cx("flex gap-1.5 p-1", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const keyboard = fromKeyboard.current;
        fromKeyboard.current = true;
        const trimmed = name.trim();
        if (trimmed) onCreate(trimmed, keyboard);
      }}
    >
      <label className="min-w-0 flex-1">
        <span className="sr-only">Board name</span>
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={NAME_MAX}
          placeholder="Board name"
          className="h-9 w-full rounded-md border-0 bg-white px-3 text-body text-base-900 ring-1 ring-base-200 placeholder:text-base-400 focus:ring-2 focus:ring-accent-100 focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={!name.trim()}
        onClick={(event) => {
          fromKeyboard.current = event.detail === 0;
        }}
        className="h-9 shrink-0 rounded-md bg-base-900 px-3 text-body font-medium text-white transition-[background-color,scale] duration-150 hover:bg-base-800 active:scale-[0.96] disabled:bg-disabled disabled:text-disabled-foreground"
      >
        Create
      </button>
    </form>
  );
}

// "Save" with a menu of boards: a board with the post on it shows a check, and choosing it takes
// the post off again. `tone="overlay"` sits on an image. Choosing a board (or making one) from the
// keyboard puts focus back on Save; a pointer's choice doesn't move focus there, because the tiles
// reveal Save on focus-within and it would stay on screen after the pointer left.
export function SaveMenu({ post, tone = "plain", className }: { post: string; tone?: "plain" | "overlay"; className?: string }) {
  const { boards, status, save, remove, createBoard } = useBoards();
  const popover = usePopover("menu");
  // The highlight lives inside the scrolling list, so it scrolls with the rows
  const { glide } = popover;
  const labelId = useId();
  const savedIn = boards.some((board) => board.items.some((item) => item.post === post));

  return (
    <div {...popover.rootProps} className={cx("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        {...popover.triggerProps}
        className={cx(
          "flex h-8 items-center gap-1.5 rounded-lg px-3 text-caption font-medium transition-[background-color,scale] duration-150 active:scale-[0.96]",
          tone === "overlay" ? "bg-white/95 text-base-900 shadow-sm hover:bg-white" : "bg-base-50 text-base-900 hover:bg-base-100",
        )}
      >
        {savedIn ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
        {savedIn ? "Saved" : "Save"}
      </button>
      {popover.mounted && (
        <div
          {...popover.contentProps}
          role="menu"
          aria-labelledby={labelId}
          className={cx("absolute right-0 z-20 mt-1.5 w-64 origin-top-right rounded-lg bg-modal p-1.5 shadow-lg outline-none", popover.motion)}
        >
          <p id={labelId} className="px-2.5 pt-1.5 pb-2 text-caption font-medium text-base-500">
            Save to board
          </p>
          {status === "loading" && <p className="px-2.5 py-2 text-body text-base-500">Loading your boards…</p>}
          <div ref={glide.ref} {...glide.handlers} className="relative max-h-72 overflow-y-auto">
            <span aria-hidden="true" className={cx(GLIDE_HIGHLIGHT, "rounded-md")} style={glide.highlight.style} data-fresh={glide.highlight.fresh || undefined} />
            {boards.map((board) => {
              const inBoard = board.items.some((item) => item.post === post);
              return (
                <button
                  key={board.id}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={inBoard}
                  tabIndex={-1}
                  data-glide-item
                  onClick={(event) => {
                    if (inBoard) remove(post, board.id);
                    else save(post, board.id);
                    popover.close(event.detail === 0);
                  }}
                  className={cx("flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-body text-base-900", GLIDE_ROW)}
                >
                  <BoardThumb board={board} className="size-7" />
                  <span className="min-w-0 flex-1 truncate">{board.name}</span>
                  {inBoard && <Check className="size-3.5 shrink-0 text-base-500" />}
                </button>
              );
            })}
          </div>
          {/* Fixed at the foot, outside the scrolling list, so it keeps its own hover fill */}
          {status !== "loading" && (
            <NewBoardForm
              menuItem
              label={boards.length ? "New board" : "Make your first board"}
              onCreate={(name, fromKeyboard) => {
                createBoard(name, { firstPost: post });
                popover.close(fromKeyboard);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// A board's newest cover, or an empty tile
export function BoardThumb({ board, className }: { board: Board; className?: string }) {
  const { posts } = useBoards();
  const first = board.items[0] && posts.get(board.items[0].post);
  return (
    <span className={cx("relative block shrink-0 overflow-hidden rounded bg-component", className)}>
      {first && <Image src={first.cover} alt="" fill sizes="64px" className="object-cover" />}
    </span>
  );
}
