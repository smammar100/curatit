import type { ReactNode } from "react";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Icons
import ArrowUpRight from "@/components/fundations/icons/ArrowUpRight";
// Components
import { BoardDemo, DetailDemo, SearchDemo } from "./islands";

const steps: { title: string; muted: string; demoLabel: string; demo: ReactNode }[] = [
  {
    title: "Search by brief,",
    muted: "not by hashtag.",
    demoLabel: "Demo: searching the library by brief",
    demo: <SearchDemo />,
  },
  {
    title: "See why it works,",
    muted: "not just that it does.",
    demoLabel: "Demo: a carousel's slides, each labelled with its role",
    demo: <DetailDemo />,
  },
  {
    title: "Hand over a board,",
    muted: "in one click.",
    demoLabel: "Demo: a shared board as the client sees it",
    demo: <BoardDemo />,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works">
      <Wrapper variant="standard" className="section-y">
        <div className="text-balance max-w-2xl mx-auto text-center">
          <Text tag="h2" variant="displayMD" className="text-base-900 font-display font-thin">
            How it works
          </Text>
          <Text tag="p" variant="textBase" className="text-base-600 mt-4">
            From brief to board in three steps. Each card is a working piece of the product, so try it.
          </Text>
        </div>
        <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.title}
              className="relative flex min-h-110 min-w-0 flex-col overflow-clip rounded-xl bg-base-50 md:aspect-[421/560]"
            >
              <div className="relative z-10 flex items-start justify-between gap-3 px-6 py-7 lg:px-8">
                {/* The muted half always starts the second line, so no card ends on a stray word */}
                <Text tag="h3" variant="displayXS" className="text-base-900 font-display font-light">
                  {step.title}
                  <span className="block text-base-500">{step.muted}</span>
                </Text>
                <Button
                  isLink
                  iconOnly
                  size="sm"
                  variant="none"
                  href="/signup"
                  aria-label={`Get access: ${step.title}`}
                  className="shrink-0 bg-white text-base-900 ring-1 ring-base-200 hover:bg-base-100 focus:outline-base-300"
                >
                  <ArrowUpRight className="size-4" />
                </Button>
              </div>
              {/* Every illustration fills the same box and runs off the card's bottom edge, which fades it out */}
              <div role="group" aria-label={step.demoLabel} className="relative min-h-0 flex-1">
                <div className="absolute inset-x-6 top-0 -bottom-6 lg:inset-x-8">{step.demo}</div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-linear-to-b from-transparent to-base-50" />
              </div>
            </li>
          ))}
        </ul>
      </Wrapper>
    </section>
  );
}
