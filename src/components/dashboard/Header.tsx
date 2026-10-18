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
import Button from "@/components/fundations/elements/Button";
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
    <header className="sticky top-0 z-30 grid h-23 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 bg-page px-4 sm:gap-4 sm:px-6 lg:grid-cols-[1fr_minmax(0,36rem)_1fr] lg:gap-8">
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard"
          aria-label="Your feed"
          className="rounded-sm text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-border-focus"
        >
          <Symbol className="size-8" aria-hidden="true" />
        </Link>
        {/* Tabs on wide screens, a menu below that */}
        <nav aria-label="Feed" className="hidden items-center gap-6 lg:flex">
          {TABS.map((option) => (
            <button
              key={option}
              type="button"
              aria-current={option === view ? "page" : undefined}
              onClick={() => onView(option)}
              className="rounded-sm text-title font-medium whitespace-nowrap text-secondary-foreground transition-colors duration-150 ease-out-quint hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus aria-[current=page]:text-primary-foreground"
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
        {/* Saved: filled while you're on it (or on one of your boards), with the count. Filled is
            the primary button's solid, without the secondary one's shadow */}
        <Button
          variant="secondary"
          size="lg"
          shape="pill"
          iconOnly
          onClick={() => onView("Saved")}
          aria-label={savedCount ? `Saved, ${savedCount} ${savedCount === 1 ? "post" : "posts"}` : "Saved"}
          aria-current={view === "Saved" ? "page" : undefined}
          title="Saved"
          className="aria-[current=page]:bg-inverted-solid aria-[current=page]:text-on-inverted-foreground aria-[current=page]:shadow-none"
        >
          <BookmarkSimple className="size-4.5" />
          {/* The count: the brand's solid, cut out of the header by a ring of the page's colour */}
          {savedCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-solid px-1 text-micro font-medium text-on-brand-solid-foreground tabular-nums ring-2 ring-page">
              {savedCount}
            </span>
          )}
        </Button>
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
        className="flex items-center gap-1.5 rounded-sm text-title font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus"
      >
        {view ?? "Feed"}
        <CaretDown className={cx("size-3.5 transition-transform duration-200 ease-out-quint motion-reduce:transition-none", popover.open && "rotate-180")} />
      </button>
      {popover.mounted && (
        <div
          {...popover.contentProps}
          role="menu"
          aria-label="Feed"
          className={cx("absolute left-0 z-40 mt-2 w-44 origin-top-left rounded-2xl bg-modal p-1.5 shadow-lg outline-hidden", popover.motion)}
        >
          {/* Rows and their highlight are the menu's radius less its padding (12 − 6) */}
          <div ref={glide.ref} {...glide.handlers} className="relative">
            <span aria-hidden="true" className={cx(GLIDE_HIGHLIGHT, "rounded-md")} style={glide.highlight.style} data-fresh={glide.highlight.fresh || undefined} />
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
                className={cx("flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-body text-primary-foreground", GLIDE_ROW)}
              >
                {option}
                {option === view && <span className="size-1.5 rounded-full bg-primary-foreground" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Create: opens the new board dialog. Just the plus below md, where it keeps a near-round 12px
// either side; the label joins it from md. Button lg's own px-4 is overridden on purpose
// (12px below md, 20px from md, as before): the breakpoint variants sort after the base
// utility, so they always win
function CreateBoard() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="secondary"
        size="lg"
        shape="pill"
        onClick={() => setOpen(true)}
        aria-label="Create a board"
        aria-haspopup="dialog"
        leftIcon={<Plus className="size-4.5" />}
        className="max-md:px-3 md:px-5"
      >
        <span className="hidden md:inline">Create</span>
      </Button>
      <NewBoardDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
