"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CardGroup } from "@/components/ui/card";
import { apiRequest } from "@/lib/client";
import type { CreativeSummary, SearchFilters, SearchResult } from "@/lib/services/creatives";
import CreativeCard from "./CreativeCard";

/** The library grid: one fluid-hover CardGroup with "Show more", paging through the search API. */
export default function LibraryGrid({
  initialItems,
  initialCursor,
  query,
  filters,
}: {
  initialItems: CreativeSummary[];
  initialCursor: string | null;
  query: string;
  filters: SearchFilters;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const columns = useColumns();

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    setError(null);
    try {
      const next = await apiRequest<SearchResult>("POST", "/api/search", { query, filters, cursor, limit: 24 });
      setItems((current) => [...current, ...next.items]);
      setCursor(next.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load more. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-6">
        <CardGroup columns={columns} separated>
          {items.map((creative) => (
            <CreativeCard key={creative.id} creative={creative} showWhy={Boolean(query)} />
          ))}
        </CardGroup>
      </div>

      <div role="status" aria-live="polite" className="mt-4 min-h-5 text-center text-[13px] text-destructive">
        {error}
      </div>

      {cursor && (
        <div className="mt-4 flex justify-center">
          <Button type="button" variant="secondary" loading={loading} onClick={() => void loadMore()}>
            Show more
          </Button>
        </div>
      )}
    </>
  );
}

/** 4 columns from 1024px, 2 from 640px, else 1. The fluid hover needs a real column count. */
function useColumns() {
  const [columns, setColumns] = useState(4);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const mid = window.matchMedia("(min-width: 640px)");
    const update = () => setColumns(wide.matches ? 4 : mid.matches ? 2 : 1);
    update();
    wide.addEventListener("change", update);
    mid.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      mid.removeEventListener("change", update);
    };
  }, []);
  return columns;
}
