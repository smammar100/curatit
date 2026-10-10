"use client";

// The dashboard header, after Cosmos: the mark and view tabs, a search pill in the middle,
// Create, Upgrade and the account menu. The feed drives it directly; other dashboard pages
// pass `onView` / `onSearch` that take you back to the feed.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
// Assets
import Symbol from "@/components/assets/Symbol";
// Icons
import CaretDown from "@/components/fundations/icons/CaretDown";
import Lightning from "@/components/fundations/icons/Lightning";
import Plus from "@/components/fundations/icons/Plus";
import { cx } from "@/lib/cx";
import AccountMenu from "./AccountMenu";
import { useBoards } from "./boards";
import NewBoardDialog from "./NewBoardDialog";
import SearchBox from "./SearchBox";

export const VIEWS = ["For you", "Newest", "Saved"] as const;
export type View = (typeof VIEWS)[number];

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
    <header className="sticky top-0 z-30 grid h-23 grid-cols-[auto_1fr_auto] items-center gap-4 bg-white px-4 sm:px-6 lg:grid-cols-[1fr_minmax(0,36rem)_1fr] lg:gap-8">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" aria-label="Your feed" className="text-base-900">
          <Symbol className="size-8" />
        </Link>
        {/* Tabs on wide screens, a menu below that */}
        <nav aria-label="Feed" className="hidden items-center gap-6 lg:flex">
          {VIEWS.map((option) => (
            <button
              key={option}
              type="button"
              aria-current={option === view ? "page" : undefined}
              onClick={() => onView(option)}
              className="relative text-title font-medium whitespace-nowrap text-base-500 transition-colors duration-150 hover:text-base-900 aria-[current=page]:text-base-900"
            >
              {option}
              {option === "Saved" && savedCount > 0 && (
                <span className="absolute -top-2.5 -right-4 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-600 px-1 text-micro font-medium text-paper tabular-nums">
                  {savedCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <ViewMenu view={view} onChange={onView} className="hidden sm:block lg:hidden" />
      </div>

      <SearchBox query={query} onQuery={onQuery} onSearch={onSearch} className="w-full" />

      <div className="flex items-center justify-end gap-2">
        <CreateBoard />
        <Link
          href="/pricing"
          aria-label="Upgrade"
          title="Upgrade"
          className="hidden size-11 items-center justify-center rounded-full text-base-900 ring-1 ring-base-200 transition-[background-color,scale] duration-150 hover:bg-base-50 active:scale-[0.96] sm:flex"
        >
          <Lightning className="size-4.5" />
        </Link>
        <AccountMenu savedCount={savedCount} onShowSaved={() => onView("Saved")} />
      </div>
    </header>
  );
}

function ViewMenu({ view, onChange, className }: { view: View | null; onChange: (view: View) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => !ref.current?.contains(event.target as Node) && setOpen(false);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
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
        className="flex items-center gap-1.5 text-title font-medium text-base-900"
      >
        {view ?? "Feed"}
        <CaretDown className={cx("size-3.5 transition-transform duration-200 ease-out", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 z-40 mt-2 w-44 origin-top-left animate-[menu-in_150ms_cubic-bezier(0.23,1,0.32,1)] rounded-2xl bg-white p-1.5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.3)] ring-1 ring-edge motion-reduce:animate-none"
        >
          {VIEWS.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={option === view}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-body text-base-900 hover:bg-base-50"
            >
              {option}
              {option === view && <span className="size-1.5 rounded-full bg-base-900" aria-hidden="true" />}
            </button>
          ))}
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
