// Fundation
import BaseLayout from "@/layouts/BaseLayout";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import NotFoundCollage from "@/components/global/NotFoundCollage";
import { getPublishedPosts } from "@/lib/posts";

// Any address that isn't a page: the title and its line, a "404" built from the library's own
// covers (NotFoundCollage), and the way out, together in one screen. If the library can't be
// reached the digits still stand, in plain tiles.
export default async function NotFound() {
  const posts = await getPublishedPosts().catch(() => []);
  // Brands interleaved, so neighbouring covers rarely come from the same feed
  const byBrand = [...Map.groupBy(posts, (post) => post.brand.slug).values()];
  const longest = Math.max(0, ...byBrand.map((list) => list.length));
  const covers = Array.from({ length: longest }, (_, i) => byBrand.flatMap((list) => (list[i]?.images[0] ? [list[i].images[0]] : []))).flat();

  return (
    <BaseLayout>
      <section>
        <Wrapper variant="standard" className="flex min-h-dvh flex-col items-center justify-center pt-24 pb-12 text-center">
          <div className="text-balance">
            <Text tag="h1" variant="displayLG" className="font-display font-light text-base-900">
              <span className="sr-only">404: </span>
              This page is gone.
            </Text>
            <Text tag="p" variant="textBase" className="mt-2 text-base-600">
              Every tile is a real post. <span className="pointer-coarse:hidden">Hover</span>
              <span className="hidden pointer-coarse:inline">Tap</span> to shuffle.
            </Text>
          </div>
          {/* As wide as fits the screen's height with the text and buttons, at most 48rem */}
          <NotFoundCollage covers={covers} className="mt-8 w-full max-w-[min(48rem,calc((100dvh-22rem)*2.08))] sm:mt-10" />
          <div className="mt-8 flex flex-wrap justify-center gap-2 sm:mt-10">
            <Button isLink size="base" variant="default" href="/">
              Go home
            </Button>
            <Button isLink size="base" variant="muted" href="/library">
              Browse the library
            </Button>
          </div>
        </Wrapper>
      </section>
    </BaseLayout>
  );
}
