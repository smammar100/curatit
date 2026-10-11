import type { ReactNode } from "react";
import type { Metadata } from "next";
// Components
import { BoardsProvider } from "@/components/dashboard/boards";
import { PrefsProvider } from "@/components/dashboard/prefs";
import { ProfileProvider } from "@/components/dashboard/profile";
import { UserProvider } from "@/components/dashboard/user";
import type { DashPost } from "@/components/dashboard/types";
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

  // Brands interleaved so the feed doesn't open on a run of posts from one brand
  const byBrand = [...Map.groupBy(all, (post) => post.brand.slug).values()];
  const longest = Math.max(0, ...byBrand.map((list) => list.length));
  const posts: DashPost[] = Array.from({ length: longest }, (_, i) => byBrand.flatMap((list) => list[i] ?? []))
    .flat()
    .map((post) => ({
      id: post.id,
      shortCode: post.shortCode,
      hook: post.hook,
      brand: post.brand,
      category: post.category,
      format: post.format,
      width: post.width,
      height: post.height,
      postedAt: post.postedAt,
      cover: post.images[0],
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
          </PrefsProvider>
        </ProfileProvider>
      </div>
    </UserProvider>
  );
}
