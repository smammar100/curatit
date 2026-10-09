// Fundations
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
import ButtonShowcase from "@/components/system/ButtonShowcase";

export default function ButtonsPage() {
  return (
    <section>
      <Wrapper variant="standard" className="py-24 lg:pt-48">
        <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-thin">
          Buttons
        </Text>
        <ButtonShowcase labelClassName="font-medium uppercase ext-base-600" />
      </Wrapper>
    </section>
  );
}
