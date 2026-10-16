import { cache } from "react";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { getPublishedPosts } from "@/lib/posts";
import NotFoundCollage from "./NotFoundCollageLazy";

// Every cover, brands interleaved so neighbouring covers rarely come from the same feed. Once per
// request: a site page's data carries both not-founds (the root's and the group's), and with one
// shared list React writes it once and points the second at it
const getCovers = cache(async () => {
  const posts = await getPublishedPosts().catch(() => []);
  const byBrand = [...Map.groupBy(posts, (post) => post.brand.slug).values()];
  const longest = Math.max(0, ...byBrand.map((list) => list.length));
  return Array.from({ length: longest }, (_, i) => byBrand.flatMap((list) => (list[i]?.images[0] ? [list[i].images[0]] : []))).flat();
});

// The 404 page's content: the title and its line, a "404" built from the library's own covers
// (NotFoundCollage), and the way out, together in one screen. If the library can't be reached
// the digits still stand, in plain tiles. The root not-found puts it inside the site's navigation
// and footer; the (site) group's not-found renders it bare, inside the group's own.
export default async function NotFoundContent() {
  const covers = await getCovers();

  return (
    <section>
      <Wrapper variant="standard" className="flex min-h-dvh flex-col items-center justify-center pt-24 pb-12 text-center">
        <div className="text-balance">
          <Text tag="h1" variant="displayLG" className="text-base-900">
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
  );
}
