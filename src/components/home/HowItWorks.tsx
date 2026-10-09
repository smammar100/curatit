import type { ReactNode } from "react";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import BoardDemo from "./BoardDemo";
import DetailDemo from "./DetailDemo";
import SearchDemo from "./SearchDemo";

const steps: { eyebrow: string; title: string; body: string; demoLabel: string; demo: ReactNode }[] = [
  {
    eyebrow: "Search",
    title: "Search by brief, not by hashtag.",
    body: "Describe what you're making. Curatit reads the brief into objectives, formats and styles, shows you how it read it, and says why each post matched.",
    demoLabel: "Demo: searching the library by brief",
    demo: <SearchDemo />,
  },
  {
    eyebrow: "Study",
    title: "See why a post works.",
    body: "Every post is reviewed by an editor and broken down by objective, format, structure and visual style, with a note on why it earned its place.",
    demoLabel: "Demo: a post and its editor analysis",
    demo: <DetailDemo />,
  },
  {
    eyebrow: "Share",
    title: "Hand your client a board.",
    body: "Save references to private boards with notes on what to adapt. When you're ready, send a read-only link that expires on its own.",
    demoLabel: "Demo: a research board and its share link",
    demo: <BoardDemo />,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works">
      <Wrapper variant="standard" className="py-24">
        <Text tag="h2" variant="displaySM" className="text-base-900 font-display font-thin">
          How it works
        </Text>
        <div className="mt-12 space-y-24">
          {steps.map((step, i) => (
            <div key={step.eyebrow} className="grid items-start gap-8 lg:grid-cols-3 lg:gap-12">
              <div className="text-balance lg:pt-8">
                <Text tag="p" variant="textXS" className="text-base-600 uppercase font-medium">
                  {`0${i + 1} · ${step.eyebrow}`}
                </Text>
                <Text tag="h3" variant="displayXS" className="text-base-900 font-display font-light mt-4">
                  {step.title}
                </Text>
                <Text tag="p" variant="textBase" className="text-base-600 mt-4">
                  {step.body}
                </Text>
              </div>
              <div role="group" aria-label={step.demoLabel} className="lg:col-span-2 p-4 sm:p-8 bg-base-50 rounded-lg">
                {step.demo}
              </div>
            </div>
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
