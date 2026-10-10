"use client";

// The dashboard's boards: the list, saving a post to one (with a toast), and the "Save" menu
// on each tile. Boards live in memory for now; once sign-in is wired they load from and
// save to public.boards / board_posts.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
// Icons
import Check from "@/components/fundations/icons/Check";
import Plus from "@/components/fundations/icons/Plus";
import { cx } from "@/lib/cx";
import type { Board, DashPost } from "./types";

type BoardsValue = {
  boards: Board[];
  // Every library post, in feed order, and the same posts by short code
  list: DashPost[];
  posts: Map<string, DashPost>;
  save: (post: string, board: string) => void;
  createBoard: () => string;
  // Shows a short confirmation at the bottom of the screen
  notify: (text: string) => void;
};

const BoardsContext = createContext<BoardsValue | null>(null);

export function useBoards() {
  const value = useContext(BoardsContext);
  if (!value) throw new Error("useBoards outside BoardsProvider");
  return value;
}

export function BoardsProvider({ initial, posts, children }: { initial: Board[]; posts: DashPost[]; children: ReactNode }) {
  const [boards, setBoards] = useState(initial);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [byCode] = useState(() => new Map(posts.map((post) => [post.shortCode, post])));

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const save = (post: string, boardId: string) => {
    const board = boards.find((b) => b.id === boardId);
    if (!board) return;
    const already = board.items.some((item) => item.post === post);
    if (!already) {
      setBoards((list) => list.map((b) => (b.id === boardId ? { ...b, items: [{ post }, ...b.items], updated: "Just now" } : b)));
    }
    setToast({ id: Date.now(), text: already ? `Already in ${board.name}` : `Saved to ${board.name}` });
  };

  const createBoard = () => {
    const id = `new-${Date.now()}`;
    setBoards((list) => [{ id, name: "Untitled board", shared: false, updated: "Just now", items: [] }, ...list]);
    setToast({ id: Date.now(), text: "Board created" });
    return id;
  };

  return (
    <BoardsContext.Provider value={{ boards, list: posts, posts: byCode, save, createBoard, notify: (text) => setToast({ id: Date.now(), text }) }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <p
            key={toast.id}
            className="flex max-w-sm animate-[toast-in_180ms_cubic-bezier(0.23,1,0.32,1)] items-center gap-2 rounded-lg bg-base-900 px-4 py-2.5 text-sm text-white shadow-lg motion-reduce:animate-none"
          >
            <Check className="size-3.5 shrink-0" />
            <span className="truncate">{toast.text}</span>
          </p>
        )}
      </div>
    </BoardsContext.Provider>
  );
}

// "Save" with a menu of boards. `tone="overlay"` sits on an image.
export function SaveMenu({ post, tone = "plain", className }: { post: string; tone?: "plain" | "overlay"; className?: string }) {
  const { boards, save } = useBoards();
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
          {boards.map((board) => {
            const inBoard = board.items.some((item) => item.post === post);
            return (
              <button
                key={board.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  save(post, board.id);
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

export function Avatar({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Alex Morgan"
      className={cx("flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-100 text-xs font-medium text-accent-700", className)}
    >
      AM
    </span>
  );
}
