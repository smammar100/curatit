"use client";

// The dashboard: the library as a feed, after Cosmos's signed-in home (chosen from a three-way
// prototype on 2026-10-10). The header's tabs pick the view, its search filters the posts, and
// the grid shows them. For you is the library ranked on the person's onboarding answers
// (forYou.ts), under the Playbooks (2026-10-20) until something is typed; someone whose
// profile has none yet is sent to /dashboard/welcome first. Discover
// adds a row of categories to browse the library by. ?view=
// discover|saved, ?category= (on Discover) and ?q= open the feed on a view, category or
// search, which is how other dashboard pages send you back here.
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { inCategory, OLD_SLUGS } from "@/lib/categories";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/fundations/elements/Button";
import EmptyState from "@/components/fundations/molecules/EmptyState";
import BoardList from "./BoardList";
import { useBoards } from "./boards";
import CategoryBar from "./CategoryBar";
import { rank, spread } from "./forYou";
import { useProfile } from "./profile";
import SavedArt from "./SavedArt";
import Grid from "./Grid";
import Playbooks from "./Playbooks";
import Header, { VIEWS, type View } from "./Header";
import { GridSkeleton } from "./Skeleton";
import { brandNamed, categoryNamed, hookNamed, typeNamed } from "./search";
import { useLibrarySearch } from "./useLibrarySearch";
import Notice from "@/components/fundations/molecules/Notice";
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
  const search = useLibrarySearch(query, list);

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
    return view === "For you" && !query.trim() ? spread(rank(filtered, profile, list, { fresh: true }), 6) : filtered;
  }, [list, saved, query, view, category, profile, search.order]);
  // For you waits for the answers it ranks on, so it never shows one order and then another, and
  // keeps waiting while a first visit is on its way to the welcome flow
  const rows = view === "For you" && !query.trim();
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
        {view === "Saved" && !query.trim() && status !== "loading" && <BoardList />}
        {/* For you with nothing typed opens on the playbooks, the wall of posts under them */}
        {rows && (
          <Playbooks
            posts={list}
            onPick={(next) => {
              setQuery(next);
              scrollTo({ top: 0 });
            }}
          />
        )}
        {search.result && !search.result.error && <p role="status" className="mb-5 text-body text-secondary-foreground">
          {shown.length} {shown.length === 1 ? "post" : "posts"}{search.result.labels.length ? ` · ${search.result.labels.join(" · ")}` : ""}
          {search.result.capped ? " · First 500 matches. Narrow your search to see more." : ""}
        </p>}
        {search.result?.corrections?.length ? (
          <Notice className="mb-5" live>
            {search.result.corrections.map((item) => `Read “${item.from}” as “${item.to}”.`).join(" ")} Put a phrase in quotes to search its exact wording.
          </Notice>
        ) : null}
        {waiting || search.loading ? (
          <GridSkeleton label={search.loading ? "Searching the library" : view === "Saved" ? "Loading your saved posts" : "Loading your feed"} />
        ) : search.result?.error ? (
          <Notice live tone={search.result.invalid ? "neutral" : "danger"} title={search.result.invalid ? "Adjust your search" : "Search couldn't finish"} action={<Button size="xs" variant="secondary" onClick={search.result.invalid ? () => setQuery("") : search.retry}>{search.result.invalid ? "Clear search" : "Try again"}</Button>}>
            {search.result.error}
          </Notice>
        ) : shown.length ? (
          <>
            {view === "Saved" && !query.trim() && boards.length > 0 && <h2 className="mb-5 text-title font-medium text-primary-foreground">All saved posts</h2>}
            {rows && <h2 className="mb-5 text-title font-medium text-primary-foreground">Picked for you</h2>}
            <Grid posts={shown} />
          </>
        ) : (
          <Empty view={view} query={query} onClear={() => setQuery("")} onBrowse={() => setView("For you")}
            refinements={search.result?.refinements ?? []} onRefine={setQuery}
            scoped={view === "Saved" || (view === "Discover" && Boolean(category))}
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
  if (view === "Saved" && !query.trim()) {
    return (
      <EmptyState
        illustration={<SavedArt />}
        title="Your swipe file is empty"
        description="See a carousel that stops your thumb, or a launch you wish you’d made? Hit Save. It waits here for your next brief."
        action={
          <Button size="sm" variant="default" onClick={onBrowse}>
            Start your swipe file
          </Button>
        }
      />
    );
  }
  // A search that found nothing
  return (
    <EmptyState
      title={`Nothing matches ‘${query}’`}
      description={scoped ? "This search is limited to your current view. Try the full library." : "Try removing one detail, or describe the posts another way."}
      action={
        <Button size="sm" variant="default" onClick={scoped ? onSearchAll : refinements[0] ? () => onRefine(refinements[0].query) : onClear}>
          {scoped ? "Search full library" : refinements[0]?.label ?? "Clear search"}
        </Button>
      }
      secondaryAction={
        <div className="flex flex-wrap justify-center gap-2">
          {!scoped && refinements.slice(1).map((item) => <Button key={item.query} size="sm" variant="transparent" onClick={() => onRefine(item.query)}>{item.label}</Button>)}
          {(scoped || refinements.length > 0) && <Button size="sm" variant="transparent" onClick={onClear}>Clear search</Button>}
        </div>
      }
    />
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
