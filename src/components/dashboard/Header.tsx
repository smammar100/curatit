"use client";

// The dashboard header, after Cosmos: the mark and the For you / Discover tabs, a
// search pill in the middle, then Create, Saved (a bookmark with the count of saved posts) and
// the account menu. The feed drives it directly; other dashboard pages pass `onView` /
// `onSearch` that take you back to the feed. Since 2026-10-23 every control is the system's:
// the Tabs, the Menu below lg with a ghost Button as its trigger, Create and Saved as compact
// outlined Buttons (Saved carries its count as its label), and the account menu's avatar in a
// ghost icon Button. The search pill (SearchBox) is its own, as before.
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
          className="rounded-[4px] text-foreground focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
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
            secondary otherwise. The count is the button's own label beside the bookmark, like
            Create's plus and word (2026-10-24: a badge pinned on its corner covered the bookmark
            and ran into its neighbours); with nothing saved it's the bookmark alone */}
        {savedCount > 0 ? (
          <Button
            variant={view === "Saved" ? "default" : "secondary"}
            size="lg"
            onClick={() => onView("Saved")}
            aria-label={`Saved, ${savedCount} ${savedCount === 1 ? "post" : "posts"}`}
            aria-current={view === "Saved" ? "page" : undefined}
            title="Saved"
            leftIcon={<BookmarkSimple className="size-3.5" />}
          >
            <span className="tabular-nums">{savedCount}</span>
          </Button>
        ) : (
          <Button
            variant={view === "Saved" ? "default" : "secondary"}
            size="lg"
            iconOnly
            onClick={() => onView("Saved")}
            aria-label="Saved"
            aria-current={view === "Saved" ? "page" : undefined}
            title="Saved"
          >
            <BookmarkSimple className="size-3.5" />
          </Button>
        )}
        <AccountMenu onShowSaved={() => onView("Saved")} />
      </div>
    </header>
  );
}

// The feed menu below lg: the shared Menu, with the views as a radio group (a check on the one
// you're on; none on pages that aren't the feed). The trigger is a ghost Button with the menu's
// caret, which turns while it's open
function ViewMenu({ view, onChange }: { view: View | null; onChange: (view: View) => void }) {
  return (
    <Menu
      label="Feed"
      trigger={
        <Button variant="transparent" size="lg" rightIcon={<MenuCaret />}>
          {view ?? "Feed"}
        </Button>
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

// Create: opens the new board dialog. Below md it's the plus alone, an icon button the size of
// Saved and the avatar beside it (a hidden label left the icon padding behind, a 34px lozenge);
// from md the word joins it
function CreateBoard() {
  const [open, setOpen] = useState(false);
  const show = () => setOpen(true);
  return (
    <>
      <Button variant="secondary" size="lg" iconOnly onClick={show} aria-label="Create a board" aria-haspopup="dialog" className="md:hidden">
        <Plus className="size-3.5" />
      </Button>
      <Button variant="secondary" size="lg" onClick={show} aria-label="Create a board" aria-haspopup="dialog" leftIcon={<Plus className="size-3.5" />} className="hidden md:inline-flex">
        Create
      </Button>
      <NewBoardDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
