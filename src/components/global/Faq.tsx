import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { Collapsible, CollapsibleContent, CollapsibleGroup, CollapsibleTrigger } from "@/components/glaze/ui/collapsible";

// The questions as Glaze's CollapsibleGroup (2026-10-24, in place of native <details>): one framed
// paper box of rows split by hairlines, each question a row whose caret turns a quarter as its
// answer opens. Several can be open at once, as with the native disclosures, and a closed answer
// stays in the page as hidden="until-found", so find-in-page still reaches it and opens it. The
// answer cuts open and fades in over Glaze's state duration; nothing moves under reduced motion.
export default function Faq({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <section>
      <Wrapper variant="standard" className="section-y">
        <div className="text-center">
          <Text tag="h2" variant="h1" className="text-text-1">
            Frequently asked questions
          </Text>
        </div>
        <div className="mx-auto mt-12 max-w-xl sm:px-8">
          <CollapsibleGroup multiple>
            {faqs.map((faq) => (
              <Collapsible key={faq.question} value={faq.question}>
                <CollapsibleTrigger className="type-label-lg">{faq.question}</CollapsibleTrigger>
                <CollapsibleContent className="type-body">{faq.answer}</CollapsibleContent>
              </Collapsible>
            ))}
          </CollapsibleGroup>
        </div>
      </Wrapper>
    </section>
  );
}
