"use client";

// The /sites directory's search (Fuse.js over the sites' titles and taglines). Since 2026-10-24 it
// is Glaze's: a floating bar at the foot of the page (a floating surface on the ladder holding one
// secondary Button with the ⌘K hint after its words) opens a Dialog holding a search Input; Cmd/Ctrl+K
// opens it from anywhere, the dialog focuses the field, keeps the page behind it still, closes on
// Escape (the search field takes the first Escape to clear typed text) and puts focus back on the
// bar. Each result is an Item whose ItemLink covers the row; nothing found is an Empty that writes
// the query back. Closing clears the query.
import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
// Glaze
import { Button } from "@/components/glaze/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/glaze/ui/dialog";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/glaze/ui/empty-state";
import { Input } from "@/components/glaze/ui/input";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemLink, ItemTitle } from "@/components/glaze/ui/item";
import { Kbd } from "@/components/glaze/ui/kbd";

type SearchItem = { title: string; tagline: string; id: string };

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
      {/* A floating bar over the page: a lifted surface, so the covers scrolling under it never
          show through */}
      <div className="fixed inset-x-4 bottom-6 z-(--z-sticky) mx-auto max-w-xs rounded-pill bg-surface-6 p-1 shadow-surface-6">
        <Button variant="secondary" className="w-full" aria-keyshortcuts="Meta+K Control+K" onClick={() => setOpen(true)}>
          Search for tools
          <Kbd keys="mod+k" />
        </Button>
      </div>
      <Dialog open={open} onOpenChange={change}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Input mode="search" aria-label="Search sites" placeholder="Search posts..." value={query} onValueChange={setQuery} />
            {trimmed && (
              <div className="mt-2">
                {results.length === 0 ? (
                  <Empty reason="no-results" variant="plain" size="sm">
                    <EmptyHeader>
                      <EmptyTitle>
                        Nothing matches <code>{trimmed}</code>
                      </EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <ItemGroup variant="plain" aria-label="Results">
                    {results.map(({ item }) => (
                      <Item key={item.id}>
                        <ItemContent>
                          <ItemTitle>
                            <ItemLink href={`/sites/site/${item.id}`} onClick={() => change(false)}>
                              {item.title}
                            </ItemLink>
                          </ItemTitle>
                          <ItemDescription>{item.tagline}</ItemDescription>
                        </ItemContent>
                      </Item>
                    ))}
                  </ItemGroup>
                )}
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
