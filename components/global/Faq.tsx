import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { Plus } from "@/components/fundations/icons";

export const faqs = [
  {
    question: "What is Curatit?",
    answer:
      "A curated library of organic brand posts from Instagram — statics and carousels — each with an editor-reviewed breakdown of its objective, structure, and visual approach. You search it by brief, save references to private boards, and share them.",
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
      "Only you. Boards are private by default. If you create a share link, anyone holding it can view the board title and references until it expires or you revoke it — never your description or notes.",
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
    <section>
      <Wrapper variant="standard" className="py-12">
        <div className="text-center">
          <Text tag="h2" variant="displayLG" className="text-base-900 font-display font-thin">
            Frequently Asked Questions
          </Text>
          <Text tag="p" variant="textBase" className="text-base-600 mt-4">
            What you should know before you start.
          </Text>
        </div>
        <Wrapper variant="narrow" className="mt-12">
          <div>
            {faqs.map((faq) => (
              <details key={faq.question} className="group cursor-pointer">
                <summary className="text-sm leading-normal text-base-900 font-medium flex items-center justify-between w-full px-8 py-4 text-left select-none hover:text-accent-500 focus:text-accent-500">
                  {faq.question}
                  <Plus className="size-4 duration-300 ease-out transform group-open:-rotate-45" />
                </summary>
                <div className="py-4 px-8">
                  <Text tag="p" variant="textSM" className="text-base-600 text-balance">
                    {faq.answer}
                  </Text>
                </div>
              </details>
            ))}
          </div>
        </Wrapper>
      </Wrapper>
    </section>
  );
}
