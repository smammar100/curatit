"use client";

// The dashboard's boards: the signed-in person's boards from public.boards / board_posts, saving
// a post to one or taking it off, making, renaming, describing, sharing and deleting boards,
// notes on a board's posts, the toast that confirms each (Glaze's toast(), through the one Toaster
// in app/dashboard/layout.tsx; a failure is toast.fail, which stays until it's closed), and the
// "Save" menu on each tile (Glaze's DropdownMenu, since 2026-10-24). The pages are static, so the
// boards load in the browser once the page is up
// (Row Level Security limits them to the owner's). Every change shows at once and is
// written in the background; if the write fails it's undone and the toast says so. A new board
// gets its id here (crypto.randomUUID), so a post can be saved to it while it's still being
// written: writes to a board wait for its creation.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/glaze/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/glaze/ui/dropdown-menu";
import { Input } from "@/components/glaze/ui/input";
import { toast } from "@/components/glaze/ui/toast";
import { Add, Check, Icon } from "@/components/glaze/icon";
import { cx } from "@/lib/cx";
import { createClient } from "@/utils/supabase/client";
import { track } from "@/lib/analytics";
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
  // Shows a short confirmation, or a problem, at the bottom of the screen (Glaze's toast)
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
  const [byCode] = useState(() => new Map(posts.map((post) => [post.shortCode, post])));
  // Boards still being written, so a save to one waits for it
  const creating = useRef(new Map<string, Promise<boolean>>());

  // Glaze's toast: its reading time worked out from the words, held while pointed at, focused or
  // in a background tab. A failure is toast.fail: read out assertively, and it stays until closed
  const notify = useCallback((text: string, tone: "done" | "error" = "done") => {
    if (tone === "error") toast.fail(text);
    else toast(text);
  }, []);
  // "Saved to …" carries View board (2026-10-28, from a QA run: nothing else on a post leads to
  // the board it was just saved to)
  const router = useRouter();
  const savedTo = (name: string, id: string) =>
    toast(`Saved to ${name}`, { action: { label: "View board", onClick: () => router.push(`/dashboard/b/${id}`) } });
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
    savedTo(board.name, boardId);
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
    if (post) savedTo(name, id);
    else notify(`Created ${name}`);

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
    notify(text ? "Note saved" : "Note removed");
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
    </BoardsContext.Provider>
  );
}

// The Save menu's last row: "New board", which opens in place into a name field and Create. Enter or
// Create makes the board with the post on it and closes the menu; from the keyboard (Enter, or
// Create pressed with a key) focus goes back to Save, from a pointer it stays put (see SaveMenu).
// Escape closes the menu, as anywhere in it. Other keys typed in the field stay the field's, or the
// menu's arrow keys and type-ahead would take them.
function NewBoardItem({ label, onCreate }: { label: string; onCreate: (name: string, fromKeyboard: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  // Set by Create's click (a key press clicks with no detail); Enter in the field counts as keyboard
  const fromKeyboard = useRef(true);
  if (!open) {
    return (
      <DropdownMenuItem closeOnClick={false} onClick={() => setOpen(true)}>
        <Icon icon={Add} />
        {label}
      </DropdownMenuItem>
    );
  }
  return (
    <form
      className="flex gap-1.5 p-0.5"
      onSubmit={(event) => {
        event.preventDefault();
        const keyboard = fromKeyboard.current;
        fromKeyboard.current = true;
        const trimmed = name.trim();
        if (!trimmed) return;
        onCreate(trimmed, keyboard);
      }}
    >
      <Input
        autoFocus
        aria-label="Board name"
        value={name}
        onValueChange={setName}
        onKeyDown={(event) => {
          if (event.key !== "Escape" && event.key !== "Tab") event.stopPropagation();
        }}
        maxLength={NAME_MAX}
        placeholder="Board name"
        className="min-w-0 flex-1"
      />
      <Button
        type="submit"
        disabled={!name.trim()}
        onClick={(event) => {
          fromKeyboard.current = event.detail === 0;
        }}
      >
        Create
      </Button>
    </form>
  );
}

// "Save" with a menu of boards (Glaze's DropdownMenu): a board with the post on it shows a check,
// and choosing it takes the post off again. The check sits at the row's end (2026-10-28, at the
// owner's request: Glaze keeps its column at the start, which left an empty gap before every board
// the post isn't on), so the boards' covers line up with the heading and New board. Choosing a board (or making one) from the keyboard puts
// focus back on Save; a pointer's choice doesn't move focus there, because the tiles reveal Save on
// focus-within and it would stay on screen after the pointer left. The boards scroll under the
// "Save to board" heading; New board stays at the foot. On a cover and on a page Save is the same
// flat secondary pill (`tone` is kept for the callers): paper with its hairline reads over any image.
export function SaveMenu({ post, className }: { post: string; tone?: "plain" | "overlay"; className?: string }) {
  const { boards, status, save, remove, createBoard } = useBoards();
  const savedIn = boards.some((board) => board.items.some((item) => item.post === post));
  const [open, setOpen] = useState(false);
  // Whether focus goes back to Save as the menu closes. The New board form closes it itself and
  // says; otherwise only a close from the keyboard (Escape, or a board chosen with a key) returns it
  const returnFocus = useRef<boolean | null>(null);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger render={<Button size="sm" variant="secondary" className={className} />}>
        <Icon icon={savedIn ? Check : Add} />
        {savedIn ? "Saved" : "Save"}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        aria-label="Save to board"
        className="w-64"
        finalFocus={(type) => {
          const forced = returnFocus.current;
          returnFocus.current = null;
          return forced ?? type === "keyboard";
        }}
      >
        <DropdownMenuGroup className="flex min-h-0 flex-col overflow-y-auto">
          <DropdownMenuLabel>Save to board</DropdownMenuLabel>
          {status === "loading" && <p className="px-2 py-1.5 type-body-sm text-text-2">Loading your boards…</p>}
          {boards.map((board) => (
            <DropdownMenuCheckboxItem
              key={board.id}
              closeOnClick
              // Room for the check only on a board that has the post, so names keep their width
              className="ps-3 pe-3 data-checked:pe-10 *:data-[slot=dropdown-menu-checkbox-item-indicator]:start-auto *:data-[slot=dropdown-menu-checkbox-item-indicator]:end-3"
              checked={board.items.some((item) => item.post === post)}
              onCheckedChange={(on) => (on ? save(post, board.id) : remove(post, board.id))}
            >
              <BoardThumb board={board} className="size-6" />
              <span className="min-w-0 truncate">{board.name}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        {status !== "loading" && (
          <>
            {boards.length > 0 && <DropdownMenuSeparator />}
            <NewBoardItem
              label={boards.length ? "New board" : "Make your first board"}
              onCreate={(name, fromKeyboard) => {
                createBoard(name, { firstPost: post });
                returnFocus.current = fromKeyboard;
                setOpen(false);
              }}
            />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// A board's newest cover, or an empty tile
export function BoardThumb({ board, className }: { board: Board; className?: string }) {
  const { posts } = useBoards();
  const first = board.items[0] && posts.get(board.items[0].post);
  return (
    <span className={cx("relative block shrink-0 overflow-hidden rounded-tag bg-field", className)}>
      {first && <Image src={first.cover} alt="" fill sizes="64px" className="object-cover" />}
    </span>
  );
}
