"use client";

import { useState } from "react";
import Button from "@/components/fundations/elements/Button";
import { apiRequest } from "@/lib/client";
import type { CreativeSummary, SearchFilters, SearchResult } from "@/lib/services/creatives";
import CreativeCard from "./CreativeCard";

/** Carbon's 4-up grid with "Show more", paging through the shared search API. */
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
      <div className="group mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {items.map((creative) => (
          <CreativeCard key={creative.id} creative={creative} showWhy={Boolean(query)} />
        ))}
      </div>

      <div role="status" aria-live="polite" className="mt-4 min-h-5 text-center text-sm text-red-700">
        {error}
      </div>

      {cursor && (
        <div className="mt-6 flex justify-center">
          <Button type="button" variant="muted" size="sm" className="px-6" onClick={() => void loadMore()} disabled={loading}>
            {loading ? "Loading…" : "Show more"}
          </Button>
        </div>
      )}
    </>
  );
}
