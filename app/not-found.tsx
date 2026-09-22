import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";

export default function NotFound() {
  return (
    <section>
      <Wrapper
        variant="standard"
        className="py-24 flex flex-col h-full lg:h-dvh items-center justify-center"
      >
        <div className="max-w-xl mx-auto text-balance">
          <div className="text-center">
            <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-light">
              Error 404
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4">
              Sorry, the page you are looking for does not exist. It might have been removed,
              renamed, or is temporarily unavailable.
            </Text>
          </div>
          <Button
            isLink
            size="base"
            variant="default"
            title="Go back home"
            href="/"
            className="mt-12 w-fit mx-auto"
          >
            Go back home
          </Button>
        </div>
      </Wrapper>
    </section>
  );
}
