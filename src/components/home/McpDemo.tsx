"use client";

import { m } from "framer-motion";
// Assets
import Symbol from "@/components/assets/Symbol";
// Glaze
import { Check, Icon, Pending } from "@/components/glaze/icon";
// Components
import BrandName from "./BrandName";
import { useScript } from "./DemoParts";
import PostCover from "./PostCover";
import { briefs } from "./demo";
import { usePosts } from "./HomePosts";
import { cx } from "@/lib/cx";

const brief = briefs[0];
const trace = ["Reading the brief", "Searching the library"];
// How long the search takes in the script below (step 2 to step 4). The settled line always
// reads this, so it says the same on first view, under reduced motion and after any pause
// (a background tab's throttled timers can land the results late)
const SEARCH_SECONDS = 2.3;

/*
 * An agent asking Curatit for references, on a loop while the panel is on
 * screen: the brief is sent, the agent's line starts working and ticks through
 * its trace, then it settles into "Found 3 posts in 2.3s" as the results slide
 * in and hold, then it clears and starts again. It pauses while pointed at or
 * focused (useScript), but never mid-search, so a pause that comes then waits
 * for the results. Reduced motion shows the results only.
 *
 * Since 2026-10-24 on Glaze: the panel is its grey shell, the message a well on the shell corner,
 * the covers on the panel corner, and the agent's line drawn the way Glaze shows what an agent is
 * doing: its steps in words, each finished one ticked and the one under way beside the pending
 * arc (Glaze's one loop), then Curatit's mark and the result. No shimmer on the words (Glaze anti-slop).
 */

type Step = 0 | 1 | 2 | 3 | 4; // empty · brief sent · trace step 1 · trace step 2 · results
// The steps the agent's line is working in
const searching = (step: Step) => step === 2 || step === 3;

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
  const { ref, step, handlers } = useScript(SCRIPT, {
    cycle: CYCLE,
    hold: FIRST_HOLD,
    rest: 4,
    busy: searching,
  });
  const posts = usePosts(brief.results.map((result) => result.post));
  const working = searching(step);
  const steps = step === 2 ? trace.slice(0, 1) : trace;

  return (
    <div
      ref={ref}
      {...handlers}
      role="group"
      aria-label="Demo: an AI agent asking Curatit for references and getting three posts back"
      className="relative overflow-hidden rounded-shell bg-shell lg:aspect-4/3"
      data-step={step}
    >
      {/* Grows with its content on small screens; centred in a fixed 4:3 panel from lg up */}
      <div className="px-6 py-10 sm:px-10 lg:absolute lg:inset-x-10 lg:top-1/2 lg:-translate-y-1/2 lg:px-0 lg:py-0">
        <div className="flex justify-end">
          {/* Sent like a message: rises in from its bottom-right corner */}
          <m.p
            className="max-w-sm origin-bottom-right rounded-shell rounded-br-tag bg-field px-4 py-3 type-body-sm text-text-1 sm:type-body"
            initial={false}
            animate={step >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={step >= 1 ? { type: "spring", stiffness: 300, damping: 26 } : { duration: 0.3 }}
          >
            Show me <strong className="font-medium">launch carousels</strong> that{" "}
            <strong className="font-medium">show the product</strong>
          </m.p>
        </div>
        {/* The agent's line and the results share one cell: the trace unfolds into the space the
            results will take, and folds away as they arrive, so the panel never changes height */}
        <div className="mt-6 grid">
          {/* Not a live region: the loop drives it, and the panel's label describes the demo */}
          <m.div
            className="col-start-1 row-start-1 self-start pt-1 type-body-sm text-text-2"
            initial={false}
            animate={{ opacity: step >= 2 ? 1 : 0 }}
            transition={{ duration: 0.25 }}
          >
            {working ? (
              // The trace in order: each finished step ticked, the one under way with the arc
              <ul className="space-y-1.5">
                {steps.map((label, i) => {
                  const current = i === steps.length - 1;
                  return (
                    <li key={label} className={cx("flex items-center gap-2", current && "text-text-1")}>
                      {current ? (
                        <Icon icon={Pending} className="animate-spin text-text-2 motion-reduce:animate-none" />
                      ) : (
                        <Icon icon={Check} className="text-text-3" />
                      )}
                      {label}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-text-1">
                <Symbol className="size-3.5 shrink-0" aria-hidden="true" />
                Found {posts.length} posts in {SEARCH_SECONDS}s
              </p>
            )}
          </m.div>
          <m.ul
            className="col-start-1 row-start-1 mt-10 flex gap-4"
            initial={false}
            // Drifts left slowly while the results hold, then fades out for the next cycle. It
            // waits a beat for the trace to fold out of its way.
            animate={step === 4 ? { x: -24, opacity: 1 } : { x: 0, opacity: 0 }}
            transition={
              step === 4
                ? { x: { duration: 4, ease: "easeOut" }, opacity: { duration: 0.2, delay: 0.15 } }
                : { x: { duration: 0 }, opacity: { duration: 0.3 } }
            }
          >
            {posts.map((post, i) => (
              <m.li
                key={post.shortCode}
                className="w-36 shrink-0 sm:w-40"
                initial={false}
                animate={step === 4 ? { x: 0 } : { x: 48 }}
                transition={
                  step === 4
                    ? { type: "spring", stiffness: 260, damping: 28, delay: 0.15 + i * 0.08 }
                    : { duration: 0 }
                }
              >
                <PostCover post={post} sizes="160px" className="rounded-panel" />
                <BrandName brand={post.brand} className="mt-2" />
                <p className="mt-0.5 line-clamp-1 type-caption text-text-2">{post.hook}</p>
              </m.li>
            ))}
          </m.ul>
        </div>
      </div>
    </div>
  );
}
