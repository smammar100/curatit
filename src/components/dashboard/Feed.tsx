"use client";

// The dashboard: the library as a feed, after Cosmos's signed-in home (chosen from a three-way
// prototype on 2026-10-10). The header's tabs pick the view, its search filters the posts, and
// the grid shows them. ?view=newest|saved and ?q= open the feed on a view or search, which is
// how other dashboard pages send you back here.
import { useEffect, useMemo, useState } from "react";
import { useBoards } from "./boards";
import Grid from "./Grid";
import Header, { VIEWS, type View } from "./Header";
import { GridSkeleton } from "./Skeleton";
import type { DashPost } from "./types";

// Every word of the query appears in the post's hook, brand, category or format
export function matches(post: DashPost, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = `${post.hook} ${post.brand.name} ${post.category.name} ${post.format}`.toLowerCase();
  return words.every((word) => text.includes(word));
}

export const feedHref = (view: View, query = "") => {
  const params = new URLSearchParams();
  if (view !== "For you") params.set("view", view.toLowerCase());
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/dashboard?${search}` : "/dashboard";
};

export default function Feed() {
  const { boards, status, list, posts: byCode } = useBoards();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("For you");

  // Open on the view and search in the address, if any
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromUrl = VIEWS.find((option) => option.toLowerCase() === params.get("view"));
    if (fromUrl) setView(fromUrl);
    const q = params.get("q");
    if (q) setQuery(q);
  }, []);

  // Keep the address in step, so a reload or a shared link opens the same feed (but not while
  // the address is a post's, opened over the feed)
  useEffect(() => {
    if (location.pathname === "/dashboard") history.replaceState(null, "", feedHref(view, query));
  }, [view, query]);

  // Everything on any board, most recently saved first
  const saved = useMemo(
    () =>
      [...new Set(boards.flatMap((board) => board.items).toSorted((a, b) => b.addedAt.localeCompare(a.addedAt)).map((item) => item.post))].flatMap(
        (code) => byCode.get(code) ?? [],
      ),
    [boards, byCode],
  );
  const shown = useMemo(() => {
    const source = view === "Saved" ? saved : list;
    const filtered = query ? source.filter((post) => matches(post, query)) : source;
    return view === "Newest" ? filtered.toSorted((a, b) => b.postedAt.localeCompare(a.postedAt)) : filtered;
  }, [list, saved, query, view]);

  return (
    <div className="min-h-dvh bg-white">
      <Header view={view} onView={setView} query={query} onQuery={setQuery} />
      <main className="px-4 pt-2 pb-24 sm:px-6">
        {view === "Saved" && status === "loading" ? (
          <GridSkeleton label="Loading your saved posts" />
        ) : shown.length ? (
          <Grid posts={shown} />
        ) : (
          <Empty view={view} query={query} onClear={() => setQuery("")} onBrowse={() => setView("For you")} />
        )}
      </main>
    </div>
  );
}

function Empty({ view, query, onClear, onBrowse }: { view: View; query: string; onClear: () => void; onBrowse: () => void }) {
  const nothingSaved = view === "Saved" && !query;
  return (
    <div className="mx-auto max-w-sm py-24 text-center">
      <p className="text-base text-base-900">{nothingSaved ? "Nothing saved yet" : `Nothing matches ‘${query}’`}</p>
      <p className="mt-2 text-sm text-base-600">
        {nothingSaved
          ? "Save posts from your feed and they’ll collect here, and on your boards."
          : "Try a format or a goal instead, like ‘carousel’ or ‘launch’."}
      </p>
      <button
        type="button"
        onClick={nothingSaved ? onBrowse : onClear}
        className="mt-6 text-sm font-medium text-accent-600 hover:text-accent-500"
      >
        {nothingSaved ? "Back to your feed" : "Clear search"}
      </button>
    </div>
  );
}
