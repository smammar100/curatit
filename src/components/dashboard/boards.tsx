"use client";

// The dashboard's boards: the signed-in person's boards from public.boards / board_posts, saving
// a post to one or taking it off, making a new one, the toast that confirms each, and the
// "Save" menu on each tile. The pages are static, so the boards load in the browser once the
// page is up (Row Level Security limits them to the owner's). Every change shows at once and is
// written in the background; if the write fails it's undone and the toast says so. A new board
// gets its id here (crypto.randomUUID), so a post can be saved to it while it's still being
// written: writes to a board wait for its creation.
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
// Icons
import Check from "@/components/fundations/icons/Check";
import Plus from "@/components/fundations/icons/Plus";
import WarningCircle from "@/components/fundations/icons/WarningCircle";
import { cx } from "@/lib/cx";
import { createClient } from "@/utils/supabase/client";
import type { Board, DashPost } from "./types";

type BoardsValue = {
  // Most recently used first
  boards: Board[];
  status: "loading" | "ready" | "error";
  // Every library post, in feed order, and the same posts by short code
  list: DashPost[];
  posts: Map<string, DashPost>;
  save: (post: string, board: string) => void;
  remove: (post: string, board: string) => void;
  // Makes a board (with a first post, if given) and returns its id straight away
  createBoard: (name: string, firstPost?: string) => string;
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

export function BoardsProvider({ posts, children }: { posts: DashPost[]; children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [boards, setBoards] = useState<Board[]>([]);
  const [status, setStatus] = useState<BoardsValue["status"]>("loading");
  const [toast, setToast] = useState<{ id: number; text: string; tone: "done" | "error" } | null>(null);
  const [byCode] = useState(() => new Map(posts.map((post) => [post.shortCode, post])));
  // Boards still being written, so a save to one waits for it
  const creating = useRef(new Map<string, Promise<boolean>>());

  const notify = (text: string, tone: "done" | "error" = "done") => setToast({ id: Date.now(), text, tone });
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
          setToast({ id: Date.now(), text: "Couldn’t load your boards. Reload the page to try again.", tone: "error" });
          return;
        }
        setBoards(
          data.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description ?? undefined,
            shared: !!row.share_token,
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
  }, [supabase, posts]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.tone === "error" ? 4000 : 2400);
    return () => clearTimeout(id);
  }, [toast]);

  // Runs a write once the board exists; undoes the change if either fails. A post that's
  // already on the board (saved from another tab) counts as saved.
  const write = async (boardId: string, run: () => PromiseLike<{ error: { code?: string } | null }>, undo: () => void) => {
    if (!(await (creating.current.get(boardId) ?? true))) return;
    const { error } = await run();
    if (error && error.code !== "23505") undo();
  };

  const save = (code: string, boardId: string) => {
    const board = boards.find((b) => b.id === boardId);
    const post = byCode.get(code);
    if (!board || !post) return;
    if (board.items.some((item) => item.post === code)) return notify(`Already in ${board.name}`);
    const now = new Date().toISOString();
    change(boardId, (b) => ({ ...b, updatedAt: now, items: [{ post: code, addedAt: now }, ...b.items] }));
    notify(`Saved to ${board.name}`);
    write(
      boardId,
      () => supabase.from("board_posts").insert({ board_id: boardId, post_id: post.id }),
      () => {
        change(boardId, (b) => ({ ...b, items: b.items.filter((item) => item.post !== code) }));
        notify(`Couldn’t save to ${board.name}. Try again.`, "error");
      },
    );
  };

  const remove = (code: string, boardId: string) => {
    const board = boards.find((b) => b.id === boardId);
    const post = byCode.get(code);
    const item = board?.items.find((i) => i.post === code);
    if (!board || !post || !item) return;
    change(boardId, (b) => ({ ...b, updatedAt: new Date().toISOString(), items: b.items.filter((i) => i.post !== code) }));
    notify(`Removed from ${board.name}`);
    write(
      boardId,
      () => supabase.from("board_posts").delete().eq("board_id", boardId).eq("post_id", post.id),
      () => {
        change(boardId, (b) => ({ ...b, items: [item, ...b.items].sort(newestFirst) }));
        notify(`Couldn’t remove it from ${board.name}. Try again.`, "error");
      },
    );
  };

  const createBoard = (name: string, firstPost?: string) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const post = firstPost ? byCode.get(firstPost) : undefined;
    setBoards((list) => [{ id, name, shared: false, updatedAt: now, items: post ? [{ post: post.shortCode, addedAt: now }] : [] }, ...list]);
    notify(post ? `Saved to ${name}` : `Created ${name}`);

    const created = Promise.resolve(supabase.from("boards").insert({ id, name })).then(({ error }) => !error);
    creating.current.set(id, created);
    created.then((ok) => {
      creating.current.delete(id);
      if (ok) return;
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

  const sorted = useMemo(() => boards.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [boards]);

  return (
    <BoardsContext.Provider value={{ boards: sorted, status, list: posts, posts: byCode, save, remove, createBoard, notify }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <p
            key={toast.id}
            role={toast.tone === "error" ? "alert" : undefined}
            className="flex max-w-sm animate-[toast-in_180ms_cubic-bezier(0.23,1,0.32,1)] items-center gap-2 rounded-lg bg-base-900 px-4 py-2.5 text-sm text-white shadow-lg motion-reduce:animate-none"
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
// trimmed name. Used in the Save menu, the post's board picker and the header's Create.
export function NewBoardForm({
  onCreate,
  open: startOpen = false,
  label = "New board",
  className,
}: {
  onCreate: (name: string) => void;
  open?: boolean;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(startOpen);
  const [name, setName] = useState("");
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx("flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-base-900 hover:bg-base-50", className)}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded bg-base-100">
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
        const trimmed = name.trim();
        if (trimmed) onCreate(trimmed);
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
          className="h-9 w-full rounded-md border-0 bg-white px-3 text-sm text-base-900 ring-1 ring-base-200 placeholder:text-base-400 focus:ring-2 focus:ring-accent-100 focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={!name.trim()}
        className="h-9 shrink-0 rounded-md bg-base-900 px-3 text-sm font-medium text-white transition-[background-color,scale] duration-150 hover:bg-base-800 active:scale-[0.96] disabled:bg-base-100 disabled:text-base-500"
      >
        Create
      </button>
    </form>
  );
}

// "Save" with a menu of boards: a board with the post on it shows a check, and choosing it takes
// the post off again. `tone="overlay"` sits on an image.
export function SaveMenu({ post, tone = "plain", className }: { post: string; tone?: "plain" | "overlay"; className?: string }) {
  const { boards, status, save, remove, createBoard } = useBoards();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const savedIn = boards.some((board) => board.items.some((item) => item.post === post));

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cx("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          "flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-[background-color,scale] duration-150 active:scale-[0.96]",
          tone === "overlay" ? "bg-white/95 text-base-900 shadow-sm hover:bg-white" : "bg-base-50 text-base-900 hover:bg-base-100",
        )}
      >
        {savedIn ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
        {savedIn ? "Saved" : "Save"}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 w-64 origin-top-right animate-[menu-in_150ms_cubic-bezier(0.23,1,0.32,1)] rounded-lg bg-white p-1.5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.3)] ring-1 ring-edge motion-reduce:animate-none"
        >
          <p className="px-2.5 pt-1.5 pb-2 text-xs font-medium text-base-500">Save to board</p>
          {status === "loading" && <p className="px-2.5 py-2 text-sm text-base-500">Loading your boards…</p>}
          <div className="max-h-72 overflow-y-auto">
            {boards.map((board) => {
              const inBoard = board.items.some((item) => item.post === post);
              return (
                <button
                  key={board.id}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={inBoard}
                  onClick={() => {
                    if (inBoard) remove(post, board.id);
                    else save(post, board.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-base-900 hover:bg-base-50"
                >
                  <BoardThumb board={board} className="size-7" />
                  <span className="min-w-0 flex-1 truncate">{board.name}</span>
                  {inBoard && <Check className="size-3.5 shrink-0 text-base-500" />}
                </button>
              );
            })}
          </div>
          {status !== "loading" && (
            <NewBoardForm
              label={boards.length ? "New board" : "Make your first board"}
              onCreate={(name) => {
                createBoard(name, post);
                setOpen(false);
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
    <span className={cx("relative block shrink-0 overflow-hidden rounded bg-base-100", className)}>
      {first && <Image src={first.cover} alt="" fill sizes="64px" className="object-cover" />}
    </span>
  );
}
