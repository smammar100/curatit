import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
import Plus from "@/components/fundations/icons/Plus";
import { fontWeights } from "@/lib/font-weight";

// Questions as native disclosures. As one opens the plus turns to a cross and the answer drops
// into place (closing is instant); neither moves under reduced motion. Since 2026-10-23 the rows
// are on the system's tokens: the question in the ink at the library's semibold, the answer in
// the muted ink, the site's one focus ring on the summary. The <details> stays native: there is
// no disclosure molecule, and the browser's own open/close is the behaviour wanted.
export default function Faq({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <section>
      <Wrapper variant="standard" className="section-y">
        <div className="text-center">
          <Text tag="h2" variant="h1" className="text-foreground">
            Frequently asked questions
          </Text>
        </div>
        <div className="mx-auto mt-12 max-w-xl sm:px-8">
          <div>
            {faqs.map((faq) => (
              <details key={faq.question} className="group">
                <summary
                  className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-[4px] py-4 text-left text-body-base text-foreground select-none transition-colors duration-80 hover:text-muted-foreground focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)] sm:px-8 [&::-webkit-details-marker]:hidden"
                  style={{ fontVariationSettings: fontWeights.semibold }}
                >
                  {faq.question}
                  <Plus className="size-4 shrink-0 transition-[rotate] duration-200 ease-out-quint group-open:-rotate-45 motion-reduce:transition-none" />
                </summary>
                {/* motion-safe rather than motion-reduce:animate-none, which group-open's
                    selector would outrank */}
                <div className="py-4 sm:px-8 motion-safe:group-open:animate-rise-in">
                  <Text tag="p" variant="bodySM" className="text-muted-foreground">
                    {faq.answer}
                  </Text>
                </div>
              </details>
            ))}
          </div>
        </div>
      </Wrapper>
    </section>
  );
}
