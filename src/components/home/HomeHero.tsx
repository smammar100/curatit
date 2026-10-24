import Link from "next/link";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Glaze
import { Button } from "@/components/glaze/ui/button";
// Components
import { optimizedImage, type LibraryPost } from "@/lib/posts";
import Corridor from "./Corridor";
import { heroPosts } from "./demo";

// Covers of real library posts, one brand each. The corridor shows the first nine
// (its default card count), and it is decorative, so the images carry no alt text.
//
// The cards are in motion and never larger than a third of the hero's width, so they get
// a lower quality than the library's stills and only the widths that fit: on a phone that
// is the 256px file, which keeps the hero's images out of the way of the first paint.
const HERO_QUALITY = 60;

// Since 2026-10-24 on Glaze: the two actions are Glaze's Buttons rendered as links, the page's one
// main action as the large ink primary beside a flat secondary. The navigation already loads the
// Button, so the hero adds no code of its own; it stays a server component.
export default function HomeHero({ posts }: { posts: LibraryPost[] }) {
  const images = heroPosts
    .flatMap((shortCode) => posts.find((post) => post.shortCode === shortCode) ?? [])
    .map((post) => ({
      src: optimizedImage(post.images[0], 640, HERO_QUALITY),
      srcSet: [256, 384, 640]
        .map((width) => `${optimizedImage(post.images[0], width, HERO_QUALITY)} ${width}w`)
        .join(", "),
      sizes: "33vw",
    }));

  return (
    // The headline, the corridor in its own band, then the subtext and actions. The band has the
    // same margin above and below and the corridor's axis at its middle, so the gaps either side
    // of it match at every width. Its cards overflow the band (overflow-visible) and the section
    // clips them sideways; on phones the band is sized to the corridor (which scales with width),
    // from sm up it takes the hero's spare height.
    <section className="flex flex-col overflow-x-clip bg-page sm:h-svh sm:min-h-160">
      <Wrapper variant="standard" className="relative z-(--z-raised) pt-28 text-center lg:pt-40">
        <div className="mx-auto max-w-3xl text-balance">
          <Text tag="h1" variant="h1" className="text-text-1">
            Find ideas for your next social media post.
          </Text>
        </div>
      </Wrapper>
      <Corridor
        images={images}
        axis={50}
        className="my-8 h-[36vw] w-full overflow-visible sm:h-auto sm:min-h-48 sm:flex-1 lg:my-10"
      />
      <Wrapper variant="standard" className="relative z-(--z-raised) pb-20 text-center">
        <div className="mx-auto max-w-xl text-balance">
          <Text tag="p" variant="body" className="text-text-2">
            A searchable library of real brand posts, reviewed by editors. See
            how each one is built, then save and share the best.
          </Text>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Button size="lg" render={<Link href="/signup" />} nativeButton={false}>
              Create account
            </Button>
            <Button size="lg" variant="secondary" render={<Link href="#how-it-works" />} nativeButton={false}>
              See how it works
            </Button>
          </div>
        </div>
      </Wrapper>
    </section>
  );
}
