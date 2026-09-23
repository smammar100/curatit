"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SlideArt from "@/components/product/SlideArt";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { cn } from "@/lib/utils";
import type { LandingLibrary } from "@/lib/services/creatives";
import AppWindow from "../AppWindow";

/**
 * A real carousel and its editorial breakdown. The visitor steps through the
 * slides; each slide lights up its step in the narrative, annotated with the
 * same chat-bubble tag the hero uses.
 */
export default function DetailDemo({ sample }: { sample: NonNullable<LandingLibrary["sample"]> }) {
  const [index, setIndex] = useState(0);
  const count = sample.slides.length;
  const step = sample.sequence[index] ?? `Slide ${index + 1}`;

  return (
    <AppWindow title={`${sample.brand}: ${sample.hook}`}>
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        {/* Slide viewer */}
        <div className="relative border-b border-border bg-muted p-5 sm:border-b-0 sm:border-r">
          <div className="relative mx-auto w-44">
            <div className="overflow-hidden rounded-[2px] shadow-surface-3">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12, transition: spring.moderate.exit }}
                  transition={spring.moderate}
                >
                  <SlideArt art={sample.slides[index].art} alt={sample.slides[index].alt} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Annotation: the page's chat-bubble motif. */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={step}
                className="absolute -right-10 top-5 rounded-full bg-foreground px-3 py-1 text-[12px] text-background shadow-surface-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: spring.fast.exit }}
                transition={spring.fast}
                style={{ transformOrigin: "bottom left", fontVariationSettings: fontWeights.medium }}
              >
                {step}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-[7px] left-3 size-0 border-l-[6px] border-r-[3px] border-t-[8px] border-l-transparent border-r-transparent border-t-foreground"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon-compact"
              onClick={() => setIndex((value) => Math.max(0, value - 1))}
              disabled={index === 0}
              aria-label="Previous slide"
            >
              <ChevronLeft strokeWidth={1.5} />
            </Button>
            <span className="min-w-12 text-center text-[12px] tabular-nums text-muted-foreground" aria-live="polite">
              {index + 1} / {count}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="icon-compact"
              onClick={() => setIndex((value) => Math.min(count - 1, value + 1))}
              disabled={index === count - 1}
              aria-label="Next slide"
            >
              <ChevronRight strokeWidth={1.5} />
            </Button>
          </div>
        </div>

        {/* Breakdown */}
        <div className="min-w-0 p-5">
          <p className="text-[12px] text-muted-foreground">Narrative</p>
          <ol className="mt-2 flex flex-wrap gap-1">
            {sample.sequence.map((name, position) => (
              <li key={position}>
                <button
                  type="button"
                  onClick={() => setIndex(Math.min(position, count - 1))}
                  aria-current={position === index ? "step" : undefined}
                  className={cn(
                    "h-7 rounded-lg px-2.5 text-[12px] outline-none transition-colors duration-80 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
                    position === index ? "bg-selected text-foreground" : "text-muted-foreground hover:bg-hover hover:text-foreground"
                  )}
                  style={{ fontVariationSettings: position === index ? fontWeights.semibold : fontWeights.normal }}
                >
                  <span className="tabular-nums">{position + 1}.</span> {name}
                </button>
              </li>
            ))}
          </ol>

          <dl className="mt-5 divide-y divide-border border-t border-border text-[12px]">
            {sample.rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-2.5">
                <dt className="text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
                  {row.label}
                </dt>
                <dd className="text-muted-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </AppWindow>
  );
}
