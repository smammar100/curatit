"use client";

// The dashboard: the library as a feed, after Cosmos's signed-in home (chosen from a three-way
// prototype on 2026-10-10). The header's tabs pick the view, its search filters the posts, and
// the grid shows them. For you is the library ranked on the person's onboarding answers
// (forYou.ts); someone whose profile has none yet is sent to /dashboard/welcome first. Discover
// opens on a row of categories, then the Playbooks (on For you from 2026-10-20, moved here on
// 2026-10-24) while nothing is typed and every category is showing, after Cosmos's Explore. ?view=
// discover|saved, ?category= (on Discover) and ?q= open the feed on a view, category or
// search, which is how other dashboard pages send you back here.
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { inCategory, OLD_SLUGS } from "@/lib/categories";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/glaze/ui/alert";
import { Button } from "@/components/glaze/ui/button";
import { Empty as EmptyRegion, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/glaze/ui/empty-state";
import { SegmentedControl, SegmentedControlItem } from "@/components/glaze/ui/segmented-control";
import BoardList from "./BoardList";
import { useBoards } from "./boards";
import CategoryBar from "./CategoryBar";
import { rank, spread } from "./forYou";
import { useProfile } from "./profile";
import SavedArt from "./SavedArt";
import SearchEmptyArt from "./SearchEmptyArt";
import Grid from "./Grid";
import Playbooks from "./Playbooks";
import Header, { VIEWS, type View } from "./Header";
import { GridSkeleton } from "./Skeleton";
import { brandNamed, categoryNamed, hookNamed, typeNamed } from "./search";
import { useLibrarySearch } from "./useLibrarySearch";
import type { SearchRefinement } from "@/lib/search/refine";
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
  // The switch and the category bar show a pick at once; the feed under them follows once that has
  // been painted. Restyling and laying out the grid's 291 tiles for a new view takes the browser a
  // few hundred milliseconds on a laptop, and done in the same frame it held the switch still until
  // the feed was ready (2026-10-29). A deferred value wasn't enough: React starts it before the
  // browser has painted anything
  const [settled, setSettled] = useState({ view, category });
  useEffect(() => {
    let timer = 0;
    const frame = requestAnimationFrame(() => {
      timer = window.setTimeout(() => setSettled((was) => (was.view === view && was.category === category ? was : { view, category })));
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [view, category]);
  const shownView = settled.view;
  const shownCategory = settled.category;
  // Everything on any board, most recently saved first
  const saved = useMemo(
    () =>
      [...new Set(boards.flatMap((board) => board.items).toSorted((a, b) => b.addedAt.localeCompare(a.addedAt)).map((item) => item.post))].flatMap(
        (code) => byCode.get(code) ?? [],
      ),
    [boards, byCode],
  );
  // A search keeps to what the view shows: the saved posts, or Discover's category
  const scope = useMemo(
    () => (shownView === "Saved" ? { postIds: saved.map((post) => post.id) } : shownView === "Discover" && shownCategory ? { category: shownCategory } : {}),
    [shownView, shownCategory, saved],
  );
  const search = useLibrarySearch(query, list, scope);

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

  const shown = useMemo(() => {
    const source = shownView === "Saved" ? saved : shownView === "Discover" && shownCategory ? list.filter((post) => inCategory(post, shownCategory)) : list;
    const brand = brandNamed(list, query);
    const named = brand ? null : categoryNamed(query);
    // A type of post or a hook, as the Playbooks cards and chips send them
    const type = brand || named ? null : typeNamed(list, query);
    const hook = brand || named || type ? null : hookNamed(list, query);
    const filtered = !query.trim()
      ? source
      : brand
        ? source.filter((post) => post.brand.slug === brand.slug)
        : named
          ? source.filter((post) => inCategory(post, named.slug))
          : type
            ? source.filter((post) => post.breakdown?.type === type)
            : hook
              ? source.filter((post) => post.breakdown?.hook === hook)
              : source.filter((post) => search.order.has(post.shortCode)).toSorted((a, b) => search.order.get(a.shortCode)! - search.order.get(b.shortCode)!);
    // For you never lets one brand's run (a new import, or a brand the answers favour) fill the top
    return shownView === "For you" && !query.trim() ? spread(rank(filtered, profile, list, { fresh: true }), 6) : filtered;
  }, [list, saved, query, shownView, shownCategory, profile, search.order]);
  // A playbook opened from its card (or typed in full): the search names a type of post exactly. It
  // gets a headline over its posts, set like a board's title, with how many posts from how many brands
  const playbook = useMemo(
    () => (!query.trim() || brandNamed(list, query) || categoryNamed(query) ? null : typeNamed(list, query)),
    [list, query],
  );
  const playbookBrands = useMemo(() => new Set(shown.map((post) => post.brand.slug)).size, [shown]);
  // For you waits for the answers it ranks on, so it never shows one order and then another, and
  // keeps waiting while a first visit is on its way to the welcome flow
  const waiting = (shownView === "Saved" && status === "loading") || (shownView === "For you" && (profileStatus === "loading" || (onFeed && unset)));

  return (
    <div className="min-h-dvh bg-page">
      {/* Only this reads the address during render, so only it waits for the browser */}
      <Suspense fallback={null}>
        <AddressSync onAddress={fromAddress} />
      </Suspense>
      {/* Going to Saved from another view opens on your boards, not on the last search, which
          hid them (2026-10-28, from a QA run); a search typed on Saved still narrows it */}
      <Header
        view={view}
        onView={(next) => {
          if (next === "Saved" && view !== "Saved") setQuery("");
          setView(next);
        }}
        query={query}
        onQuery={setQuery}
      />
      <main className="px-4 pt-2 pb-24 sm:px-6">
        {/* Phones: the header has no room for the views (the switch shows from lg, its menu from sm),
            so they head the feed, full width (2026-10-28, from a QA run: Discover couldn't be
            reached below 640px) */}
        <SegmentedControl
          aria-label="Feed"
          fill
          // The header's 44px, a thumb's reach
          size="lg"
          value={view === "Saved" ? "" : view}
          onValueChange={(next) => setView(next as View)}
          className="mb-4 sm:hidden"
        >
          <SegmentedControlItem value="For you">For you</SegmentedControlItem>
          <SegmentedControlItem value="Discover">Discover</SegmentedControlItem>
        </SegmentedControl>
        {/* Discover, after Cosmos's Explore: the categories under the header, then (with nothing typed
            and every category showing) the playbooks, moved here from For you on 2026-10-24 at the
            owner's request, then the wall */}
        {shownView === "Discover" && <CategoryBar posts={list} value={category} onChange={setCategory} />}
        {shownView === "Discover" && !query.trim() && !shownCategory && (
          <Playbooks
            posts={list}
            onPick={(next) => {
              setQuery(next);
              scrollTo({ top: 0 });
            }}
          />
        )}
        {playbook && (
          <div className="mb-6">
            <h1 className="type-title text-balance text-text-1">{playbook}</h1>
            <p className="mt-1 type-body-sm text-text-2 tabular-nums">
              {shown.length} {shown.length === 1 ? "post" : "posts"} from {playbookBrands} {playbookBrands === 1 ? "brand" : "brands"}
            </p>
          </div>
        )}
        {/* The Saved view opens on the boards, then every saved post */}
        {shownView === "Saved" && !query.trim() && status !== "loading" && <BoardList />}
        {/* One line says what the search found and how: "Searching…" while it runs, in the place the
            count takes, so nothing moves when the results land (search by meaning takes a second or
            two: 2026-10-28, after Copilot's "Searching the web" and Perplexity's "Image results
            for", on Mobbin). Nothing on the tiles: the grid stays pictures */}
        {/* An empty result has no count line: the empty state below says it (2026-10-29) */}
        {(search.loading || (search.result && !search.result.error && shown.length > 0)) && <p role="status" className="mb-5 type-body-sm text-text-2 tabular-nums">
          {search.loading || !search.result ? "Searching…" : <>
            {shown.length} {shown.length === 1 ? "post" : "posts"}{search.result.labels.length ? ` · ${search.result.labels.join(" · ")}` : ""}
            {search.result.ranking === "meaning" && shown.length > 1 ? " · Closest in meaning first" : ""}
            {search.result.capped ? " · First 500 matches. Narrow your search to see more." : ""}
          </>}
        </p>}
        {search.result?.corrections?.length ? (
          <Alert className="mb-5">
            <AlertDescription>
              {search.result.corrections.map((item) => `Read “${item.from}” as “${item.to}”.`).join(" ")} Put a phrase in quotes to search its exact wording.
            </AlertDescription>
          </Alert>
        ) : null}
        {/* Search by meaning failed or was too slow: these are the keyword results, and it says so */}
        {search.result?.notice ? (
          <Alert className="mb-5">
            <AlertDescription>{search.result.notice}</AlertDescription>
            <AlertAction>
              <Button size="sm" variant="secondary" onClick={search.retry}>Try again</Button>
            </AlertAction>
          </Alert>
        ) : null}
        {waiting || search.loading ? (
          // While a search runs, the line above is its status, so the skeleton is only a picture
          <GridSkeleton label={search.loading ? null : shownView === "Saved" ? "Loading your saved posts" : "Loading your feed"} />
        ) : search.result?.error ? (
          <Alert status={search.result.invalid ? "neutral" : "fail"}>
            <AlertTitle>{search.result.invalid ? "Adjust your search" : "Search couldn't finish"}</AlertTitle>
            <AlertDescription>{search.result.error}</AlertDescription>
            <AlertAction>
              <Button size="sm" variant="secondary" onClick={search.result.invalid ? () => setQuery("") : search.retry}>
                {search.result.invalid ? "Clear search" : "Try again"}
              </Button>
            </AlertAction>
          </Alert>
        ) : shown.length ? (
          <>
            {shownView === "Saved" && !query.trim() && boards.length > 0 && <h2 className="mb-5 type-heading text-text-1">All saved posts</h2>}
            <Grid posts={shown} />
          </>
        ) : (
          <Empty view={shownView} query={query} onClear={() => setQuery("")} onBrowse={() => setView("For you")}
            refinements={search.result?.refinements ?? []} onRefine={setQuery}
            scoped={shownView === "Saved" || (shownView === "Discover" && Boolean(shownCategory))}
            onSearchAll={() => { setView("Discover"); setCategory(null); }} />
        )}
      </main>
    </div>
  );
}

function Empty({ view, query, onClear, onBrowse, refinements, onRefine, scoped, onSearchAll }: {
  view: View; query: string; onClear: () => void; onBrowse: () => void;
  refinements: SearchRefinement[]; onRefine: (query: string) => void; scoped: boolean; onSearchAll: () => void;
}) {
  // Nothing saved at all: the illustration, then how saving works
  // (Glaze's Empty, plain on the page; the drawing stands in for the reason's glyph)
  if (view === "Saved" && !query.trim()) {
    return (
      <EmptyRegion variant="plain" className="py-16">
        <SavedArt />
        <EmptyHeader>
          {/* Plain words since 2026-10-28 (a QA run: "swipe file" and "stops your thumb" lost readers) */}
          <EmptyTitle icon={false}>You haven’t saved anything yet</EmptyTitle>
          <EmptyDescription>When you see a post you like, press Save. It will wait here for your next project.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" onClick={onBrowse}>
            Find posts to save
          </Button>
        </EmptyContent>
      </EmptyRegion>
    );
  }
  // A search that found nothing (simplified at the owner's request, 2026-10-29): the Flip
  // illustration, a short title (the request is already in the search box), one line of help and
  // one way out: the full library from a scoped view, else the first refinement, else Clear search.
  // The search box's own × clears it too
  return (
    <EmptyRegion reason="no-results" variant="plain" className="py-16">
      <SearchEmptyArt />
      <EmptyHeader>
        <EmptyTitle icon={false}>No posts match your search</EmptyTitle>
        <EmptyDescription>{scoped ? "This search only looks in your current view." : "Try fewer details, or describe it another way."}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" variant="secondary" onClick={scoped ? onSearchAll : refinements[0] ? () => onRefine(refinements[0].query) : onClear}>
          {scoped ? "Search full library" : refinements[0]?.label ?? "Clear search"}
        </Button>
      </EmptyContent>
    </EmptyRegion>
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
