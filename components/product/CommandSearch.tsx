"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Search, FileImage } from "lucide-react";
import {
  CommandMenu,
  CommandMenuDialog,
  CommandMenuEmpty,
  CommandMenuInput,
  CommandMenuList,
  type CommandMenuItemData,
} from "@/components/ui/command-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuickSearchItem } from "@/lib/services/creatives";

const SEARCH = "__search";

/**
 * ⌘K search over the library. Fuzzy matches run locally (no API call per
 * keystroke); picking the first row runs a full search for the brief.
 */
export default function CommandSearch({
  items,
  variant = "bar",
  initialQuery = "",
}: {
  items: QuickSearchItem[];
  /** "bar" is the full-width field at the top of the library; "button" fits a page header. */
  variant?: "bar" | "button";
  /** The brief currently shown, so the bar reads as the field that produced the results. */
  initialQuery?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () => new Fuse(items, { keys: ["brand", "hook", "category", "labels"], threshold: 0.35, ignoreLocation: true }),
    [items]
  );
  const matches = useMemo(() => {
    const value = query.trim();
    const hits = value ? fuse.search(value).slice(0, 8).map((result) => result.item) : items.slice(0, 6);
    return new Set(hits.map((item) => item.id));
  }, [fuse, items, query]);

  const menuItems: CommandMenuItemData[] = useMemo(
    () => [
      {
        value: SEARCH,
        label: query.trim() ? `Search the library for “${query.trim()}”` : "Search the whole library",
        action: "Search",
        icon: Search,
        group: "Brief",
      },
      ...items.map((item) => ({
        value: item.id,
        label: item.hook,
        description: `${item.brand} · ${item.category}`,
        action: "Open post",
        icon: FileImage,
        group: query.trim() ? "Quick matches" : "Recent posts",
      })),
    ],
    [items, query]
  );

  function openSearch() {
    setQuery(initialQuery);
    setOpen(true);
  }

  function select(item: CommandMenuItemData) {
    setOpen(false);
    if (item.value === SEARCH) {
      const value = query.trim();
      router.push(value ? `/library?q=${encodeURIComponent(value)}` : "/library");
    } else {
      router.push(`/creatives/${item.value}`);
    }
  }

  return (
    <>
      {variant === "bar" ? (
        <button
          type="button"
          onClick={openSearch}
          aria-haspopup="dialog"
          className="group/search flex h-11 w-full min-w-0 items-center gap-2.5 rounded-xl bg-card px-3.5 text-left text-[14px] text-muted-foreground shadow-surface-3 outline-none transition-colors duration-80 hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
        >
          <Search aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
          <span className={cn("min-w-0 flex-1 truncate", initialQuery && "text-foreground")}>
            {initialQuery || "Describe a brief or search brands and hooks"}
          </span>
          <kbd className="inline-flex h-5 shrink-0 items-center rounded-[4px] bg-muted px-1.5 font-sans text-[11px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      ) : (
        <Button type="button" variant="secondary" onClick={openSearch} aria-haspopup="dialog">
          <span className="inline-flex items-center gap-1.5">
            <Search aria-hidden="true" className="size-4" strokeWidth={1.5} />
            Search
          </span>
        </Button>
      )}

      <CommandMenuDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          setQuery(next ? initialQuery : "");
        }}
        title="Search the library"
        description="Describe the brief, or jump to a post."
      >
        <CommandMenu
          items={menuItems}
          query={query}
          onQueryChange={setQuery}
          filter={(item) => item.value === SEARCH || matches.has(item.value)}
          onSelect={select}
        >
          <CommandMenuInput placeholder="Describe the brief, for example finance carousels explaining a feature" />
          <CommandMenuList>
            <CommandMenuEmpty>No quick matches. Press Enter for a full search.</CommandMenuEmpty>
          </CommandMenuList>
        </CommandMenu>
      </CommandMenuDialog>
    </>
  );
}
