"use client";

// The dashboard: the library as a feed, after Cosmos's signed-in home (chosen from a three-way
// prototype on 2026-10-10). The header's tabs pick the view, its search filters the posts, and
// the grid shows them. For you is the library ranked on the person's onboarding answers
// (forYou.ts); someone whose profile has none yet is sent to /dashboard/welcome first. Discover
// adds a row of categories to browse the library by. ?view=
// discover|saved, ?category= (on Discover) and ?q= open the feed on a view, category or
// search, which is how other dashboard pages send you back here.
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { inCategory, OLD_SLUGS } from "@/lib/categories";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/fundations/elements/Button";
import BoardList from "./BoardList";
import { useBoards } from "./boards";
import CategoryBar from "./CategoryBar";
import { rank } from "./forYou";
import { useProfile } from "./profile";
import SavedArt from "./SavedArt";
import Grid from "./Grid";
import Header, { VIEWS, type View } from "./Header";
import { GridSkeleton } from "./Skeleton";
import { brandNamed, categoryNamed, matches } from "./search";
import type { DashPost } from "./types";

export const feedHref = (view: View, query = "", category: string | null = null) => {
  const params = new URLSearchParams();
  if (view !== "For you") params.set("view", view.toLowerCase());
  if (view === "Discover" && category) params.set("category", category);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/dashboard?${search}` : "/dashboard";
};

export default function Feed() {
  const router = useRouter();
  const pathname = usePathname();
  const { boards, status, list, posts: byCode } = useBoards();
  const { status: profileStatus, profile } = useProfile();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("For you");
  // Discover's category (a slug), or null for All
  const [category, setCategory] = useState<string | null>(null);

  // Open on the view, category and search in the address: on arrival, and whenever a link brings
  // the address back to the feed itself (a post's category or search lands here with the feed
  // already mounted). Read through AddressSync, below, since Next updates the address bar only after
  // the page's effects run. An address the feed wrote itself (the effect after next) is skipped, so
  // the two never chase each other and a slow router update can't undo a keystroke
  const written = useRef<string | null>(null);
  const fromAddress = (params: URLSearchParams) => {
    if (sorted(params) === written.current) return;
    setView(VIEWS.find((option) => option.toLowerCase() === params.get("view")) ?? "For you");
    // A link from before the 2026-10-13 categories still lands on the right one
    const fromLink = params.get("category");
    setCategory(fromLink ? (OLD_SLUGS[fromLink] ?? fromLink) : null);
    setQuery(params.get("q") ?? "");
  };

  // First visit: set the feed up before showing it. Only from the feed itself: under a post
  // opened from a link (this is the page beneath it too) the post comes first, and the welcome
  // waits for the next visit to the feed
  const onFeed = pathname === "/dashboard";
  const unset = profileStatus === "ready" && !profile.onboardedAt;
  useEffect(() => {
    if (onFeed && unset) router.replace("/dashboard/welcome");
  }, [onFeed, unset, router]);

  // Keep the address in step, so a reload or a shared link opens the same feed (but not while
  // the address is a post's, opened over the feed)
  useEffect(() => {
    if (location.pathname !== "/dashboard") return;
    const href = feedHref(view, query, category);
    written.current = sorted(new URLSearchParams(href.split("?")[1] ?? ""));
    history.replaceState(null, "", href);
  }, [view, query, category]);

  // Everything on any board, most recently saved first
  const saved = useMemo(
    () =>
      [...new Set(boards.flatMap((board) => board.items).toSorted((a, b) => b.addedAt.localeCompare(a.addedAt)).map((item) => item.post))].flatMap(
        (code) => byCode.get(code) ?? [],
      ),
    [boards, byCode],
  );
  const shown = useMemo(() => {
    const source = view === "Saved" ? saved : view === "Discover" && category ? list.filter((post) => inCategory(post, category)) : list;
    const brand = brandNamed(list, query);
    const named = brand ? null : categoryNamed(query);
    const filtered = !query
      ? source
      : brand
        ? source.filter((post) => post.brand.slug === brand.slug)
        : named
          ? source.filter((post) => inCategory(post, named.slug))
          : source.filter((post) => matches(post, query));
    return view === "For you" ? rank(filtered, profile, list, { fresh: true }) : filtered;
  }, [list, saved, query, view, category, profile]);
  // For you waits for the answers it ranks on, so it never shows one order and then another, and
  // keeps waiting while a first visit is on its way to the welcome flow
  const waiting = (view === "Saved" && status === "loading") || (view === "For you" && (profileStatus === "loading" || (onFeed && unset)));

  return (
    <div className="min-h-dvh bg-page">
      {/* Only this reads the address during render, so only it waits for the browser */}
      <Suspense fallback={null}>
        <AddressSync onAddress={fromAddress} />
      </Suspense>
      <Header view={view} onView={setView} query={query} onQuery={setQuery} />
      <main className="px-4 pt-2 pb-24 sm:px-6">
        {view === "Discover" && <CategoryBar posts={list} value={category} onChange={setCategory} />}
        {/* The Saved view opens on the boards, then every saved post */}
        {view === "Saved" && !query && status !== "loading" && <BoardList />}
        {waiting ? (
          <GridSkeleton label={view === "Saved" ? "Loading your saved posts" : "Loading your feed"} />
        ) : shown.length ? (
          <>
            {view === "Saved" && !query && boards.length > 0 && <h2 className="mb-5 text-title font-medium text-primary-foreground">All saved posts</h2>}
            <Grid posts={shown} />
          </>
        ) : (
          <Empty view={view} query={query} onClear={() => setQuery("")} onBrowse={() => setView("For you")} />
        )}
      </main>
    </div>
  );
}

function Empty({ view, query, onClear, onBrowse }: { view: View; query: string; onClear: () => void; onBrowse: () => void }) {
  const nothingSaved = view === "Saved" && !query;
  // Nothing saved at all: the illustration, then how saving works
  if (nothingSaved) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center py-16 text-center">
        <SavedArt />
        <p className="mt-8 text-title font-medium text-primary-foreground">Your swipe file is empty</p>
        <p className="mt-2 text-body text-pretty text-secondary-foreground">See a carousel that stops your thumb, or a launch you wish you’d made? Hit Save. It waits here for your next brief.</p>
        <Button size="sm" variant="default" onClick={onBrowse} className="mt-6 w-fit">
          Start your swipe file
        </Button>
      </div>
    );
  }
  // A search that found nothing
  return (
    <div className="mx-auto max-w-sm py-24 text-center">
      <p className="text-subtitle font-medium text-primary-foreground">{`Nothing matches ‘${query}’`}</p>
      <p className="mt-2 text-body text-secondary-foreground">Try a format or a goal instead, like ‘carousel’ or ‘launch’.</p>
      <button type="button" onClick={onClear} className="mt-6 rounded-sm text-body font-medium text-brand-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus">
        Clear search
      </button>
    </div>
  );
}

// The address's parameters in one order, to tell the feed's own writes from a link's
const sorted = (params: URLSearchParams) => {
  const copy = new URLSearchParams(params);
  copy.sort();
  return copy.toString();
};

// Hands the feed the address's parameters whenever they change on /dashboard itself. Not while a
// post's address is showing: the feed underneath keeps what it was
function AddressSync({ onAddress }: { onAddress: (params: URLSearchParams) => void }) {
  const pathname = usePathname();
  const params = useSearchParams().toString();
  const latest = useRef(onAddress);
  useEffect(() => {
    latest.current = onAddress;
  });
  useEffect(() => {
    if (pathname === "/dashboard") latest.current(new URLSearchParams(params));
  }, [pathname, params]);
  return null;
}
