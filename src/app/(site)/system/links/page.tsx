// Fundations
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
import ButtonShowcase from "@/components/system/ButtonShowcase";

export default function LinksPage() {
  return (
    <section>
      <Wrapper variant="standard" className="page-start">
        <Text tag="h1" variant="displayLG" className="font-display font-light text-base-900">
          Links
        </Text>
        <ButtonShowcase asLinks labelClassName="font-medium uppercase text-base-600" />
      </Wrapper>
    </section>
  );
}
