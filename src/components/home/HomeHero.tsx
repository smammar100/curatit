// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import { ImageStreamHero } from "@/components/ui/image-stream-hero";

// Unsplash photos, one or two per library category. The corridor shows the first
// nine (its default card count), and it is decorative, so the images carry no alt text.
const unsplash = (id: string) => ({
  src: `https://images.unsplash.com/photo-${id}?w=640&q=75&auto=format&fit=crop`,
});

const images = [
  unsplash("1542291026-7eec264c27ff"), // Sports
  unsplash("1495474472287-4d71bcdd2085"), // Food & Drink
  unsplash("1436491865332-7a61a109cc05"), // Travel
  unsplash("1515886657613-9f3515b0c78f"), // Shopping
  unsplash("1556742049-0cfed4f6a45d"), // Finance
  unsplash("1489599849927-2ee91cede3ba"), // Entertainment
  unsplash("1546069901-ba9599a7e63c"), // Food & Drink
  unsplash("1517649763962-0c623066013b"), // Sports
  unsplash("1505740420928-5e560c06d30e"), // Shopping
];

export default function HomeHero() {
  return (
    <section>
      <ImageStreamHero images={images} className="h-svh min-h-[40rem] w-full bg-white">
        <Wrapper
          variant="standard"
          className="relative z-10 flex h-full flex-col items-center justify-between pt-28 pb-12 text-center lg:pt-32 lg:pb-16"
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
