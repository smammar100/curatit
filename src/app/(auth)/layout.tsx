import type { ReactNode } from "react";
import Link from "next/link";
import BaseLayout from "@/layouts/BaseLayout";
// Assets
import Lockup from "@/components/assets/Lockup";
// Components
import PostWall from "@/components/auth/PostWall";
import { getPublishedPosts } from "@/lib/posts";

// The wall shows the library's covers, read at build time; pick up new posts hourly
export const revalidate = 3600;

// Sign in / sign up: no navigation or footer. One card, centred over a drifting wall of the
// library's posts (after Pinterest's login; chosen from a three-way prototype on 2026-10-10).
// The card is compact on purpose: with its form it has to fit a 720px-tall viewport.
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  // One cover per post, brands interleaved so neighbouring tiles rarely share one
  const byBrand = [
    ...Map.groupBy(
      await getPublishedPosts(),
      (post) => post.brand.slug,
    ).values(),
  ];
  const longest = Math.max(0, ...byBrand.map((list) => list.length));
  const covers = Array.from({ length: longest }, (_, i) =>
    byBrand.flatMap((list) => list[i]?.images[0] ?? []),
  ).flat();

  return (
    <BaseLayout hideNavigation hideFooter>
      <div className="relative min-h-dvh overflow-clip bg-page">
        <PostWall covers={covers} />
        <div className="relative flex min-h-dvh items-center justify-center px-4 py-8">
          {/* The card floats over imagery on Interfere's extra large shadow, which has its own dark
              treatment (a half-pixel inner highlight), so it needs no ring there */}
          <div className="w-full max-w-md rounded-[24px] bg-surface-3 p-6 shadow-surface-6 sm:p-8">
            <Link
              href="/"
              className="mx-auto mb-6 block w-fit rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-border-focus"
              aria-label="Go to homepage"
            >
              <Lockup />
            </Link>
            {children}
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
