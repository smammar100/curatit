// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import StoreCard from "@/components/store/StoreCard";
// Content
import { getCollection } from "@/lib/content";

export default function StorePage() {
  const allProducts = getCollection("store");
  return (
    <section>
      <Wrapper variant="standard" className="page-start">
        <div className="text-balance max-w-xl text-center mx-auto">
          <Text tag="h1" variant="h1" className="text-text-1">
            Our products
          </Text>
          <Text tag="p" variant="body" className="text-text-2 mt-4">
            Shop my selection of digital products to help you grow your business, and to make your
            life easier and more productive
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {allProducts.map((post) => (
            <StoreCard key={post.id} post={post} />
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
