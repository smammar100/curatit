"use client";

import { useRef, useState, type CSSProperties } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import LibraryWindow from "./LibraryWindow";
import Scattered from "./Scattered";
import { cx } from "@/lib/cx";

/*
 * Problem → solution, pinned to the viewport while the page scrolls through it.
 * The stage holds the mess for the first half of the scroll, crossfades to the
 * library over a short stretch in the middle, then holds the library. Both the
 * crossfade and the heading swap are functions of scroll position, so scrolling
 * back reverses them.
 */

const states = {
  problem: {
    title: "Saved everywhere, found nowhere.",
    body: "This is what finding one reference for a brief looks like.",
    // Narrow enough to set the short line as two balanced lines, like the solution's
    bodyWidth: "max-w-sm",
  },
  solution: {
    title: "One library. One search.",
    body: "Curatit keeps the posts worth studying in one place. Search the brief, see why each result works, save it to a board.",
    bodyWidth: "max-w-xl",
  },
};

// Where in the pinned scroll the library fades in, and where the heading swaps
const FADE_START = 0.46;
const FADE_END = 0.62;
const SWAP_AT = 0.54;

export default function ProblemSolution() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const solutionOpacity = useTransform(scrollYProgress, [FADE_START, FADE_END], [0, 1]);

  const [solved, setSolved] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (value) => setSolved(value >= SWAP_AT));
  const active = solved ? "solution" : "problem";

  return (
    <section ref={sectionRef} className="relative mb-20 h-[min(200vh,1600px)] md:h-[min(300vh,2800px)]">
      {/* mb-20 plus the next section's pt-20 keeps the usual 80px on each side */}
      <div
        className="sticky top-0 flex h-dvh items-center justify-center pt-16"
        style={{ "--stage-h": "calc(100dvh - 4rem)" } as CSSProperties}
      >
        <Wrapper variant="standard" className="w-full">
          {/* The stage fills the viewport height on phones and keeps a 7:5 shape above */}
          <div className="relative mx-auto flex h-(--stage-h) w-full flex-col overflow-hidden md:aspect-7/5 md:h-auto md:w-[min(100%,calc(var(--stage-h)*7/5))]">
            {/* Both headings share one grid cell, so the rows below don't move when the text swaps */}
            <div className="grid px-6 pt-20 text-center">
              {(["problem", "solution"] as const).map((key) => (
                <div
                  key={key}
                  className={cx("text-balance max-w-3xl mx-auto [grid-area:1/1]", key !== active && "invisible")}
                  aria-hidden={key !== active}
                >
                  <Text tag="h2" variant="displayLG" className="text-base-900 font-display font-thin">
                    {states[key].title}
                  </Text>
                  <Text tag="p" variant="textBase" className={cx("text-base-600 mt-4 mx-auto", states[key].bodyWidth)}>
                    {states[key].body}
                  </Text>
                </div>
              ))}
            </div>
            <div className="relative mt-6 flex-1 md:mt-10">
              <Scattered className="absolute inset-0" />
              <motion.div className="absolute inset-0 bg-white" style={{ opacity: solutionOpacity }} aria-hidden={!solved}>
                <LibraryWindow className="absolute inset-0" />
              </motion.div>
            </div>
          </div>
        </Wrapper>
      </div>
    </section>
  );
}
