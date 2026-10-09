"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
// Assets
import Symbol from "@/components/assets/Symbol";
// Components
import PostCover from "./PostCover";
import { brands, briefs, posts, type Post } from "./demo";

const brief = briefs[0];
const statuses = ["Reading the brief…", "Searching the library…"];

/*
 * An agent asking Curatit for references, on a loop while the panel is on
 * screen: the brief is sent, two status lines follow, then the results slide
 * in and hold, then it clears and starts again. Reduced motion shows the
 * results only.
 */

type Step = 0 | 1 | 2 | 3 | 4; // empty · brief sent · status line 1 · status line 2 · results

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

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = (offset: number) => {
      for (const [at, next] of SCRIPT) {
        if (at >= offset) timers.push(setTimeout(() => setStep(next), at - offset));
      }
      timers.push(setTimeout(() => run(0), CYCLE - offset));
    };
    run(CYCLE - FIRST_HOLD);
    return () => timers.forEach(clearTimeout);
  }, [inView, reduceMotion]);

  const status = step === 2 ? statuses[0] : step === 3 ? statuses[1] : step === 4 ? `Found ${brief.results.length} posts` : "";

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Demo: an AI agent asking Curatit for references and getting three posts back"
      className="relative overflow-hidden rounded-xl bg-base-50 lg:aspect-4/3"
      data-step={step}
    >
      {/* Grows with its content on small screens; centred in a fixed 4:3 panel from lg up */}
      <div className="px-6 py-10 sm:px-10 lg:absolute lg:inset-x-10 lg:top-1/2 lg:-translate-y-1/2 lg:px-0 lg:py-0">
        <div className="flex justify-end">
          {/* Sent like a message: rises in from its bottom-right corner */}
          <motion.p
            className="max-w-sm origin-bottom-right rounded-2xl rounded-br-sm bg-base-100 px-5 py-4 text-sm leading-relaxed text-base-900 sm:text-base"
            initial={false}
            animate={step >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={step >= 1 ? { type: "spring", stiffness: 300, damping: 26 } : { duration: 0.3 }}
          >
            Show me <strong className="font-medium">bold type</strong> launches for a{" "}
            <strong className="font-medium">new drink</strong>
          </motion.p>
        </div>
        <motion.div
          className="mt-6 flex min-h-6 items-center gap-2 text-sm text-base-600"
          initial={false}
          animate={{ opacity: step >= 2 ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <Symbol className="size-4 shrink-0 text-base-900" />
          <span>{status}</span>
        </motion.div>
        <motion.ul
          className="mt-4 flex gap-4"
          initial={false}
          // Drifts left slowly while the results hold, then fades out for the next cycle
          animate={step === 4 ? { x: -24, opacity: 1 } : { x: 0, opacity: 0 }}
          transition={
            step === 4
              ? { x: { duration: 4, ease: "easeOut" }, opacity: { duration: 0.2 } }
              : { x: { duration: 0 }, opacity: { duration: 0.3 } }
          }
        >
          {brief.results.map(({ post: id }, i) => {
            const post: Post = posts[id];
            return (
              <motion.li
                key={id}
                className="w-36 shrink-0 sm:w-40"
                initial={false}
                animate={step === 4 ? { x: 0 } : { x: 48 }}
                transition={step === 4 ? { type: "spring", stiffness: 260, damping: 28, delay: i * 0.08 } : { duration: 0 }}
              >
                <PostCover brand={post.brand} slide={post.slides[0]} className="rounded shadow" />
                <p className="mt-2 truncate text-xs font-medium text-base-900">{brands[post.brand].name}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-base-600">{post.hook}</p>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </div>
  );
}
