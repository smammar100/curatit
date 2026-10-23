// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import { ImageStreamHero } from "@/components/ui/image-stream-hero";
import { optimizedImage, type LibraryPost } from "@/lib/posts";
import { heroPosts } from "./demo";

// Covers of real library posts, one brand each. The corridor shows the first nine
// (its default card count), and it is decorative, so the images carry no alt text.
//
// The cards are in motion and never larger than a third of the hero's width, so they get
// a lower quality than the library's stills and only the widths that fit: on a phone that
// is the 256px file, which keeps the hero's images out of the way of the first paint.
const HERO_QUALITY = 60;

export default function HomeHero({ posts }: { posts: LibraryPost[] }) {
  const images = heroPosts
    .flatMap(
      (shortCode) => posts.find((post) => post.shortCode === shortCode) ?? [],
    )
    .map((post) => ({
      src: optimizedImage(post.images[0], 640, HERO_QUALITY),
      srcSet: [256, 384, 640]
        .map(
          (width) =>
            `${optimizedImage(post.images[0], width, HERO_QUALITY)} ${width}w`,
        )
        .join(", "),
      sizes: "33vw",
    }));

  return (
    // The headline, the corridor in its own band, then the subtext and actions. The band has the
    // same margin above and below and the corridor's axis at its middle, so the gaps either side
    // of it match at every width. Its cards overflow the band (overflow-visible) and the section
    // clips them sideways; on phones the band is sized to the corridor (which scales with width),
    // from sm up it takes the hero's spare height.
    <section className="flex flex-col overflow-x-clip bg-background sm:h-svh sm:min-h-[40rem]">
      <Wrapper
        variant="standard"
        className="relative z-10 pt-28 text-center lg:pt-40"
      >
        <div className="text-balance max-w-3xl mx-auto">
          <Text tag="h1" variant="h1" className="text-foreground">
            Find ideas for your next social media post.
          </Text>
        </div>
      </Wrapper>
      <ImageStreamHero
        images={images}
        axis={50}
        className="my-8 h-[36vw] w-full overflow-visible sm:h-auto sm:min-h-48 sm:flex-1 lg:my-10"
      />
      <Wrapper variant="standard" className="relative z-10 pb-20 text-center">
        <div className="text-balance max-w-xl mx-auto">
          <Text tag="p" variant="body" className="text-muted-foreground">
            A searchable library of real brand posts, reviewed by editors. See
            how each one is built, then save and share the best.
          </Text>
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            <Button isLink size="base" variant="default" href="/signup">
              Create account
            </Button>
            <Button isLink size="base" variant="muted" href="#how-it-works">
              See how it works
            </Button>
          </div>
        </div>
      </Wrapper>
    </section>
  );
}
