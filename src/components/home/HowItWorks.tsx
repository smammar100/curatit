import type { ReactNode } from "react";
import Link from "next/link";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Glaze
import { Button } from "@/components/glaze/ui/button";
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
    muted: "Describe the post you need, like a carousel that launches a feature.",
    demoLabel: "Interactive example: searching the library by describing the post you need",
    demo: <SearchDemo />,
  },
  {
    title: "Understand the copy and design.",
    muted: "See the message, structure and visual choices behind each post.",
    demoLabel: "Interactive example: a carousel's slides, each labelled with its role",
    demo: <DetailDemo />,
  },
  {
    title: "Save and share your references.",
    muted: "Save posts to a private board and share a view-only link.",
    demoLabel: "Interactive example: a shared board as the client sees it",
    demo: <BoardDemo />,
  },
];

// The cards are Glaze's grey shell, as mats with its corner (2026-10-24); every illustration
// inside is drawn on Glaze's tokens.
export default function HowItWorks() {
  return (
    <section id="how-it-works">
      <Wrapper variant="standard" className="section-y">
        <div className="mx-auto max-w-2xl text-center text-balance">
          <Text tag="h2" variant="h1" className="text-text-1">
            How it works
          </Text>
          <Text tag="p" variant="body" className="mt-4 text-text-2">
            Find an example, see how it's built, save it for later. Try the
            cards below.
          </Text>
        </div>
        <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.title}
              className="relative flex min-h-110 min-w-0 flex-col overflow-clip rounded-(--radius-float) bg-shell md:aspect-3/4"
            >
              <div className="relative z-(--z-raised) px-6 py-7 lg:px-8">
                <Text tag="h3" variant="h5" className="text-balance text-text-1">
                  {step.title}
                </Text>
                <Text tag="p" variant="bodySM" className="mt-2 text-pretty text-text-2">
                  {step.muted}
                </Text>
              </div>
              {/* Every illustration fills the same box and runs off the card's bottom edge, which
                  fades it out: a mask on the illustration (it paints nothing), so it fades into
                  the card's own grey in both themes */}
              <div role="group" aria-label={step.demoLabel} className="relative min-h-0 flex-1">
                <div className="absolute inset-x-6 top-0 -bottom-6 mask-b-from-80% lg:inset-x-8">{step.demo}</div>
              </div>
            </li>
          ))}
        </ul>
        {/* One labelled action for the walkthrough, in place of the arrow links the cards used to carry */}
        <div className="mt-10 flex justify-center">
          <Button render={<Link href="/signup" />} nativeButton={false}>
            Create account
          </Button>
        </div>
      </Wrapper>
    </section>
  );
}
