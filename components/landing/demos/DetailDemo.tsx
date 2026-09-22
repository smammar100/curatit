"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SlideArt from "@/components/product/SlideArt";
import type { LandingLibrary } from "@/lib/services/creatives";
import AppWindow from "../AppWindow";

const stepButton =
  "flex size-8 items-center justify-center rounded-full bg-surface text-ink shadow-card ring-1 ring-line transition-[background-color,transform] duration-150 ease-out hover:bg-surface-inset active:scale-[0.94] disabled:pointer-events-none disabled:text-disabled-ink";

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
    <AppWindow title={`${sample.brand} — ${sample.hook}`}>
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        {/* Slide viewer */}
        <div className="relative border-b border-line bg-surface-sunken p-5 sm:border-b-0 sm:border-r">
          <div className="relative mx-auto w-44">
            <div className="overflow-hidden rounded-md shadow-card ring-1 ring-line">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <SlideArt art={sample.slides[index].art} alt={sample.slides[index].alt} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Annotation: the page's chat-bubble motif. */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={step}
                className="absolute -right-10 top-5 rounded-full bg-brand px-3 py-1 text-[11px] font-medium text-white shadow-card"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ transformOrigin: "bottom left" }}
              >
                {step}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-[7px] left-3 size-0 border-l-[6px] border-r-[3px] border-t-[8px] border-l-transparent border-r-transparent border-t-brand"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              className={stepButton}
              onClick={() => setIndex((value) => Math.max(0, value - 1))}
              disabled={index === 0}
              aria-label="Previous slide"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-12 text-center text-[11px] tabular-nums text-ink-subtle" aria-live="polite">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              className={stepButton}
              onClick={() => setIndex((value) => Math.min(count - 1, value + 1))}
              disabled={index === count - 1}
              aria-label="Next slide"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Breakdown */}
        <div className="min-w-0 p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-subtle">Narrative</p>
          <ol className="mt-2 flex flex-wrap gap-1.5">
            {sample.sequence.map((name, position) => (
              <li key={position}>
                <button
                  type="button"
                  onClick={() => setIndex(Math.min(position, count - 1))}
                  aria-current={position === index ? "step" : undefined}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-[background-color,color] duration-150 ease-out ${
                    position === index ? "bg-base-800 text-white" : "bg-surface-sunken text-ink-muted hover:bg-surface-inset"
                  }`}
                >
                  <span className="tabular-nums">{position + 1}.</span> {name}
                </button>
              </li>
            ))}
          </ol>

          <dl className="mt-5 divide-y divide-line border-t border-line text-xs">
            {sample.rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-2.5">
                <dt className="font-medium text-ink">{row.label}</dt>
                <dd className="text-ink-muted">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </AppWindow>
  );
}
