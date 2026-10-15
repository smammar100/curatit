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
    <section>
      <ImageStreamHero
        images={images}
        axis={74}
        className="h-svh min-h-[44rem] w-full bg-white"
      >
        <Wrapper
          variant="standard"
          className="relative z-10 flex h-full flex-col items-center pt-28 pb-20 text-center lg:pt-40"
        >
          {/* The whole message in one block (2026-10-15, from the copy audit): who it's for, what it
              is and the two actions together, so nothing has to be scrolled past to understand it */}
          <div className="text-balance max-w-3xl">
            <Text
              tag="p"
              variant="textSM"
              className="font-medium text-base-500"
            >
              For designers, strategists and social media teams
            </Text>
            <Text
              tag="h1"
              variant="displayLG"
              className="font-display font-light text-base-900 mt-4"
            >
              Find ideas for your next social media post.
            </Text>
            <Text
              tag="p"
              variant="textBase"
              className="text-base-600 mt-6 max-w-xl mx-auto"
            >
              Curatit is a searchable library of real brand posts, reviewed by
              editors. Explore breakdowns of their copy and design, save useful
              examples to boards, and share them with your team or clients.
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
      </ImageStreamHero>
    </section>
  );
}
