"use client";

// A board's page, /dashboard/b/<id>: the "Wall" direction, chosen from a four-way prototype on
// 2026-10-10 (after Are.na and Savee). As many images as fit: a slim header (the name with Share
// and More beside it, the board's short description if it has one, the count) over a tight wall
// of covers with 8px gaps. Notes live on the images: a note shows as a one-line caption that
// opens up on hover or focus, and "Add a note" appears on hover. The name, description and notes
// edit in place. Everything comes from BoardsProvider, so changes show at once and are written
// in the background.
//
// Since 2026-10-24 it is built from Glaze: Share is a Dialog (the link in a copy Input, Open the
// link and Stop sharing, or Create link), More is a DropdownMenu, and Delete asks in an
// alertdialog with focus on Cancel, opened once More's menu has finished closing so focus comes
// back to More after. The wall's tiles sit on the panel corner, the brand label and the note on
// tags of paper, the missing board is Glaze's Empty, and the loading shape is Glaze's Skeleton.
// Since 2026-10-29 the header is the "Banner" and an empty board shows the "Ghost wall" (both at
// the owner's request, from six-way prototypes; see EmptyBoard and AGENTS.md). The name, description and notes still edit in place (Editable): at rest the
// text, with a ghost Button whose hit area covers it, and while editing Glaze's Input or Textarea.
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TextLink from "@/components/fundations/elements/TextLink";
import { Button } from "@/components/glaze/ui/button";
import { Dialog, DialogAction, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/glaze/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/glaze/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/glaze/ui/empty-state";
import { Input } from "@/components/glaze/ui/input";
import { Skeleton } from "@/components/glaze/ui/skeleton";
import { Textarea } from "@/components/glaze/ui/textarea";
import { ArrowLeft, Edit, Globe, Icon, More } from "@/components/glaze/icon";
import BrandName from "@/components/home/BrandName";
import { cx } from "@/lib/cx";
import { NAME_MAX, SaveMenu, useBoards } from "./boards";
import { feedHref } from "./Feed";
import { postHref, ratio, rememberOpener } from "./Grid";
import Header from "./Header";
import { DESCRIPTION_MAX } from "./NewBoardDialog";
import { GridSkeleton } from "./Skeleton";
import type { Board, DashPost } from "./types";

export const boardHref = (id: string) => `/dashboard/b/${id}`;
export const shareHref = (token: string) => `/s/${token}`;

// This site's origin for share links: empty while rendering on the server (there's no
// location there), the real one once the page is in the browser
const noSubscribe = () => () => {};
export function useOrigin() {
  return useSyncExternalStore(noSubscribe, () => location.origin, () => "");
}

const NOTE_MAX = 280;
// A fact about the board in the banner's foot: a chip of paper on the shell's grey
const FACT = "rounded-pill bg-paper px-2.5 py-1 type-caption text-text-2 tabular-nums";
// Tiles aim for this width; the column count is however many fit (two at least). The gap is
// gap-2's 8px
const TARGET = 210;
const GAP = 8;

// "2 hours ago"
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

// Boards deleted from their own page in this visit: the board leaves the list at once while the
// way back to Saved is still loading, so the page waits on its skeleton rather than saying the board
// "may belong to someone else" (2026-10-28, from a QA run)
const deleting = new Set<string>();

export default function BoardView({ id }: { id: string }) {
  const router = useRouter();
  const { boards, status, posts, updateBoard } = useBoards();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<"name" | "description" | null>(null);
  const board = boards.find((b) => b.id === id);
  const items = board ? board.items.flatMap((item) => (posts.get(item.post) ? [{ note: item.note ?? "", post: posts.get(item.post)! }] : [])) : [];

  // The board's name in the tab, kept there: Next writes the dashboard's own title again after a
  // client navigation or a refresh, which wiped it (2026-10-28, from a QA run)
  const name = board?.name;
  useEffect(() => {
    if (!name) return;
    const want = `${name} | Curatit`;
    const apply = () => {
      if (document.title !== want) document.title = want;
    };
    apply();
    const watch = new MutationObserver(apply);
    watch.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => watch.disconnect();
  }, [name]);

  return (
    <div className="min-h-dvh bg-page">
      {/* Boards live under Saved, so that tab is the current one */}
      <Header
        view="Saved"
        onView={(view) => router.push(feedHref(view))}
        query={query}
        onQuery={setQuery}
        onSearch={(text) => router.push(feedHref("For you", text))}
      />
      <main className="px-4 pb-24 sm:px-6">
        {status === "loading" || (!board && deleting.has(id)) ? (
          <BoardSkeleton />
        ) : !board ? (
          <Empty reason="no-access" variant="plain" className="py-24">
            <EmptyHeader>
              <EmptyTitle>This board isn’t here</EmptyTitle>
              <EmptyDescription>It may have been deleted, or it belongs to someone else.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" variant="secondary" render={<Link href={feedHref("Saved")} />} nativeButton={false}>
                Back to Saved
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            {/* The "Banner" (2026-10-29, chosen from a six-way prototype at the owner's request): the
                board's name and what it's for on a panel of the shell's grey, like a cover sheet over
                its posts; the way back, Share and More along its top, the facts as chips at its foot */}
            <header className="mt-2 mb-6 rounded-shell bg-shell px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex items-center justify-between gap-4">
                {/* -ms-3 takes back the ghost Button's 12px padding, so its arrow lines up with the name */}
                <Button variant="ghost" size="sm" render={<Link href={feedHref("Saved")} />} nativeButton={false} className="-ms-3">
                  <Icon icon={ArrowLeft} />
                  Saved
                </Button>
                {/* Share and More: secondary Buttons, like the header's Create */}
                <div className="flex shrink-0 items-center gap-2">
                  <SharePanel board={board} />
                  <MoreMenu board={board} onRename={() => setEditing("name")} onDescribe={() => setEditing("description")} />
                </div>
              </div>
              {/* One long word wraps instead of widening the page (2026-10-28, from a QA run). At rest
                  the name hugs its words, so the hover wash and the pencil sit with it rather than
                  running the width of the banner; while editing, the field takes the full width */}
              <h1 className={cx("-mx-2 mt-5 max-w-3xl type-title text-balance text-text-1 [overflow-wrap:anywhere]", editing !== "name" && "w-fit")}>
                <Editable
                  value={board.name}
                  editing={editing === "name"}
                  onEdit={(on) => setEditing(on ? "name" : null)}
                  onSave={(text) => text && updateBoard(board.id, { name: text })}
                  maxLength={NAME_MAX}
                  label="Board name"
                  size="lg"
                />
              </h1>
              {/* Only when there is one; More has "Add a description" */}
              {(board.description || editing === "description") && (
                <div className={cx("-mx-2 mt-2 max-w-2xl type-body text-pretty text-text-2 [overflow-wrap:anywhere]", editing !== "description" && "w-fit")}>
                  <Editable
                    value={board.description ?? ""}
                    editing={editing === "description"}
                    onEdit={(on) => setEditing(on ? "description" : null)}
                    onSave={(text) => updateBoard(board.id, { description: text || null })}
                    maxLength={DESCRIPTION_MAX}
                    label="Description"
                  />
                </div>
              )}
              <ul aria-label="About this board" className="mt-5 flex flex-wrap items-center gap-2">
                <li className={FACT}>
                  {items.length} {items.length === 1 ? "post" : "posts"}
                </li>
                <li className={FACT}>Updated {ago(board.updatedAt)}</li>
                {board.shareToken && (
                  <li className={cx(FACT, "inline-flex items-center gap-1.5")}>
                    <Icon icon={Globe} size={14} />
                    Shared with a link
                  </li>
                )}
              </ul>
            </header>

            {items.length ? <Masonry board={board} items={items} /> : <EmptyBoard />}
          </>
        )}
      </main>
    </div>
  );
}

// The wall: measured, then dealt across the columns row by row (each post to the shortest
// column), so the newest posts lead along the top as in the feed. Plain CSS columns would run
// them down the first column instead.
function Masonry({ board, items }: { board: Board; items: { note: string; post: DashPost }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(Math.round(element.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const count = width ? Math.max(2, Math.floor((width + GAP) / (TARGET + GAP))) : 0;
  const columns = useMemo(() => {
    // No columns until the width is known (on the server, and before the first measure)
    if (!count) return [];
    const cols: (typeof items)[] = Array.from({ length: count }, () => []);
    const heights = Array<number>(count).fill(0);
    for (const item of items) {
      const shortest = heights.indexOf(Math.min(...heights));
      cols[shortest].push(item);
      heights[shortest] += 1 / ratio(item.post);
    }
    return cols;
  }, [items, count]);

  return (
    <div ref={ref}>
      {count > 0 && (
        <div className="grid grid-cols-(--columns) items-start gap-x-2" style={{ "--columns": `repeat(${count}, minmax(0, 1fr))` } as CSSProperties}>
          {columns.map((column, c) => (
            <ul key={c} className="flex flex-col gap-y-2">
              {column.map(({ note, post }) => (
                <Tile key={post.shortCode} board={board} post={post} note={note} sizes={`${Math.ceil(100 / count)}vw`} />
              ))}
            </ul>
          ))}
        </div>
      )}
    </div>
  );
}

function Tile({ board, post, note, sizes }: { board: Board; post: DashPost; note: string; sizes: string }) {
  const { setNote } = useBoards();
  const [editing, setEditing] = useState(false);
  const reveal = "opacity-0 transition-opacity duration-(--dur-state) ease-out group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100";
  return (
    <li className="group relative">
      <Link
        href={postHref(post.shortCode)}
        scroll={false}
        onClick={rememberOpener}
        className="relative block aspect-(--ratio) overflow-hidden rounded-panel bg-field"
        style={{ "--ratio": ratio(post) } as CSSProperties}
      >
        <Image src={post.cover} alt={post.hook} fill sizes={sizes} className="object-cover" />
      </Link>
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between gap-2 p-2">
        <div className={cx("flex items-start justify-between gap-2", reveal)}>
          <span className="min-w-0 rounded-(--radius-nested) bg-paper px-2 py-1">
            <BrandName brand={post.brand} />
          </span>
          <SaveMenu post={post.shortCode} tone="overlay" className="pointer-events-auto shrink-0" />
        </div>
        {/* The note: one line while resting (when there is one), whole on hover or focus, never
            taller than the tile (it scrolls inside), long words broken. "Add a note" only on hover. */}
        <div
          className={cx(
            "pointer-events-auto min-h-0 shrink overflow-y-auto rounded-(--radius-nested) bg-paper type-caption text-text-1 scrollbar-none",
            !note && !editing && reveal,
          )}
        >
          <Editable
            value={note}
            placeholder="Add a note"
            editing={editing}
            onEdit={setEditing}
            onSave={(text) => setNote(post.shortCode, board.id, text)}
            maxLength={NOTE_MAX}
            label={`Note on ${post.brand.name}’s post`}
            multiline
            hoverFill={false}
            padding="px-2 py-1.5"
            textClassName="[overflow-wrap:anywhere] line-clamp-1 group-hover:line-clamp-none group-focus-within:line-clamp-none"
          />
        </div>
      </div>
    </li>
  );
}

// Text that turns into a field when clicked: Enter (or leaving the field) saves, Escape cancels.
// In a multi-line field Shift+Enter starts a new line. At rest it is the text itself, with the
// hover wash, and a ghost Button named by the text whose hit area covers it all (its pencil shows
// on hover and focus); while editing it is Glaze's Input, or its Textarea for a note.
function Editable({
  value,
  placeholder,
  editing,
  onEdit,
  onSave,
  maxLength,
  label,
  multiline = false,
  hoverFill = true,
  padding = "px-2 py-0.5",
  size = "default",
  textClassName,
}: {
  value: string;
  placeholder?: string;
  editing: boolean;
  onEdit: (on: boolean) => void;
  onSave: (value: string) => void;
  maxLength: number;
  label: string;
  multiline?: boolean;
  // The hover wash under the pointer; off for a note, which sits on its own tag over the cover
  hoverFill?: boolean;
  // The padding at rest: its own prop so a caller never sets a second py-* (cx doesn't merge)
  padding?: string;
  // The field's size while editing: the large Input for the board's name
  size?: "default" | "lg";
  // For the text: a line clamp must sit on an element without padding, or the next line shows
  // through the padding
  textClassName?: string;
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
    // A span, since it sits in the board's h1
    return (
      <span
        className={cx(
          "group/editable relative flex w-full items-start gap-1 rounded-(--corner-xs) text-left transition-colors duration-(--dur-state) ease-out",
          padding,
          hoverFill && "hover:bg-hover",
          // The placeholder ("Add a note") in the placeholder's colour
          !value && "text-text-3",
          multiline && "whitespace-pre-line",
        )}
      >
        <span aria-hidden="true" className={cx("min-w-0 flex-1", textClassName)}>
          {value || placeholder}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(true)}
          aria-label={value || placeholder || label}
          title={`Edit ${label.toLowerCase()}`}
          // No press scale: any scale (1 included) makes the button its ::after's containing
          // block, so the hit area shrank to the 32px button mid-tap and the click landed outside
          // it (2026-10-28, from a QA run: tapping a note or the board's name did nothing)
          className="static -my-1 after:absolute after:inset-0 active:not-data-disabled:scale-none"
        >
          <Icon icon={Edit} className="opacity-0 group-hover/editable:opacity-100 group-has-focus-visible/editable:opacity-100" />
        </Button>
      </span>
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
    // How to save, inside the empty field (2026-10-28, from a QA run: an empty box gave no clue)
    placeholder: multiline ? "Type, then press Enter to save" : "Press Enter to save",
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
  };
  return multiline ? (
    <Textarea rows={3} {...shared} onValueChange={setDraft} />
  ) : (
    <Input size={size} {...shared} onValueChange={setDraft} />
  );
}

// Share: a read-only link anyone can open, made and turned off here, in Glaze's Dialog: the link
// in a copy Input (its Copy button confirms in place, or says it couldn't), then Open the link and
// Stop sharing; or Create link alone. Focus goes to the link field, else Create link, and back on
// Share when it closes.
function SharePanel({ board }: { board: Board }) {
  const { setSharing } = useBoards();
  const [open, setOpen] = useState(false);
  const origin = useOrigin();
  const url = board.shareToken ? `${origin}${shareHref(board.shareToken)}` : "";

  return (
    <>
      <Button variant="secondary" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        Share
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{board.shareToken ? "Anyone with the link can view" : "Share a read-only link"}</DialogTitle>
            <DialogDescription>
              {board.shareToken
                ? "They see the posts and your notes, and can’t change anything."
                : "Anyone with the link sees this board’s posts and your notes. They can’t change anything."}
            </DialogDescription>
          </DialogHeader>
          {board.shareToken && (
            <DialogBody>
              <Input mode="copy" value={url} noun="link" aria-label="Share link" spellCheck={false} />
            </DialogBody>
          )}
          {board.shareToken ? (
            <DialogFooter
              meta={
                <TextLink href={url} external>
                  Open the link
                </TextLink>
              }
            >
              <Button size="sm" variant="secondary" onClick={() => setSharing(board.id, false)}>
                Stop sharing
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <DialogAction close={false} onClick={() => setSharing(board.id, true)}>
                Create link
              </DialogAction>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// More: Glaze's DropdownMenu (Rename, Add/Edit description, Delete board…). Delete asks first, in
// an alertdialog with focus on Cancel, so Enter can't delete by accident. The question opens once
// the menu has finished closing (onOpenChangeComplete): by then focus is back on More, so the
// dialog returns focus there on Cancel or Escape.
function MoreMenu({ board, onRename, onDescribe }: { board: Board; onRename: () => void; onDescribe: () => void }) {
  const router = useRouter();
  const { deleteBoard } = useBoards();
  const [asking, setAsking] = useState(false);
  const pendingDelete = useRef(false);

  return (
    <>
      <DropdownMenu
        onOpenChangeComplete={(open) => {
          if (open || !pendingDelete.current) return;
          pendingDelete.current = false;
          setAsking(true);
        }}
      >
        <DropdownMenuTrigger render={<Button variant="secondary" size="icon" aria-label="More" />}>
          <Icon icon={More} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" aria-label="Board actions">
          <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
          <DropdownMenuItem onClick={onDescribe}>{board.description ? "Edit description" : "Add a description"}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              pendingDelete.current = true;
            }}
          >
            Delete board…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={asking} onOpenChange={setAsking} role="alertdialog">
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{`Delete “${board.name}”?`}</DialogTitle>
            <DialogDescription>The board and its notes will be deleted forever. The posts stay in the library.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <DialogAction
              variant="destructive"
              onAction={() => {
                deleting.add(board.id);
                router.push(feedHref("Saved"));
                deleteBoard(board.id);
              }}
            >
              Delete
            </DialogAction>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// The empty board, the "Ghost wall" (2026-10-29, chosen from a six-way prototype at the owner's
// request): the wall it will become, drawn as empty slots in its own columns (TARGET, GAP) and
// fading out downward, with what goes here and the way to fill it on a card over it. The slots rise
// in once (.board-ghost-slot in global.css), still under reduced motion; decorative, so hidden from
// screen readers, since the card says the same
const SHAPES = [1.25, 0.9, 1.4, 1, 1.2, 0.8, 1.3, 1.1];

function EmptyBoard() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const count = width ? Math.max(2, Math.floor((width + GAP) / (TARGET + GAP))) : 2;

  return (
    <div className="relative">
      <div
        ref={ref}
        aria-hidden="true"
        className="board-ghost grid grid-cols-(--columns) gap-2"
        style={{ "--columns": `repeat(${count}, minmax(0, 1fr))` } as CSSProperties}
      >
        {Array.from({ length: count }, (_, column) => (
          <div key={column} className="flex flex-col gap-2">
            {[0, 1, 2].map((row) => (
              <span
                key={row}
                className="board-ghost-slot block aspect-(--shape) rounded-panel border border-dashed border-line-strong"
                style={{ "--shape": `1 / ${SHAPES[(column * 3 + row) % SHAPES.length]}`, "--delay": `${column * 45 + row * 110}ms` } as CSSProperties}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 top-12 flex justify-center px-2">
        <div className="flex max-w-sm flex-col items-center rounded-shell bg-paper px-6 py-6 text-center shadow-surface-6">
          <h2 className="type-heading text-balance text-text-1">Nothing on this board yet</h2>
          <p className="mt-1.5 type-body text-pretty text-text-2">Posts you save to it fill this wall, newest first.</p>
          <Button size="sm" variant="secondary" render={<Link href="/dashboard" />} nativeButton={false} className="mt-5">
            Browse the feed
          </Button>
        </div>
      </div>
    </div>
  );
}

// The board's shape while it loads: the banner (the way back, Share and More, the name, the line,
// the facts), then the wall
function BoardSkeleton() {
  return (
    <div role="status" aria-label="Loading board">
      <div className="mt-2 mb-6 rounded-shell bg-shell px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-20 rounded-pill" />
          <div className="flex gap-2">
            <Skeleton className="h-(--control) w-16 rounded-pill" />
            <Skeleton className="size-(--control) rounded-pill" />
          </div>
        </div>
        <Skeleton className="mt-5 h-8 w-80 max-w-full rounded-pill" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full rounded-pill" />
        <div className="mt-5 flex gap-2">
          <Skeleton className="h-6 w-16 rounded-pill" />
          <Skeleton className="h-6 w-32 rounded-pill" />
        </div>
      </div>
      <GridSkeleton label="Loading the board’s posts" />
    </div>
  );
}
