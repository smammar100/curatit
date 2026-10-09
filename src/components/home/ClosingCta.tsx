// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";

export default function ClosingCta() {
  return (
    <section>
      <Wrapper variant="standard" className="py-24">
        <div className="text-balance max-w-3xl mx-auto text-center">
          <Text tag="h2" variant="displayLG" className="text-base-900 font-display font-light">
            Start with your next brief.
          </Text>
          <Text tag="p" variant="textBase" className="text-base-600 mt-4 max-w-xl mx-auto">
            Search the library, save what&apos;s worth adapting, and send your client a board they can
            open in one click.
          </Text>
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            <Button isLink size="base" variant="default" href="/signup">
              Get access
            </Button>
            <Button isLink size="base" variant="muted" href="/pricing">
              See pricing
            </Button>
          </div>
        </div>
      </Wrapper>
    </section>
  );
}
