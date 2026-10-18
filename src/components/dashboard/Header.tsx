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
import Plus from "@/components/fundations/icons/Plus";
import Button from "@/components/fundations/elements/Button";
import Menu, { MenuCaret, MenuItemRadio, MenuRadioGroup } from "@/components/fundations/molecules/Menu";
import AccountMenu from "./AccountMenu";
import { useBoards } from "./boards";
import NewBoardDialog from "./NewBoardDialog";
import SearchBox from "./SearchBox";

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
              className="relative rounded-sm text-title font-medium whitespace-nowrap text-secondary-foreground after:absolute after:-inset-x-2 after:-inset-y-3 transition-colors duration-150 ease-out-quint hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus aria-[current=page]:text-primary-foreground"
            >
              {option}
            </button>
          ))}
        </nav>
        <div className="hidden sm:block lg:hidden">
          <ViewMenu view={view} onChange={onView} />
        </div>
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

// The feed menu below lg: the shared Menu, with the views as a radio group (a check on the one
// you're on; none on pages that aren't the feed). The trigger keeps the tabs' type, with the
// menu's caret, which turns while it's open
function ViewMenu({ view, onChange }: { view: View | null; onChange: (view: View) => void }) {
  return (
    <Menu
      label="Feed"
      trigger={
        <button
          type="button"
          className="relative flex items-center gap-1.5 rounded-sm text-title font-medium text-primary-foreground after:absolute after:-inset-x-2 after:-inset-y-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus"
        >
          {view ?? "Feed"}
          <MenuCaret />
        </button>
      }
    >
      <MenuRadioGroup<View | ""> value={view ?? ""} onValueChange={(next) => next && onChange(next)}>
        {TABS.map((option) => (
          <MenuItemRadio key={option} value={option}>
            {option}
          </MenuItemRadio>
        ))}
      </MenuRadioGroup>
    </Menu>
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
