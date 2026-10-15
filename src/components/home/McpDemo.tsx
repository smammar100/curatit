"use client";

import { useEffect, useRef, useState } from "react";
import { m, useInView, useReducedMotion } from "framer-motion";
// Assets
import Symbol from "@/components/assets/Symbol";
// Components
import ThoughtLine from "@/components/ui/thought-line";
import BrandName from "./BrandName";
import PostCover from "./PostCover";
import { briefs } from "./demo";
import { usePosts } from "./HomePosts";

const brief = briefs[0];
const trace = ["Reading the brief", "Searching the library"];
// How long the search takes in the script below (step 2 to step 4), for the settled line
// when it shows without having run: on first view and under reduced motion
const SEARCH_SECONDS = 2.3;

/*
 * An agent asking Curatit for references, on a loop while the panel is on
 * screen: the brief is sent, the agent's line starts working and ticks through
 * its trace, then it settles into "Found 3 posts in 2.3s" as the results slide
 * in and hold, then it clears and starts again. Reduced motion shows the
 * results only.
 */

type Step = 0 | 1 | 2 | 3 | 4; // empty · brief sent · trace step 1 · trace step 2 · results

const SCRIPT: [number, Step][] = [
  [0, 0],
  [400, 1],
  [1100, 2],
  [2200, 3],
  [3400, 4],
];
const CYCLE = 8000;
// On first view the results are already showing; hold them this long before the loop starts over
const FIRST_HOLD = 3000;

export default function McpDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>(4);
  // Until the loop has run once, the settled line shows the scripted time instead of a clock
  const [looped, setLooped] = useState(false);
  const posts = usePosts(brief.results.map((result) => result.post));

  useEffect(() => {
    if (step < 4) setLooped(true);
  }, [step]);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = (offset: number) => {
      for (const [at, next] of SCRIPT) {
        if (at >= offset)
          timers.push(setTimeout(() => setStep(next), at - offset));
      }
      timers.push(setTimeout(() => run(0), CYCLE - offset));
    };
    run(CYCLE - FIRST_HOLD);
    return () => timers.forEach(clearTimeout);
  }, [inView, reduceMotion]);

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Demo: an AI agent asking Curatit for references and getting three posts back"
      className="relative overflow-hidden rounded-2xl bg-base-50 lg:aspect-4/3"
      data-step={step}
    >
      {/* Grows with its content on small screens; centred in a fixed 4:3 panel from lg up */}
      <div className="px-6 py-10 sm:px-10 lg:absolute lg:inset-x-10 lg:top-1/2 lg:-translate-y-1/2 lg:px-0 lg:py-0">
        <div className="flex justify-end">
          {/* Sent like a message: rises in from its bottom-right corner */}
          <m.p
            className="max-w-sm origin-bottom-right rounded-2xl rounded-br-sm bg-base-100 px-5 py-4 text-sm leading-relaxed text-base-900 sm:text-base"
            initial={false}
            animate={
              step >= 1
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 12, scale: 0.96 }
            }
            transition={
              step >= 1
                ? { type: "spring", stiffness: 300, damping: 26 }
                : { duration: 0.3 }
            }
          >
            Show me <strong className="font-medium">launch carousels</strong>{" "}
            that <strong className="font-medium">show the product</strong>
          </m.p>
        </div>
        {/* The agent's line and the results share one cell: the trace unfolds into the space the
            results will take, and folds away as they arrive, so the panel never changes height */}
        <div className="mt-6 grid">
          <m.div
            className="self-start pt-1 text-base-600 [grid-area:1/1]"
            initial={false}
            animate={{ opacity: step >= 2 ? 1 : 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Not a toggle or a live region here: the loop drives it, and the panel's label
                describes the demo */}
            <ThoughtLine
              working={step === 2 || step === 3}
              // Shorter than the settled line, which sets the width the server renders it at
              label="Searching…"
              doneLabel={`Found ${posts.length} posts in`}
              steps={step === 2 ? trace.slice(0, 1) : trace}
              glyph={<Symbol />}
              // Real colours, not currentColor: the shimmer mixes the ink with transparent, and
              // color-mix() can't take currentColor, which would leave the label invisible
              color="var(--color-base-600)"
              glyphColor="var(--color-base-900)"
              fontSize={14}
              collapsible={false}
              live={false}
              elapsed={looped ? undefined : SEARCH_SECONDS}
            />
          </m.div>
          <m.ul
            className="mt-10 flex gap-4 [grid-area:1/1]"
            initial={false}
            // Drifts left slowly while the results hold, then fades out for the next cycle. It
            // waits a beat for the trace to fold out of its way.
            animate={step === 4 ? { x: -24, opacity: 1 } : { x: 0, opacity: 0 }}
            transition={
              step === 4
                ? {
                    x: { duration: 4, ease: "easeOut" },
                    opacity: { duration: 0.2, delay: 0.15 },
                  }
                : { x: { duration: 0 }, opacity: { duration: 0.3 } }
            }
          >
            {posts.map((post, i) => {
              return (
                <m.li
                  key={post.shortCode}
                  className="w-36 shrink-0 sm:w-40"
                  initial={false}
                  animate={step === 4 ? { x: 0 } : { x: 48 }}
                  transition={
                    step === 4
                      ? {
                          type: "spring",
                          stiffness: 260,
                          damping: 28,
                          delay: 0.15 + i * 0.08,
                        }
                      : { duration: 0 }
                  }
                >
                  <PostCover
                    post={post}
                    sizes="160px"
                    className="rounded shadow"
                  />
                  <BrandName brand={post.brand} className="mt-2" />
                  <p className="mt-0.5 line-clamp-1 text-xs text-base-600">
                    {post.hook}
                  </p>
                </m.li>
              );
            })}
          </m.ul>
        </div>
      </div>
    </div>
  );
}
