"use client";

// A board's page, /dashboard/b/<id>: the "Wall" direction, chosen from a four-way prototype on
// 2026-10-10 (after Are.na and Savee). As many images as fit: a slim header (the name with Share
// and More beside it, the board's short description if it has one, the count) over a tight wall
// of covers with 8px gaps. Notes live on the images: a note shows as a one-line caption that
// opens up on hover or focus, and "Add a note" appears on hover. The name, description and notes
// edit in place. Everything comes from BoardsProvider, so changes show at once and are written
// in the background.
//
// Since 2026-10-23 it is built from the system: Share is a Dialog (the link in an Input beside
// Copy, Open the link and Stop sharing, or Create link) rather than a popover beside its button,
// and Delete asks in an alertdialog Dialog with focus on Cancel, opened once More's menu has
// closed so focus comes back to More after. The wall's tiles sit on 10px corners, the brand label
// and the note on 10px tiles of the page's colour, the empty board and the missing board are
// EmptyStates, and the loading shape is the Skeleton atom. The name, description and notes keep
// their own text-in-place editor (Editable): the name is the display serif, and the note sits on
// its own label over the cover, so Input's 28px pill would turn them back into a form. It's set
// as the field recipe while editing (the card surface, the brand ring).
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Fundations
import Button from "@/components/fundations/elements/Button";
import Input from "@/components/fundations/elements/Input";
import Skeleton from "@/components/fundations/elements/Skeleton";
import TextLink from "@/components/fundations/elements/TextLink";
import Dialog from "@/components/fundations/molecules/Dialog";
import EmptyState from "@/components/fundations/molecules/EmptyState";
import Menu, { MenuItem, MenuSeparator } from "@/components/fundations/molecules/Menu";
import BrandName from "@/components/home/BrandName";
import { cx } from "@/lib/cx";
import { fontWeights } from "@/lib/font-weight";
import { exitFallbackMs, spring } from "@/lib/springs";
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
// Tiles aim for this width; the column count is however many fit (two at least)
const TARGET = 210;
const GAP = 8;

const semibold = { fontVariationSettings: fontWeights.semibold };

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

export default function BoardView({ id }: { id: string }) {
  const router = useRouter();
  const { boards, status, posts, updateBoard } = useBoards();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<"name" | "description" | null>(null);
  const board = boards.find((b) => b.id === id);
  const items = board ? board.items.flatMap((item) => (posts.get(item.post) ? [{ note: item.note ?? "", post: posts.get(item.post)! }] : [])) : [];

  const name = board?.name;
  useEffect(() => {
    if (name) document.title = `${name} | Curatit`;
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
        {status === "loading" ? (
          <BoardSkeleton />
        ) : !board ? (
          <EmptyState
            className="py-24"
            title="This board isn’t here"
            description="It may have been deleted, or it belongs to someone else."
            action={
              <Button isLink href={feedHref("Saved")} size="sm" variant="muted">
                Back to Saved
              </Button>
            }
          />
        ) : (
          <>
            <header className="pt-2 pb-6">
              {/* An invisible 44px tap area round the short word */}
              <TextLink variant="quiet" href={feedHref("Saved")} className="after:absolute after:-inset-x-2 after:-inset-y-3">
                Saved
              </TextLink>
              {/* The name and the actions share a row; the rest of the header hangs under the name */}
              <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                <div className="min-w-0 flex-1">
                  <h1 className="-mx-2 font-display text-display font-light text-balance text-foreground">
                    <Editable
                      value={board.name}
                      editing={editing === "name"}
                      onEdit={(on) => setEditing(on ? "name" : null)}
                      onSave={(text) => text && updateBoard(board.id, { name: text })}
                      maxLength={NAME_MAX}
                      label="Board name"
                    />
                  </h1>
                  {/* Only when there is one; More has "Add a description" */}
                  {(board.description || editing === "description") && (
                    <div className="-mx-2 mt-1.5 max-w-2xl text-subtitle text-pretty text-muted-foreground">
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
                  <p className="mt-2 text-body text-muted-foreground tabular-nums">
                    {items.length} {items.length === 1 ? "post" : "posts"} · Updated {ago(board.updatedAt)}
                    {board.shareToken && " · Shared"}
                  </p>
                </div>
                {/* Share and More: the dashboard's secondary pills, like the header's Create */}
                <div className="flex shrink-0 items-center gap-2">
                  <SharePanel board={board} />
                  <MoreMenu board={board} onRename={() => setEditing("name")} onDescribe={() => setEditing("description")} />
                </div>
              </div>
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
        <div className="grid items-start" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, columnGap: GAP }}>
          {columns.map((column, c) => (
            <ul key={c} className="flex flex-col" style={{ gap: GAP }}>
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
  const reveal = "opacity-0 transition-opacity duration-150 ease-out-quint group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100";
  return (
    <li className="group relative">
      <Link
        href={postHref(post.shortCode)}
        scroll={false}
        onClick={rememberOpener}
        className="relative block overflow-hidden rounded-[10px] bg-muted focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
        style={{ aspectRatio: ratio(post) }}
      >
        <Image src={post.cover} alt={post.hook} fill sizes={sizes} className="object-cover" />
      </Link>
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between gap-2 p-2">
        <div className={cx("flex items-start justify-between gap-2", reveal)}>
          <span className="min-w-0 rounded-[10px] bg-background/95 px-2 py-1 shadow-sm">
            <BrandName brand={post.brand} />
          </span>
          <SaveMenu post={post.shortCode} tone="overlay" className="pointer-events-auto shrink-0" />
        </div>
        {/* The note: one line while resting (when there is one), whole on hover or focus, never
            taller than the tile (it scrolls inside), long words broken. "Add a note" only on hover. */}
        <div
          className={cx(
            "pointer-events-auto min-h-0 shrink overflow-y-auto rounded-[10px] bg-background/95 text-caption text-foreground shadow-sm scrollbar-hide",
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
            className="block text-caption"
            textClassName="[overflow-wrap:anywhere] line-clamp-1 group-hover:line-clamp-none group-focus-within:line-clamp-none"
          />
        </div>
      </div>
    </li>
  );
}

// Text that turns into a field when clicked: Enter (or leaving the field) saves, Escape cancels.
// In a multi-line field Shift+Enter starts a new line. Its own, not Input (see the top): at rest
// a ghost row with the hover tint, while editing the field recipe's focused look (the card
// surface, the brand ring) at the text's own size.
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
  className,
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
  // The hover tint under the pointer; off for a note, which sits on its own label over the cover
  // (a second hover background in className would fight this one, since cx doesn't merge)
  hoverFill?: boolean;
  // The padding, at rest and while editing: its own prop so a caller never sets a second py-*
  // through className (cx doesn't merge, and the stylesheet's order would pick the winner)
  padding?: string;
  className?: string;
  // For the text inside the button: a line clamp must sit on an element without padding, or
  // the next line shows through the padding
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
    return (
      <button
        type="button"
        onClick={() => onEdit(true)}
        title={`Edit ${label.toLowerCase()}`}
        className={cx(
          "w-full rounded-[12px] text-left transition-colors duration-80 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]",
          padding,
          hoverFill && "hover:bg-hover",
          // The placeholder ("Add a note") in the placeholder's colour
          !value && "text-tertiary-foreground",
          multiline && "whitespace-pre-line",
          className,
        )}
      >
        {textClassName ? <span className={textClassName}>{value || placeholder}</span> : value || placeholder}
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
    // The text in place, on the card surface with the brand ring (the field recipe's focused
    // look; it only exists while it has focus). border-0 takes off the grey border
    // @tailwindcss/forms gives text fields
    className: cx(
      "w-full rounded-[12px] border-0 bg-surface-3 text-left ring-1 ring-[var(--focus-ring)] outline-hidden [font:inherit]",
      padding,
      className,
    ),
  };
  return multiline ? <textarea rows={3} {...shared} className={cx(shared.className, "resize-none")} /> : <input {...shared} />;
}

// Share: a read-only link anyone can open, made and turned off here, in the shared Dialog: the
// link in an Input beside Copy, Open the link and Stop sharing under it, or Create link alone.
// The dialog puts focus in the link field and back on Share when it closes.
function SharePanel({ board }: { board: Board }) {
  const { setSharing, notify } = useBoards();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const origin = useOrigin();
  const url = board.shareToken ? `${origin}${shareHref(board.shareToken)}` : "";

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
    <>
      <Button variant="secondary" size="lg" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        Share
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        size="sm"
        title={board.shareToken ? "Anyone with the link can view" : "Share a read-only link"}
        description={
          board.shareToken
            ? "They see the posts and your notes, and can’t change anything."
            : "Anyone with the link sees this board’s posts and your notes. They can’t change anything."
        }
        footer={
          board.shareToken ? (
            <>
              {/* An action, so a Button; the link a TextLink, since it goes somewhere */}
              <Button type="button" variant="transparent" onClick={() => setSharing(board.id, false)}>
                Stop sharing
              </Button>
              <TextLink href={url} external className="text-body">
                Open the link
              </TextLink>
            </>
          ) : (
            <Button type="button" variant="default" onClick={() => setSharing(board.id, true)}>
              Create link
            </Button>
          )
        }
      >
        {board.shareToken && (
          // The link and Copy side by side, both at the control height
          <div className="flex gap-2">
            <Input readOnly value={url} aria-label="Share link" spellCheck={false} onFocus={(event) => event.currentTarget.select()} className="min-w-0 flex-1" />
            <Button type="button" variant="default" onClick={copy} className="w-18 shrink-0">
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}
      </Dialog>
    </>
  );
}

// More: the shared Menu (Rename, Add/Edit description, Delete board…). Delete asks first, in an
// alertdialog Dialog with focus on Cancel, so Enter can't delete by accident. The question opens
// once the menu has finished closing (its exit, plus the library's safety margin): by then Radix
// has put focus back on More, so the dialog remembers More as its opener and returns focus there
// on Cancel or Escape.
function MoreMenu({ board, onRename, onDescribe }: { board: Board; onRename: () => void; onDescribe: () => void }) {
  const router = useRouter();
  const { deleteBoard } = useBoards();
  const [asking, setAsking] = useState(false);
  const pendingDelete = useRef(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Menu
        label="Board actions"
        align="end"
        onOpenChange={(open) => {
          if (open || !pendingDelete.current) return;
          pendingDelete.current = false;
          window.setTimeout(() => setAsking(true), exitFallbackMs(spring.fast));
        }}
        trigger={
          <Button variant="secondary" size="lg" iconOnly aria-label="More">
            {/* Three dots, drawn: there's no DotsThree in the icon set yet */}
            <span aria-hidden="true" className="flex gap-[3px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-[3px] rounded-full bg-current" />
              ))}
            </span>
          </Button>
        }
      >
        <MenuItem onSelect={onRename}>Rename</MenuItem>
        <MenuItem onSelect={onDescribe}>{board.description ? "Edit description" : "Add a description"}</MenuItem>
        <MenuSeparator />
        <MenuItem
          tone="danger"
          onSelect={() => {
            pendingDelete.current = true;
          }}
        >
          Delete board…
        </MenuItem>
      </Menu>
      <Dialog
        open={asking}
        onOpenChange={setAsking}
        role="alertdialog"
        size="sm"
        title={`Delete “${board.name}”?`}
        description="The board and its notes go for good. The posts stay in the library."
        closeButton={false}
        initialFocus={cancelRef}
        footer={
          <>
            <Button ref={cancelRef} type="button" variant="muted" onClick={() => setAsking(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                setAsking(false);
                router.push(feedHref("Saved"));
                deleteBoard(board.id);
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </>
  );
}

// The board's empty state: the illustration, what belongs here, and the way to fill it
function EmptyBoard() {
  return (
    <EmptyState
      illustration={<EmptyBoardArt className="w-64" />}
      title="Nothing on this board yet"
      description="Save posts to it from the feed: Save is on every post, and this board is in its list."
      action={
        <Button isLink href="/dashboard" size="sm" variant="default">
          Browse the feed
        </Button>
      }
    />
  );
}

// Two saved posts fanned behind a dashed card waiting for the next one: what a board is, and
// what's missing. Drawn in the system's tokens (the card surface, the one stroke, the muted tint
// for the picture and lines, so it follows dark mode), decorative because the words beside it
// say the same. The cards fan out once (.board-art-card in global.css); static under reduced
// motion.
function EmptyBoardArt({ className }: { className?: string }) {
  const card = (side: "left" | "right", x: number, angle: number) => (
    <g transform={`translate(${x} 46) rotate(${angle} 44 112)`}>
      <g className="board-art-card" data-side={side}>
        <rect x="0.75" y="0.75" width="86.5" height="110.5" rx="10" fill="var(--surface-3)" stroke="var(--border)" strokeWidth="1.5" />
        <rect x="9" y="9" width="70" height="64" rx="5" fill="var(--muted)" />
        <rect x="9" y="83" width="46" height="5" rx="2.5" fill="var(--muted)" />
        <rect x="9" y="94" width="30" height="5" rx="2.5" fill="var(--muted)" />
      </g>
    </g>
  );
  return (
    <svg viewBox="0 0 280 176" aria-hidden="true" className={cx("pointer-events-none select-none", className)}>
      <ellipse cx="140" cy="166" rx="92" ry="5" fill="var(--hover)" />
      {card("left", 46, -10)}
      {card("right", 146, 10)}
      <g transform="translate(96 30)">
        <g className="board-art-card" data-side="front">
          <rect x="0.75" y="0.75" width="86.5" height="126.5" rx="10" fill="var(--surface-3)" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="5 5" />
          <path d="M44 38v26M31 51h26" stroke="var(--muted-foreground)" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="9" y="92" width="46" height="5" rx="2.5" fill="var(--muted)" />
          <rect x="9" y="103" width="30" height="5" rx="2.5" fill="var(--muted)" />
        </g>
      </g>
    </svg>
  );
}

// The board's shape while it loads: the header (the Saved link, the name, the line, the count,
// Share and More at the controls' 28px), then the wall
function BoardSkeleton() {
  return (
    <div role="status" aria-label="Loading board">
      <div className="flex flex-col gap-4 pt-2 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <Skeleton radius="full" className="h-3.5 w-12" />
          <Skeleton radius="full" className="mt-3 h-7 w-64 max-w-full" />
          <Skeleton radius="full" className="mt-3 h-4 w-96 max-w-full" />
          <Skeleton radius="full" className="mt-3 h-3.5 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton radius="lg" className="h-7 w-14" />
          <Skeleton radius="full" className="size-7" />
        </div>
      </div>
      <GridSkeleton label="Loading the board’s posts" />
    </div>
  );
}
