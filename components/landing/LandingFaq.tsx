import { Plus } from "@/components/fundations/icons";
import { faqs } from "@/components/global/Faq";

/** Split FAQ: serif heading on the left, native accordion on the right. */
export default function LandingFaq() {
  return (
    <section className="px-8 py-24 md:px-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <h2 className="max-w-xs font-display text-3xl font-light leading-tight text-ink">Questions that tend to crop up.</h2>

        <div className="divide-y divide-line border-y border-line">
          {faqs.map((faq) => (
            <details key={faq.question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-base text-ink select-none transition-colors duration-150 ease-out hover:text-brand [&::-webkit-details-marker]:hidden">
                {faq.question}
                <Plus className="size-4 shrink-0 text-ink-subtle transition-transform duration-200 ease-out group-open:rotate-45" />
              </summary>
              <p className="max-w-[65ch] pb-6 text-sm text-ink-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
