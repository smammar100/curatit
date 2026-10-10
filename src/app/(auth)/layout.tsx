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
export default async function AuthLayout({ children }: { children: ReactNode }) {
  // One cover per post, brands interleaved so neighbouring tiles rarely share one
  const byBrand = [...Map.groupBy(await getPublishedPosts(), (post) => post.brand.slug).values()];
  const longest = Math.max(0, ...byBrand.map((list) => list.length));
  const covers = Array.from({ length: longest }, (_, i) => byBrand.flatMap((list) => list[i]?.images[0] ?? [])).flat();

  return (
    <BaseLayout hideNavigation hideFooter>
      <div className="relative min-h-dvh overflow-clip bg-white">
        <PostWall covers={covers} />
        <div className="relative flex min-h-dvh items-center justify-center px-6 py-8">
          {/* The one shadowed card on the site: it floats over imagery, and a ring would read
              as a stroke against the covers. A shadow cannot be seen in dark mode, so there a
              hairline ring takes over */}
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.25)] sm:p-8 dark:ring-1 dark:ring-edge">
            <Link href="/" className="mx-auto mb-6 block w-fit" aria-label="Go to homepage">
              <Lockup />
            </Link>
            {children}
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
