// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import Button from "@/components/fundations/elements/Button";

export default function SubmitPage() {
  return (
    <section>
      <Wrapper variant="standard" className="page-start">
        <div className="mx-auto max-w-xl sm:px-8">
          <div className="text-balance">
            <Text tag="h1" variant="h1" className="text-primary-foreground">
              Submit your site to Curatit
            </Text>
            <Text tag="p" variant="body" className="mt-2 text-secondary-foreground text-balance">
              Get your web tool noticed by top develpers and designers and increase their reach!
            </Text>
          </div>
          <Wrapper variant="prose" className="mt-12">
            <h4>Get your website featured</h4>
            <p>
              Submit your website for free and get them noticed by top designers. Every submission is
              carefully reviewed.
            </p>
            <h4>Submission process</h4>
            <p>
              It may take 2 or 3 years or more to publish your tool due to high demand, who knows. For
              $99 bucks, you can skip the wait and receive a review in 7 days, though publication is
              not guaranteed.
            </p>
            <div className="flex items-center not-prose gap-2">
              <Button size="sm" variant="default" className="w-fit" data-modal-open="submit-modal">
                Submit a site
              </Button>
              <Button isLink size="sm" variant="accent" href="/pricing" className="w-fit">
                Skip the waiting line for $299
              </Button>
            </div>
            <h4>If not selected</h4>
            <p>Don’t give up—refine your tool and try again with future projects.</p>
          </Wrapper>
        </div>
      </Wrapper>
    </section>
  );
}
