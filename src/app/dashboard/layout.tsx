import type { ReactNode } from "react";
import type { Metadata } from "next";
// Components
import { BoardsProvider } from "@/components/dashboard/boards";
import { PrefsProvider } from "@/components/dashboard/prefs";
import { ProfileProvider } from "@/components/dashboard/profile";
import { UserProvider } from "@/components/dashboard/user";
import { Toaster } from "@/components/glaze/ui/toast";
import type { DashPost } from "@/components/dashboard/types";
import { getBreakdownSummaries } from "@/lib/creative/display";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = { title: "Curatit", robots: { index: false, follow: false } };

// Posts come from Supabase at build time; pick up newly published ones hourly
export const revalidate = 3600;

// The signed-in area. The boards, the profile and the grid size live here, so they carry over
// between the feed and a post. The proxy keeps it for signed-in visitors; UserProvider reads who
// they are, ProfileProvider their onboarding answers and BoardsProvider their boards, all in the
// browser, so the pages stay static.
// `modal` is the @modal slot, where a post opens over the feed; the page under it goes inert
// while it's open (PostView, by this id).
export default async function DashboardLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  const all = await getPublishedPosts();
  // The breakdowns' one-line strategies and labels, for the Playbooks rows. The feed still works
  // without them (the rows fall back to the caption's first line), so a failed read isn't fatal
  const breakdowns = await getBreakdownSummaries(new Map(all.map((post) => [post.id, post.images.length]))).catch((error: unknown) => {
    console.error(error);
    return new Map<string, never>();
  });

  // The feed's own order: what joined the library most recently first (by import day, newest day
  // first), and within each day the brands interleaved, so a new import leads the feed without
  // opening on a run of posts from one brand. `all` is newest-posted first, which each brand keeps
  const days = [...Map.groupBy(all, (post) => post.addedAt.slice(0, 10)).entries()].sort(([a], [b]) => b.localeCompare(a)).map(([, list]) => list);
  const interleave = (list: typeof all) => {
    const byBrand = [...Map.groupBy(list, (post) => post.brand.slug).values()];
    const longest = Math.max(0, ...byBrand.map((brand) => brand.length));
    return Array.from({ length: longest }, (_, i) => byBrand.flatMap((brand) => brand[i] ?? [])).flat();
  };
  const posts: DashPost[] = days
    .flatMap(interleave)
    .map((post) => ({
      id: post.id,
      shortCode: post.shortCode,
      hook: post.hook,
      brand: post.brand,
      category: post.category,
      categories: post.categories,
      format: post.format,
      width: post.width,
      height: post.height,
      postedAt: post.postedAt,
      addedAt: post.addedAt,
      cover: post.images[0],
      breakdown: breakdowns.get(post.id) ?? null,
    }));

  return (
    <UserProvider>
      {/* The app's base type: the scale's body role (13/20, see lib/type-scale.ts), inherited by
          everything here that doesn't set a role of its own. A box-less wrapper, so it reaches the
          modal slot and the toasts without adding layout */}
      <div className="contents text-body">
        <ProfileProvider>
          <PrefsProvider>
            <BoardsProvider posts={posts}>
              <div id="dashboard-page">{children}</div>
              {modal}
            </BoardsProvider>
            {/* Glaze's one Toaster for the whole dashboard: it shows every toast() the boards call
                to confirm a save or report a failure */}
            <Toaster />
          </PrefsProvider>
        </ProfileProvider>
      </div>
    </UserProvider>
  );
}
