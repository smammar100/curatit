import type { ReactNode } from "react";
import type { Metadata } from "next";
// Components
import { BoardsProvider } from "@/components/dashboard/boards";
import { PrefsProvider } from "@/components/dashboard/prefs";
import type { Board, DashPost } from "@/components/dashboard/types";
import { board as demoBoard } from "@/components/home/demo";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = { title: "Curatit", robots: { index: false, follow: false } };

// Posts come from Supabase at build time; pick up newly published ones hourly
export const revalidate = 3600;

// The signed-in area. The boards and the grid size live here, so they carry over between the
// feed and a post. Design first: real library posts, and sample boards until sign-in is wired
// to Supabase and the boards load from public.boards.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const all = await getPublishedPosts();

  // Brands interleaved so the feed doesn't open on a run of posts from one brand
  const byBrand = [...Map.groupBy(all, (post) => post.brand.slug).values()];
  const longest = Math.max(0, ...byBrand.map((list) => list.length));
  const posts: DashPost[] = Array.from({ length: longest }, (_, i) => byBrand.flatMap((list) => list[i] ?? []))
    .flat()
    .map((post) => ({
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

  const inCategory = (slug: string, count: number) =>
    all.filter((post) => post.category.slug === slug).slice(0, count).map((post) => ({ post: post.shortCode }));
  const boards: Board[] = [
    { id: "payments", name: demoBoard.name, shared: true, updated: "2 hours ago", items: [...demoBoard.references] },
    { id: "holiday", name: "Q4 holiday campaign", shared: false, updated: "Yesterday", items: inCategory("food-delivery", 6) },
    { id: "drops", name: "Sportswear drops", shared: true, updated: "3 days ago", items: inCategory("sportswear", 4) },
  ];

  return (
    <PrefsProvider>
      <BoardsProvider initial={boards} posts={posts}>
        {children}
      </BoardsProvider>
    </PrefsProvider>
  );
}
