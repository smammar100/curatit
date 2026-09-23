import Wrapper from "@/components/fundations/containers/Wrapper";
import { AccordionGroup, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

/** Shared with the landing FAQ, which reads `{ question, answer }`. */
export const faqs = [
  {
    question: "What is Curatit?",
    answer:
      "A curated library of organic brand posts from Instagram, both statics and carousels. Each one has an editor-reviewed breakdown of its objective, structure, and visual approach. You search it by brief, save references to private boards, and share them.",
  },
  {
    question: "Where do the posts come from?",
    answer:
      "From public brand feeds in six launch categories, collected on a disclosed schedule and reviewed by editors before anything is published. Every post links back to its source and credits the brand. We don’t collect comments or personal profiles.",
  },
  {
    question: "Is the library real-time?",
    answer:
      "No. Sources are checked on a schedule, and each post shows when it was published and when we last checked it. We don’t describe anything as live unless it is.",
  },
  {
    question: "Are posts organic or paid?",
    answer:
      "They come from brand feeds. A post can also have been promoted, and we usually can’t know, so we label it as a brand-feed post with paid distribution unknown.",
  },
  {
    question: "Who can see my boards?",
    answer:
      "Only you. Boards are private by default. If you create a share link, anyone holding it can view the board title and references until it expires or you revoke it. They never see your description or notes.",
  },
  {
    question: "Can I use these posts as templates?",
    answer:
      "No. Curatit is for reference and understanding, not copying another brand’s design. Use the patterns to inform original work.",
  },
  {
    question: "How do I get content removed?",
    answer:
      "If you own or represent content on Curatit, use the removal page linked in the footer. We stop showing it immediately while we review the request.",
  },
];

export default function Faq() {
  return (
    <section aria-labelledby="faq-heading">
      <Wrapper variant="standard" className="py-12">
        <div className="grid grid-cols-1 gap-6 border-t border-border pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
          <div>
            <h2 id="faq-heading" className="heading-section text-foreground">
              Frequently asked questions
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-muted-foreground">What you should know before you start.</p>
          </div>
          <AccordionGroup type="single" collapsible className="-mx-3 w-auto lg:mx-0 lg:w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={faq.question} index={index}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="max-w-[65ch] leading-5">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </AccordionGroup>
        </div>
      </Wrapper>
    </section>
  );
}
