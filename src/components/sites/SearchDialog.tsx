"use client";

// The /sites directory's search (Fuse.js over the sites' titles and taglines). Since 2026-10-23
// it is the system's Dialog holding a SearchField: a floating bar at the foot of the page (a
// raised surface holding one muted Button with ⌘K after its words) opens it, Cmd/Ctrl+K opens it
// from anywhere, the dialog focuses the field, keeps the page behind it still, closes on Escape
// (SearchField takes the first Escape to clear typed text) and puts focus back on the bar. Each
// result is a link row on the hover tint; nothing found is an EmptyState. Closing clears the query.
import Fuse from "fuse.js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
// Fundations
import Button from "@/components/fundations/elements/Button";
import Kbd from "@/components/fundations/elements/Kbd";
import Dialog from "@/components/fundations/molecules/Dialog";
import EmptyState from "@/components/fundations/molecules/EmptyState";
import SearchField from "@/components/fundations/molecules/SearchField";
import { fontWeights } from "@/lib/font-weight";

type SearchItem = { title: string; tagline: string; id: string };

const semibold = { fontVariationSettings: fontWeights.semibold };

export default function SearchDialog({ items }: { items: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Fuzzy search over titles and taglines
  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["title", "tagline"],
        threshold: 0.3, // Lower is stricter
        includeMatches: true,
      }),
    [items]
  );
  const trimmed = query.trim();
  const results = trimmed ? fuse.search(trimmed) : [];

  function change(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  // Cmd/Ctrl + K opens the search; Escape is the dialog's own
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? event.metaKey : event.ctrlKey;
      if (modKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {/* A floating bar over the page: a raised surface, so the covers scrolling under it never
          show through */}
      <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 rounded-[24px] bg-surface-3 p-2 shadow-surface-4">
        <Button
          variant="muted"
          size="base"
          className="w-full"
          rightIcon={<Kbd size="sm" keys={["cmd", "k"]} hideOnTouch />}
          onClick={() => setOpen(true)}
        >
          Search for tools
        </Button>
      </div>
      <Dialog open={open} onOpenChange={change} title="Search" titleVariant="quiet" size="md">
        <SearchField aria-label="Search sites" placeholder="Search posts..." value={query} onValueChange={setQuery} />
        {trimmed && (
          <div className="mt-2 space-y-1">
            {results.length === 0 && (
              <EmptyState size="sm" context="site" title={<>There&apos;s nothing here,...</>} />
            )}
            {results.map(({ item }) => (
              <Link
                key={item.id}
                href={`/sites/site/${item.id}`}
                onClick={() => change(false)}
                className="block rounded-[12px] px-4 py-3 transition-colors duration-80 hover:bg-hover focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
              >
                <p className="text-body-base text-foreground" style={semibold}>
                  {item.title}
                </p>
                <p className="text-body-sm text-muted-foreground">{item.tagline}</p>
              </Link>
            ))}
          </div>
        )}
      </Dialog>
    </>
  );
}
