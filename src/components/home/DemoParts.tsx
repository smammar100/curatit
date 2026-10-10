"use client";

// Small pieces of Curatit's UI shared by the How it works illustrations
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import Search from "@/components/fundations/icons/Search";
import { cx } from "@/lib/cx";
import { briefs } from "./demo";

// Shared easing for the illustrations' entrances
export const easeOut = [0.32, 0.72, 0, 1] as const;

// Intro: the first time an illustration scrolls into view, its pieces arrive one after
// another. Spread useIntro() on the root motion element and give each piece a variant.
const introContainer = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
export const introItem = {
  hidden: { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};
export const introScale = {
  hidden: { opacity: 0, scale: 0.94 },
  shown: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: easeOut } },
};
export const introFromRight = {
  hidden: { opacity: 0, x: 48 },
  shown: { opacity: 1, x: 0, transition: { duration: 0.8, ease: easeOut } },
};

export function useIntro() {
  const reduceMotion = useReducedMotion();
  return {
    variants: introContainer,
    initial: reduceMotion ? (false as const) : "hidden",
    whileInView: "shown",
    viewport: { once: true, amount: 0.35 },
  };
}

// Calls onTick every `interval` ms while the illustration is on screen. Stops for good
// once the visitor takes over (call stop()), and never runs with reduced motion.
export function useLoop<T extends HTMLElement>(interval: number, onTick: () => void) {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [stopped, setStopped] = useState(false);
  const tick = useRef(onTick);
  useEffect(() => {
    tick.current = onTick;
  });

  const playing = inView && !reduceMotion && !stopped;
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => tick.current(), interval);
    return () => clearInterval(timer);
  }, [playing, interval]);

  return { ref, playing, stop: () => setStopped(true) };
}

// Types `text` out a character at a time whenever it changes (not on first render)
export function useTyped(text: string, enabled: boolean) {
  const [count, setCount] = useState(text.length);
  const previous = useRef(text);

  useEffect(() => {
    if (previous.current === text) return;
    previous.current = text;
    if (!enabled) {
      setCount(text.length);
      return;
    }
    setCount(0);
    const timer = setInterval(() => {
      setCount((current) => {
        if (current >= text.length) clearInterval(timer);
        return Math.min(current + 1, text.length);
      });
    }, 24);
    return () => clearInterval(timer);
  }, [text, enabled]);

  return { typed: text.slice(0, count), done: count >= text.length };
}

// The example briefs as a segmented control that always fits one row
export function BriefTabs({
  active,
  onChange,
  className,
}: {
  active: number;
  onChange: (index: number) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label="Try a brief" className={cx("flex gap-0.5 rounded-lg bg-base-100 p-0.5", className)}>
      {briefs.map((option, i) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={i === active}
          onClick={() => onChange(i)}
          className={cx(
            "h-7 flex-1 truncate rounded-md px-2 text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-400",
            i === active ? "bg-base-800 text-white" : "text-base-600 hover:text-base-900"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// The search field with a brief in it. While `typing`, a caret follows the text.
export function QueryField({ query, typing = false, className }: { query: string; typing?: boolean; className?: string }) {
  return (
    <div className={cx("flex h-9 items-center gap-2 rounded-md bg-white px-3 text-xs ring-1 ring-base-200 shadow-sm", className)}>
      <Search className="size-3.5 shrink-0 text-base-400" />
      <span className="sr-only">Brief:</span>
      <span className="truncate text-base-900">{query}</span>
      {typing && <span aria-hidden="true" className="-ml-1.5 h-3.5 w-px shrink-0 bg-base-900" />}
    </div>
  );
}

export function Tag({ children, className }: { children: string; className?: string }) {
  return <span className={cx("rounded-md bg-white px-2 py-1 text-xs text-base-900 ring-1 ring-base-200", className)}>{children}</span>;
}
