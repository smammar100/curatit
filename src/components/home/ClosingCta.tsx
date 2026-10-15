// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import Image from "next/image";
import type { LibraryPost } from "@/lib/posts";
import { LogoReel } from "./islands";

// One app-icon tile per brand in the library: its logo. Brands without one fall back to
// the cover of their newest post (posts come newest first).
export default function ClosingCta({ posts }: { posts: LibraryPost[] }) {
  const seen = new Set<string>();
  const newestPerBrand = posts.filter(
    (post) => !seen.has(post.brand.slug) && seen.add(post.brand.slug),
  );
  const tiles = newestPerBrand.map((post) => (
    <Image
      key={post.brand.slug}
      src={post.brand.logo ?? post.images[0]}
      alt=""
      fill
      sizes="96px"
      className="object-cover"
    />
  ));
  const left = tiles.filter((_, i) => i % 2 === 0);
  const right = tiles.filter((_, i) => i % 2 === 1);

  return (
    <section className="overflow-hidden bg-white">
      <Wrapper variant="standard" className="section-y">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:justify-center lg:gap-16 xl:gap-24">
          <LogoReel
            items={left}
            orientation="horizontal"
            near="end"
            className="lg:hidden"
          />
          <LogoReel
            items={left}
            orientation="vertical"
            near="end"
            className="hidden lg:block"
          />
          <div className="text-balance max-w-2xl text-center">
            <Text
              tag="h2"
              variant="displayLG"
              className=""
            >
              <span className="block text-base-500">Find references</span>
              <span className="block text-base-900">
                for your next social post.
              </span>
            </Text>
            <Text
              tag="p"
              variant="textBase"
              className="text-base-600 mt-4 max-w-xl mx-auto"
            >
              Search real brand posts, save useful examples, and share your
              shortlist.
            </Text>
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              <Button isLink size="base" variant="default" href="/signup">
                Create account
              </Button>
              <Button isLink size="base" variant="muted" href="/pricing">
                View pricing
              </Button>
            </div>
            <Text tag="p" variant="textXS" className="mt-10 text-base-500">
              Examples from brands in the library
            </Text>
          </div>
          <LogoReel
            items={right}
            orientation="vertical"
            near="start"
            phase={900}
            className="hidden lg:block"
          />
          <LogoReel
            items={right}
            orientation="horizontal"
            near="start"
            phase={900}
            className="lg:hidden"
          />
        </div>
      </Wrapper>
    </section>
  );
}
