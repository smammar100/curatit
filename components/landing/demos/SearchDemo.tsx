"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import SlideArt from "@/components/product/SlideArt";
import type { LandingLibrary } from "@/lib/services/creatives";
import AppWindow from "../AppWindow";

/**
 * Library search, driven by the visitor: pick a brief and it types into the
 * field, Curatit reads it into filters, and the real results stream in.
 */
export default function SearchDemo({ briefs }: { briefs: LandingLibrary["briefs"] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState(briefs[0]?.query ?? "");
  const [typing, setTyping] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  function choose(index: number) {
    if (index === active && !typing) return;
    if (timer.current) window.clearInterval(timer.current);
    const target = briefs[index].query;
    setActive(index);
    if (reduce) {
      setTyped(target);
      return;
    }
    setTyping(true);
    setTyped("");
    let length = 0;
    timer.current = window.setInterval(() => {
      length += 1;
      setTyped(target.slice(0, length));
      if (length >= target.length) {
        if (timer.current) window.clearInterval(timer.current);
        setTyping(false);
      }
    }, 22);
  }

  const brief = briefs[active];
  if (!brief) return null;

  return (
    <AppWindow title="Curatit — Library">
      <div className="p-5">
        <div className="flex h-10 items-center gap-2.5 rounded-md bg-surface px-3 text-sm text-ink shadow-card ring-1 ring-line">
          <Search size={15} className="shrink-0 text-ink-subtle" aria-hidden="true" />
          <span className="truncate">
            {typed}
            {typing && <span className="ml-px inline-block h-4 w-px translate-y-0.5 bg-ink" aria-hidden="true" />}
          </span>
        </div>

        <div className="mt-3 flex min-h-6 flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-ink-subtle">Read as</span>
          <AnimatePresence mode="popLayout">
            {!typing &&
              brief.readAs.map((term, index) => (
                <motion.span
                  key={`${active}-${term}`}
                  className="rounded-full bg-brand-soft px-2 py-0.5 font-medium text-accent-700 ring-1 ring-inset ring-accent-100"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.04 }}
                >
                  + {term}
                </motion.span>
              ))}
          </AnimatePresence>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {brief.results.slice(0, 6).map((result, index) => (
            <motion.figure
              key={`${active}-${result.id}`}
              className="min-w-0"
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={typing ? { opacity: 0.25, y: 0 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: typing ? 0 : index * 0.04 }}
            >
              <div className="overflow-hidden rounded-md shadow-card ring-1 ring-line">
                <SlideArt art={result.art} alt="" />
              </div>
              <figcaption className="mt-1.5 truncate text-[11px] text-ink-muted">
                <span className="font-medium text-ink">{result.brand}</span> — {result.hook}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface-sunken px-5 py-3">
        <span className="text-[11px] text-ink-subtle">Try a brief</span>
        {briefs.map((item, index) => (
          <button
            key={item.query}
            type="button"
            onClick={() => choose(index)}
            aria-pressed={index === active}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-[background-color,color] duration-150 ease-out active:scale-[0.97] ${
              index === active ? "bg-base-800 text-white" : "bg-surface text-ink ring-1 ring-line hover:bg-surface-inset"
            }`}
          >
            {item.query}
          </button>
        ))}
      </div>
    </AppWindow>
  );
}
