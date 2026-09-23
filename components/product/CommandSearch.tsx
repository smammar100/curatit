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
import { Elevated } from "@/lib/elevated";
import type { QuickSearchItem } from "@/lib/services/creatives";

const SEARCH = "__search";

/**
 * ⌘K search over the library. Fuzzy matches run locally (no API call per
 * keystroke); picking the first row runs a full search for the brief.
 */
export default function CommandSearch({ items }: { items: QuickSearchItem[] }) {
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
      <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
        <Elevated offset={2} shadowLevel={5} className="rounded-xl p-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            className="flex h-9 w-72 max-w-[calc(100vw-4rem)] items-center gap-2 rounded-lg px-3 text-left text-[13px] text-muted-foreground outline-none transition-colors duration-80 hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
          >
            <Search aria-hidden="true" className="size-4" strokeWidth={1.5} />
            Search the library
            <kbd className="ml-auto inline-flex h-5 items-center rounded-[4px] bg-muted px-1.5 font-sans text-[11px] text-muted-foreground shadow-surface-1">
              ⌘K
            </kbd>
          </button>
        </Elevated>
      </div>

      <CommandMenuDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
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
