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
import Tabs, { Tab, TabList } from "@/components/fundations/molecules/Tabs";
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
        {/* Tabs on wide screens (the shared Tabs since 2026-10-23: the view you're on sits on the
            pressed pill; the feed below is what they switch), a menu below lg */}
        <Tabs value={view ?? ""} onValueChange={(next) => onView(next as View)} className="hidden lg:block">
          <TabList aria-label="Feed">
            {TABS.map((option) => (
              <Tab key={option} value={option}>
                {option}
              </Tab>
            ))}
          </TabList>
        </Tabs>
        <div className="hidden sm:block lg:hidden">
          <ViewMenu view={view} onChange={onView} />
        </div>
      </div>

      <SearchBox query={query} onQuery={onQuery} onSearch={onSearch} className="w-full" />

      <div className="flex items-center justify-end gap-2">
        <CreateBoard />
        {/* Saved: the primary (the ink) while you're on it (or on one of your boards), the outlined
            secondary otherwise, with the count. The badge sits beside the button in a positioned
            wrapper, since the library's button places its own content and would hold it inside */}
        <span className="relative inline-flex">
          <Button
            variant={view === "Saved" ? "default" : "secondary"}
            size="lg"
            iconOnly
            onClick={() => onView("Saved")}
            aria-label={savedCount ? `Saved, ${savedCount} ${savedCount === 1 ? "post" : "posts"}` : "Saved"}
            aria-current={view === "Saved" ? "page" : undefined}
            title="Saved"
          >
            <BookmarkSimple className="size-3.5" />
          </Button>
          {/* The count: the brand's solid, cut out of the header by a ring of the page's colour */}
          {savedCount > 0 && (
            <span className="pointer-events-none absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-solid px-1 text-micro text-on-brand-solid-foreground tabular-nums ring-2 ring-page">
              {savedCount}
            </span>
          )}
        </span>
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
