// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import StoreCard from "@/components/store/StoreCard";
// Store
import { getCollection } from "@/lib/content";

export default function StorePreview() {
  const allProducts = getCollection("store");
  return (
    <section>
      <Wrapper variant="standard" className="py-24">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <Text tag="h2" variant="displaySM" className="text-base-900 font-display font-thin">
            Our latest templates
          </Text>
          <Button isLink size="sm" variant="muted" href="/store">
            See them all!
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {allProducts.slice(0, 3).map((post) => (
            <StoreCard key={post.id} post={post} />
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
