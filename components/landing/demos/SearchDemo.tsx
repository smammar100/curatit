"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import SlideArt from "@/components/product/SlideArt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import type { LandingLibrary } from "@/lib/services/creatives";
import AppWindow from "../AppWindow";

/**
 * Library search, driven by the visitor: pick a brief and it types into the
 * field, Curatit reads it into filters, and the real results come in.
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
    <AppWindow title="Library">
      <div className="p-5">
        <div className="flex h-9 items-center gap-2 rounded-lg bg-background px-3 text-[13px] text-foreground shadow-surface-1">
          <Search size={16} strokeWidth={1.5} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">
            {typed}
            {typing && <span className="ml-px inline-block h-4 w-px translate-y-0.5 bg-foreground" aria-hidden="true" />}
          </span>
        </div>

        <div className="mt-3 flex min-h-6 flex-wrap items-center gap-1.5 text-[12px]">
          <span className="text-muted-foreground">Read as</span>
          <AnimatePresence mode="popLayout">
            {!typing &&
              brief.readAs.map((term, index) => (
                <motion.span
                  key={`${active}-${term}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: spring.fast.exit }}
                  transition={{ ...spring.fast, delay: index * 0.04 }}
                >
                  <Badge color="gray" size="compact">
                    {term}
                  </Badge>
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
              transition={{ ...spring.moderate, delay: typing ? 0 : index * 0.04 }}
            >
              <div className="overflow-hidden rounded-[2px] shadow-surface-1">
                <SlideArt art={result.art} alt="" />
              </div>
              <figcaption className="mt-1.5 truncate text-[12px] text-muted-foreground">
                <span className="text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
                  {result.brand}
                </span>{" "}
                {result.hook}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-t border-border px-5 py-3">
        <span className="mr-1 text-[12px] text-muted-foreground">Try a brief</span>
        {briefs.map((item, index) => (
          <Button
            key={item.query}
            type="button"
            size="compact"
            variant={index === active ? "secondary" : "ghost"}
            active={index === active}
            onClick={() => choose(index)}
            aria-pressed={index === active}
          >
            {item.query}
          </Button>
        ))}
      </div>
    </AppWindow>
  );
}
