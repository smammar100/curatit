import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
import Plus from "@/components/fundations/icons/Plus";

// Questions as native disclosures. As one opens the plus turns to a cross and the answer drops
// into place (closing is instant); neither moves under reduced motion
export default function Faq({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <section>
      <Wrapper variant="standard" className="section-y">
        <div className="text-center">
          <Text tag="h2" variant="displayLG" className="text-base-900">
            Frequently asked questions
          </Text>
        </div>
        <div className="mx-auto mt-12 max-w-xl sm:px-8">
          <div>
            {faqs.map((faq) => (
              <details key={faq.question} className="group">
                <summary className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-sm py-4 text-left text-body-base font-medium text-primary-foreground select-none transition-colors duration-150 hover:text-brand-foreground focus-visible:text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus sm:px-8 [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <Plus className="size-4 shrink-0 transition-[rotate] duration-200 ease-out-quint group-open:-rotate-45 motion-reduce:transition-none" />
                </summary>
                {/* motion-safe rather than motion-reduce:animate-none, which group-open's
                    selector would outrank */}
                <div className="py-4 sm:px-8 motion-safe:group-open:animate-[rise-in_200ms_var(--ease-out-quint)]">
                  <Text tag="p" variant="textSM" className="text-base-600">
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
