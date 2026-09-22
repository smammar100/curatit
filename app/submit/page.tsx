import type { Metadata } from "next";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";

export const metadata: Metadata = {
  title: "Submit",
  description: "Submit your site to Curatit and get it noticed by designers and developers.",
};

export default function SubmitPage() {
  return (
    <section>
      <Wrapper variant="standard" className="py-24 lg:pt-48">
        <Wrapper variant="narrow">
          <div className="text-balance">
            <Text tag="h1" variant="displayMD" className="text-base-900 font-display font-thin">
              Submit your site to Curatit
            </Text>
            <Text tag="p" variant="textBase" className="mt-2 text-base-600 text-balance">
              Get your web tool noticed by top developers and designers and increase their reach!
            </Text>
          </div>
          <Wrapper variant="prose" className="mt-12">
            <h4>Get your website featured</h4>
            <p>
              Submit your website for free and get them noticed by top designers. Every submission
              is carefully reviewed.
            </p>
            <h4>Submission process</h4>
            <p>
              It may take 2 or 3 years or more to publish your tool due to high demand, who knows.
              For $99 bucks, you can skip the wait and receive a review in 7 days, though
              publication is not guaranteed.
            </p>
            <div className="flex items-center not-prose gap-2">
              <Button size="sm" variant="default" className="w-fit">
                Submit a site
              </Button>
              <Button isLink size="sm" variant="accent" href="/pricing" className="w-fit">
                Skip the waiting line for $299
              </Button>
            </div>
            <h4>If not selected</h4>
            <p>Don’t give up—refine your tool and try again with future projects.</p>
          </Wrapper>
        </Wrapper>
      </Wrapper>
    </section>
  );
}
