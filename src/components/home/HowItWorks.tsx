import type { ReactNode } from "react";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import { BoardDemo, DetailDemo, SearchDemo } from "./islands";

const steps: {
  title: string;
  muted: string;
  demoLabel: string;
  demo: ReactNode;
}[] = [
  {
    title: "Find posts for your project.",
    muted:
      "Describe the post you need, like a carousel that launches a feature.",
    demoLabel:
      "Interactive example: searching the library by describing the post you need",
    demo: <SearchDemo />,
  },
  {
    title: "Understand the copy and design.",
    muted: "See the message, structure and visual choices behind each post.",
    demoLabel:
      "Interactive example: a carousel's slides, each labelled with its role",
    demo: <DetailDemo />,
  },
  {
    title: "Save and share your references.",
    muted: "Save posts to a private board and share a view-only link.",
    demoLabel: "Interactive example: a shared board as the client sees it",
    demo: <BoardDemo />,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works">
      <Wrapper variant="standard" className="section-y">
        <div className="text-balance max-w-2xl mx-auto text-center">
          <Text tag="h2" variant="displayLG" className="text-base-900">
            How it works
          </Text>
          <Text tag="p" variant="textBase" className="text-base-600 mt-4">
            Find an example, see how it's built, save it for later. Try the
            cards below.
          </Text>
        </div>
        <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.title}
              className="relative flex min-h-110 min-w-0 flex-col overflow-clip rounded-2xl bg-base-50 md:aspect-[421/560]"
            >
              <div className="relative z-10 px-6 py-7 lg:px-8">
                <Text
                  tag="h3"
                  variant="displayXS"
                  className="text-base-900 text-balance"
                >
                  {step.title}
                </Text>
                <Text
                  tag="p"
                  variant="textSM"
                  className="mt-2 text-base-600 text-pretty"
                >
                  {step.muted}
                </Text>
              </div>
              {/* Every illustration fills the same box and runs off the card's bottom edge, which fades it out */}
              <div
                role="group"
                aria-label={step.demoLabel}
                className="relative min-h-0 flex-1"
              >
                <div className="absolute inset-x-6 top-0 -bottom-6 lg:inset-x-8">
                  {step.demo}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-linear-to-b from-transparent to-base-50" />
              </div>
            </li>
          ))}
        </ul>
        {/* One labelled action for the walkthrough, in place of the arrow links the cards used to carry */}
        <div className="mt-10 flex justify-center">
          <Button isLink size="base" variant="default" href="/signup">
            Create account
          </Button>
        </div>
      </Wrapper>
    </section>
  );
}
