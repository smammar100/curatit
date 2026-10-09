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
export default function HomeHero({ posts }: { posts: LibraryPost[] }) {
  const images = heroPosts
    .flatMap((shortCode) => posts.find((post) => post.shortCode === shortCode) ?? [])
    .map((post) => ({ src: optimizedImage(post.images[0]) }));

  return (
    <section>
      <ImageStreamHero images={images} className="h-svh min-h-[40rem] w-full bg-white">
        <Wrapper
          variant="standard"
          className="relative z-10 flex h-full flex-col items-center justify-between pt-28 pb-20 text-center lg:pt-32"
        >
          <div className="text-balance max-w-3xl">
            <Text tag="h1" variant="displayXL" className="text-base-900 font-display font-light">
              <span className="block">Find the brand posts</span>
              <span className="block">worth studying.</span>
            </Text>
          </div>
          <div className="text-balance max-w-xl">
            <Text tag="p" variant="textBase" className="text-base-600">
              Real organic brand posts, reviewed by editors. Search by brief, save the best references
              to private boards, and share them with your client.
            </Text>
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              <Button isLink size="base" variant="default" href="/signup">
                Get access
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
