"use client";

// The dashboard header, after Cosmos: the mark and the For you / Discover switch, a search pill in the
// middle, then Saved (a bookmark), Create and the account menu. The
// feed drives it directly; other dashboard pages pass `onView` / `onSearch` that take you back to
// the feed. Since 2026-10-24 every control is Glaze's: the two views a SegmentedControl (a few views
// of one thing), a DropdownMenu of them below lg. The right side follows Mobbin's header since
// 2026-10-24 (the owner shared it for its balance): everything one height (44px), Saved a ghost
// bookmark with no count on it (the primary while you're on it), Create the one outlined pill, and
// the avatar as tall as the buttons. The search pill (SearchBox) is its own, as before.
import { useMemo, useState } from "react";
import Link from "next/link";
import Symbol from "@/components/assets/Symbol";
import { Button } from "@/components/glaze/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/glaze/ui/dropdown-menu";
import { SegmentedControl, SegmentedControlItem } from "@/components/glaze/ui/segmented-control";
import { Add, Bookmark, ChevronDown, Icon } from "@/components/glaze/icon";
import AccountMenu from "./AccountMenu";
import { useBoards } from "./boards";
import NewBoardDialog from "./NewBoardDialog";
import SearchBox from "./SearchBox";

export const VIEWS = ["For you", "Discover", "Saved"] as const;
export type View = (typeof VIEWS)[number];
// The views with a segment; Saved has the bookmark instead
const TABS = ["For you", "Discover"] as const satisfies readonly View[];

export default function Header({
  view,
  onView,
  query,
  onQuery,
  onSearch,
}: {
  // The view that's on, or null on pages that aren't the feed
  view: View | null;
  onView: (view: View) => void;
  query: string;
  onQuery: (query: string) => void;
  // A search was committed (Enter, or a pick from the panel)
  onSearch?: (query: string) => void;
}) {
  const { boards } = useBoards();
  const savedCount = useMemo(() => new Set(boards.flatMap((board) => board.items.map((item) => item.post))).size, [boards]);
  const onSaved = view === "Saved";

  return (
    <header className="sticky top-0 z-(--z-sticky) grid h-23 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 bg-page px-4 sm:gap-4 sm:px-6 lg:grid-cols-[1fr_minmax(0,2fr)_1fr] lg:gap-8">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" aria-label="Your feed" className="rounded-tag text-text-1">
          <Symbol className="size-8" aria-hidden="true" />
        </Link>
        {/* The two views on wide screens, a menu of them below lg. On a page that isn't the feed
            neither is chosen */}
        <SegmentedControl
          aria-label="Feed"
          value={view && view !== "Saved" ? view : ""}
          onValueChange={(next) => onView(next as View)}
          size="lg"
          className="hidden lg:flex"
        >
          {TABS.map((option) => (
            <SegmentedControlItem key={option} value={option}>
              {option}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        <div className="hidden sm:block lg:hidden">
          <ViewMenu view={view} onChange={onView} />
        </div>
      </div>

      <SearchBox query={query} onQuery={onQuery} onSearch={onSearch} className="w-full max-w-xl justify-self-center" />

      {/* After Mobbin's header (2026-10-24, at the owner's request): every control one height, the
          icon a plain ghost button, one outlined pill, then the avatar as tall as the rest; the header's
          controls take the large step (44px, 20px icons) beside the 52px search */}
      <div className="flex items-center justify-end gap-1 sm:gap-2 lg:gap-3">
        {/* Saved: a ghost bookmark, the ink glass while you're on it or on one of your boards. The
            bookmark alone, as on Mobbin (its count badge was taken out at the owner's request); the
            count is still in its name for screen readers */}
        <Button
          variant={onSaved ? "primary" : "ghost"}
          size="icon-lg"
          onClick={() => onView("Saved")}
          aria-label={savedCount > 0 ? `Saved, ${savedCount} ${savedCount === 1 ? "post" : "posts"}` : "Saved"}
          aria-current={onSaved ? "page" : undefined}
        >
          <Icon icon={Bookmark} />
        </Button>
        <CreateBoard />
        <AccountMenu onShowSaved={() => onView("Saved")} />
      </div>
    </header>
  );
}

// The feed menu below lg: the views as a radio group (a check on the one you're on; none on pages
// that aren't the feed), opened from a ghost Button with a caret
function ViewMenu({ view, onChange }: { view: View | null; onChange: (view: View) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="lg" aria-label={`Feed: ${view ?? "none chosen"}`} />}>
        {view ?? "Feed"}
        <Icon icon={ChevronDown} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={view ?? ""} onValueChange={(next) => next && onChange(next as View)}>
          {TABS.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {option}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Create: opens the new board dialog. Below md it's the plus alone, an icon button the size of
// Saved and the avatar beside it; from md it's the word alone on the header's one outlined pill,
// as Mobbin's "Invite & earn"
function CreateBoard() {
  const [open, setOpen] = useState(false);
  const show = () => setOpen(true);
  return (
    <>
      <Button variant="secondary" size="icon-lg" onClick={show} aria-label="Create a board" aria-haspopup="dialog" className="md:hidden">
        <Icon icon={Add} />
      </Button>
      <Button variant="secondary" size="lg" onClick={show} aria-haspopup="dialog" aria-label="Create a board" className="hidden md:inline-flex">
        Create
      </Button>
      <NewBoardDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
