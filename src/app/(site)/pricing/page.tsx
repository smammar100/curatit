import type { Metadata } from "next";
import Link from "next/link";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Glaze
import { Button } from "@/components/glaze/ui/button";
import { Card, CardContent } from "@/components/glaze/ui/card";
import { DataList, DataListItem, DataListLabel, DataListValue } from "@/components/glaze/ui/data-list";
// Components
import Faq from "@/components/global/Faq";

// Pricing (rewritten 2026-10-15 from the copy audit; the template's website-directory plans and
// FAQs are gone). There is no billing in the product yet, so this says what's true: one free plan
// while Curatit is in beta, with everything in it, and paid team plans to come. Don't add prices
// or limits here until billing exists; the plan below is what an account actually gets. Since
// 2026-10-24 the plan is Glaze's Card (the grey shell with the white panel), what's included a
// DataList and Create account the page's one large primary Button.

export const metadata: Metadata = {
  title: { absolute: "Curatit pricing | Plans for social media inspiration" },
  description:
    "Curatit is free while it's in beta, and a free plan stays after it: the whole library of real brand posts, breakdowns, boards and sharing. Paid team plans come later.",
};

const included = [
  { label: "Library", value: "Every published brand post, searchable" },
  {
    label: "Breakdowns",
    value: "Notes on the words, structure and design of each post",
  },
  { label: "Boards", value: "Unlimited private boards and saves" },
  {
    label: "Sharing",
    value: "View-only links, no account needed to open them",
  },
  { label: "AI integration", value: "Use Curatit from Claude, ChatGPT, Cursor and VS Code, in beta" },
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
      "The free plan stays. Paid team plans are planned for later, for things like shared workspaces. Before anything changes for existing accounts, we'll email you what's in them and what they cost.",
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
    question: "Do I need a credit card to sign up?",
    answer:
      "No. There's nothing to pay and nothing to cancel: it's an email address and a password.",
  },
];


export default function PricingPage() {
  return (
    <>
      <section>
        <Wrapper variant="standard" className="page-start">
          <div className="mx-auto max-w-3xl text-center text-balance">
            <Text tag="h1" variant="h1" className="text-text-1">
              Free while we&apos;re in beta.
            </Text>
            <Text tag="p" variant="body" className="mx-auto mt-4 max-w-xl text-text-2">
              The whole library, breakdowns, boards and sharing. A free plan stays after the beta; team plans come later.
            </Text>
          </div>
          <div className="mx-auto mt-12 max-w-xl">
            <Card>
              <CardContent className="p-6 sm:p-8">
                <div className="space-y-3">
                  <Text tag="p" variant="h3" className="text-balance text-text-1">
                    Free
                  </Text>
                  <Text tag="p" variant="bodySM" className="text-text-2">
                    For anyone making social content for brands. Everything in Curatit, for one person.
                  </Text>
                </div>
                <Text tag="p" variant="h1" className="mt-5 text-text-1">
                  $0
                </Text>
                <DataList aria-label="What's included" className="mt-2">
                  {included.map((item) => (
                    <DataListItem key={item.label}>
                      <DataListLabel>{item.label}</DataListLabel>
                      <DataListValue>{item.value}</DataListValue>
                    </DataListItem>
                  ))}
                </DataList>
                <Button size="lg" render={<Link href="/signup" />} nativeButton={false} className="mt-5 self-start">
                  Create account
                </Button>
              </CardContent>
            </Card>
          </div>
        </Wrapper>
      </section>
      <Faq faqs={faqs} />
    </>
  );
}
