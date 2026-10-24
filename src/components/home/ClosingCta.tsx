import Image from "next/image";
import Link from "next/link";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Glaze
import { Button } from "@/components/glaze/ui/button";
// Components
import type { LibraryPost } from "@/lib/posts";
import { LogoReel } from "./islands";

// One app-icon tile per brand in the library: its logo. Brands without one fall back to
// the cover of their newest post (posts come newest first).
// Since 2026-10-24 the two actions are Glaze's Buttons rendered as links: the ink primary and a
// flat secondary.
export default function ClosingCta({ posts }: { posts: LibraryPost[] }) {
  const seen = new Set<string>();
  const newestPerBrand = posts.filter((post) => !seen.has(post.brand.slug) && seen.add(post.brand.slug));
  const tiles = newestPerBrand.map((post) => (
    <Image key={post.brand.slug} src={post.brand.logo ?? post.images[0]} alt="" fill sizes="96px" className="object-cover" />
  ));
  const left = tiles.filter((_, i) => i % 2 === 0);
  const right = tiles.filter((_, i) => i % 2 === 1);

  return (
    <section className="overflow-hidden bg-page">
      <Wrapper variant="standard" className="section-y">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:justify-center lg:gap-16 xl:gap-24">
          <LogoReel items={left} orientation="horizontal" near="end" className="lg:hidden" />
          <LogoReel items={left} orientation="vertical" near="end" className="hidden lg:block" />
          <div className="max-w-2xl text-center text-balance">
            <Text tag="h2" variant="h1">
              <span className="block text-text-2">Find references</span>
              <span className="block text-text-1">for your next social post.</span>
            </Text>
            <Text tag="p" variant="body" className="mx-auto mt-4 max-w-xl text-text-2">
              Search real brand posts, save useful examples, and share your
              shortlist.
            </Text>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Button render={<Link href="/signup" />} nativeButton={false}>
                Create account
              </Button>
              <Button variant="secondary" render={<Link href="/pricing" />} nativeButton={false}>
                View pricing
              </Button>
            </div>
            <Text tag="p" variant="captionLG" className="mt-10 text-text-2">
              Examples from brands in the library
            </Text>
          </div>
          <LogoReel items={right} orientation="vertical" near="start" phase={900} className="hidden lg:block" />
          <LogoReel items={right} orientation="horizontal" near="start" phase={900} className="lg:hidden" />
        </div>
      </Wrapper>
    </section>
  );
}
