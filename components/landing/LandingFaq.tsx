"use client";

import { AccordionGroup, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { faqs } from "@/components/global/Faq";

/** Split FAQ: serif heading on the left, one fluid-hover accordion on the right. */
export default function LandingFaq() {
  return (
    <section className="px-6 py-24 md:px-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <h2 className="heading-section max-w-xs text-foreground">Questions that tend to crop up.</h2>
        <AccordionGroup type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.question} value={`faq-${index}`} index={index}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </AccordionGroup>
      </div>
    </section>
  );
}
