import type { Metadata } from "next";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import Faq from "@/components/global/Faq";

// Pricing (rewritten 2026-10-15 from the copy audit; the template's website-directory plans and
// FAQs are gone). There is no billing in the product yet, so this says what's true: one free plan
// while Curatit is in beta, with everything in it, and paid team plans to come. Don't add prices
// or limits here until billing exists; the plan below is what an account actually gets.

export const metadata: Metadata = {
  title: { absolute: "Curatit pricing | Plans for social media inspiration" },
  description:
    "Curatit is free while it's in beta: the whole library of real brand posts, breakdowns, boards and sharing. Paid team plans come later.",
};

const included = [
  { label: "Library", value: "Every published brand post, searchable" },
  {
    label: "Breakdowns",
    value: "Copy, structure and design notes on analysed posts",
  },
  { label: "Boards", value: "Unlimited private boards and saves" },
  {
    label: "Sharing",
    value: "View-only links, no account needed to open them",
  },
  { label: "AI integration", value: "The MCP server, in beta" },
];

const faqs = [
  {
    question: "What does a free account include?",
    answer:
      "Everything Curatit does today: searching the library, reading post breakdowns, saving posts to boards, sharing boards with a link, and the AI integration while it's in beta.",
  },
  {
    question: "Will Curatit stay free?",
    answer:
      "The free plan stays. Paid team plans are planned for later, for things like shared workspaces; we'll announce what's in them and what they cost before anything changes for existing accounts.",
  },
  {
    question: "How many posts can I save?",
    answer: "As many as you like, to as many boards as you like.",
  },
  {
    question: "Who can see my boards?",
    answer:
      "Only you, until you share a board with a link. A shared board is view-only, opens without an account, and shows your notes. Turn sharing off and the link stops working.",
  },
  {
    question: "Do I need a card to sign up?",
    answer:
      "No. There's nothing to pay and nothing to cancel: it's an email address and a password.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section>
        <Wrapper variant="standard" className="page-start">
          <div className="text-balance max-w-3xl mx-auto text-center">
            <Text
              tag="h1"
              variant="displayLG"
              className="font-display font-light text-base-900"
            >
              Free while we&apos;re in beta.
            </Text>
            <Text
              tag="p"
              variant="textBase"
              className="text-base-600 mt-4 max-w-xl mx-auto"
            >
              The whole library, breakdowns, boards and sharing. Team plans come
              later.
            </Text>
          </div>
          <div className="mx-auto mt-12 max-w-xl">
            <div className="flex flex-col rounded-lg bg-base-50 p-8">
              <div className="space-y-3">
                <Text
                  tag="p"
                  variant="displaySM"
                  className="text-base-900 text-balance font-display font-light"
                >
                  Free
                </Text>
                <Text tag="p" variant="textSM" className="text-base-600">
                  For anyone making social content for brands. Everything in
                  Curatit, for one person.
                </Text>
              </div>
              <Text
                tag="p"
                variant="displayLG"
                className="text-base-900 font-display font-light mt-8"
              >
                $0
              </Text>
              <ul className="divide-y divide-base-200 mt-4">
                {included.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start justify-between gap-6 py-3"
                  >
                    <Text
                      tag="span"
                      variant="textBase"
                      className="shrink-0 text-base-800"
                    >
                      {item.label}
                    </Text>
                    <Text
                      tag="span"
                      variant="textSM"
                      className="text-right text-base-500"
                    >
                      {item.value}
                    </Text>
                  </li>
                ))}
              </ul>
              <Button
                isLink
                size="base"
                variant="default"
                href="/signup"
                className="w-fit mt-8"
              >
                Create account
              </Button>
            </div>
          </div>
        </Wrapper>
      </section>
      <Faq faqs={faqs} />
    </>
  );
}
