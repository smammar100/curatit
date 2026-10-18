"use client";

// The dashboard header, after Cosmos: the mark and the For you / Discover tabs, a
// search pill in the middle, then Create, Saved (a bookmark with the count of saved posts) and
// the account menu. The feed drives it directly; other dashboard pages pass `onView` /
// `onSearch` that take you back to the feed.
import { useMemo, useState } from "react";
import Link from "next/link";
// Assets
import Symbol from "@/components/assets/Symbol";
// Icons
import BookmarkSimple from "@/components/fundations/icons/BookmarkSimple";
import CaretDown from "@/components/fundations/icons/CaretDown";
import Plus from "@/components/fundations/icons/Plus";
import { cx } from "@/lib/cx";
import AccountMenu from "./AccountMenu";
import { useBoards } from "./boards";
import NewBoardDialog from "./NewBoardDialog";
import SearchBox from "./SearchBox";
import { GLIDE_HIGHLIGHT, GLIDE_ROW, usePopover } from "./usePopover";

export const VIEWS = ["For you", "Discover", "Saved"] as const;
export type View = (typeof VIEWS)[number];
// The views with a tab; Saved has the bookmark instead
const TABS = ["For you", "Discover"] as const satisfies readonly View[];

export default function Header({
  view,
  onView,
  query,
  onQuery,
  onSearch,
}: {
  // The tab that's on, or null on pages that aren't the feed
  view: View | null;
  onView: (view: View) => void;
  query: string;
  onQuery: (query: string) => void;
  // A search was committed (Enter, or a pick from the panel)
  onSearch?: (query: string) => void;
}) {
  const { boards } = useBoards();
  const savedCount = useMemo(() => new Set(boards.flatMap((board) => board.items.map((item) => item.post))).size, [boards]);

  return (
    <header className="sticky top-0 z-30 grid h-23 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 bg-white px-4 sm:gap-4 sm:px-6 lg:grid-cols-[1fr_minmax(0,36rem)_1fr] lg:gap-8">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" aria-label="Your feed" className="text-base-900">
          <Symbol className="size-8" />
        </Link>
        {/* Tabs on wide screens, a menu below that */}
        <nav aria-label="Feed" className="hidden items-center gap-6 lg:flex">
          {TABS.map((option) => (
            <button
              key={option}
              type="button"
              aria-current={option === view ? "page" : undefined}
              onClick={() => onView(option)}
              className="text-title font-medium whitespace-nowrap text-base-500 transition-colors duration-150 hover:text-base-900 aria-[current=page]:text-base-900"
            >
              {option}
            </button>
          ))}
        </nav>
        <ViewMenu view={view} onChange={onView} className="hidden sm:block lg:hidden" />
      </div>

      <SearchBox query={query} onQuery={onQuery} onSearch={onSearch} className="w-full" />

      <div className="flex items-center justify-end gap-2">
        <CreateBoard />
        {/* Saved: filled while you're on it (or on one of your boards), with the count */}
        <button
          type="button"
          onClick={() => onView("Saved")}
          aria-label={savedCount ? `Saved, ${savedCount} ${savedCount === 1 ? "post" : "posts"}` : "Saved"}
          aria-current={view === "Saved" ? "page" : undefined}
          title="Saved"
          className="relative flex size-11 shrink-0 items-center justify-center rounded-full text-base-900 ring-1 ring-base-200 transition-[background-color,color,scale] duration-150 hover:bg-base-50 active:scale-[0.96] aria-[current=page]:bg-base-900 aria-[current=page]:text-white aria-[current=page]:ring-base-900"
        >
          <BookmarkSimple className="size-4.5" />
          {savedCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-600 px-1 text-micro font-medium text-paper tabular-nums ring-2 ring-white">
              {savedCount}
            </span>
          )}
        </button>
        <AccountMenu savedCount={savedCount} onShowSaved={() => onView("Saved")} />
      </div>
    </header>
  );
}

function ViewMenu({ view, onChange, className }: { view: View | null; onChange: (view: View) => void; className?: string }) {
  const popover = usePopover("menu");
  const { glide } = popover;

  return (
    <div {...popover.rootProps} className={cx("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        {...popover.triggerProps}
        className="flex items-center gap-1.5 text-title font-medium text-base-900"
      >
        {view ?? "Feed"}
        <CaretDown className={cx("size-3.5 transition-transform duration-200 ease-out-quint motion-reduce:transition-none", popover.open && "rotate-180")} />
      </button>
      {popover.mounted && (
        <div
          {...popover.contentProps}
          role="menu"
          aria-label="Feed"
          className={cx("absolute left-0 z-40 mt-2 w-44 origin-top-left rounded-2xl bg-modal p-1.5 shadow-lg outline-none", popover.motion)}
        >
          <div ref={glide.ref} {...glide.handlers} className="relative">
            <span aria-hidden="true" className={cx(GLIDE_HIGHLIGHT, "rounded-xl")} style={glide.highlight.style} data-fresh={glide.highlight.fresh || undefined} />
            {TABS.map((option) => (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={option === view}
                tabIndex={-1}
                data-glide-item
                onClick={() => {
                  onChange(option);
                  popover.close();
                }}
                className={cx("flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-body text-base-900", GLIDE_ROW)}
              >
                {option}
                {option === view && <span className="size-1.5 rounded-full bg-base-900" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Create: opens the new board dialog
function CreateBoard() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Create a board"
        aria-haspopup="dialog"
        className="flex h-11 items-center gap-1.5 rounded-full px-3 text-title font-medium text-base-900 ring-1 ring-base-200 transition-[background-color,scale] duration-150 hover:bg-base-50 active:scale-[0.96] md:px-5"
      >
        <Plus className="size-4.5" />
        <span className="hidden md:inline">Create</span>
      </button>
      <NewBoardDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
