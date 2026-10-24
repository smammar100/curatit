// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";

export default function Hero() {
  return (
    <section>
      <Wrapper variant="standard" className="page-start">
        <div className="text-balance max-w-3xl mx-auto text-center">
          <Text tag="h1" variant="h1" className="text-text-1">
            <span className="block"> No concepts.</span>
            <span className="block">Just real websites.</span>
          </Text>
          <Text tag="p" variant="body" className="text-text-2 mt-4">
            A curated collection of production websites worth studying: layout, hierarchy,
            interaction, and execution. Use them to benchmark your own work, not to copy it.
          </Text>
        </div>
      </Wrapper>
    </section>
  );
}
