"use client";

// Small pieces of Curatit's UI shared by the How it works illustrations
import {
  useContext,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
} from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Icon, Search } from "@/components/glaze/icon";
import { Badge } from "@/components/glaze/ui/badge";
import { SegmentedControl, SegmentedControlItem } from "@/components/glaze/ui/segmented-control";
import { cx } from "@/lib/cx";
import { briefs } from "./demo";
import { BelowFold } from "./HydrateOnView";
import { markSeen, seen } from "./useIntroOnce";

// Shared easing for the illustrations' entrances
export const easeOut = [0.32, 0.72, 0, 1] as const;

// Intro: the first time an illustration scrolls into view, its pieces arrive one after
// another, once per session. Spread useIntro() on the root motion element and give each piece
// a variant. The server HTML is the finished illustration, and the pieces are hidden to play
// in only while their section is below the fold as it comes alive (BelowFold in HydrateOnView):
// a visitor who can already see the cards (a link to How it works, a refresh partway down, a
// fast fling) never watches them blink out and fade back. Decided once, at the first render,
// because that's the only time framer-motion reads `initial`.
const INTRO_KEY = "curatit:how-it-works-intro";
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
  const belowFold = useContext(BelowFold);
  const [armed] = useState(
    () => !reduceMotion && !seen(INTRO_KEY) && belowFold(),
  );
  return armed
    ? {
        variants: introContainer,
        initial: "hidden" as const,
        whileInView: "shown" as const,
        viewport: { once: true, amount: 0.35 },
        onViewportEnter: () => markSeen(INTRO_KEY),
      }
    : {};
}

// Calls onTick every `interval` ms while the illustration is on screen. Stops for good
// once the visitor takes over (call stop()), and never runs with reduced motion.
export function useLoop<T extends HTMLElement>(
  interval: number,
  onTick: () => void,
) {
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

// Plays a scripted demo on a loop while it's on screen (McpDemo, DnaDemo): `script` lists
// [ms into the cycle, step], and the server HTML is `rest`, so the first cycle starts `hold` ms
// before its end. It pauses while the pointer is over the demo, focus is inside it or the tab is
// hidden, and picks up where it stopped (like SearchReel on /agents); it never runs under
// reduced motion. A pause that comes during a `busy` step (one that keeps time of its own, like
// McpDemo's search clock) waits for the next step outside it, so that beat always plays whole.
// Put `ref` and `handlers` on the demo's root.
export function useScript<S, T extends HTMLElement = HTMLDivElement>(
  script: [number, S][],
  {
    cycle,
    hold,
    rest,
    busy,
  }: { cycle: number; hold: number; rest: S; busy?: (step: S) => boolean },
) {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(rest);
  const [pointer, setPointer] = useState(false);
  const [focus, setFocus] = useState(false);
  const [hidden, setHidden] = useState(false);
  // How far into the cycle the loop has got, so a pause picks up where it stopped
  const position = useRef(cycle - hold);

  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const paused = !inView || pointer || focus || hidden;
  const playing = !reduceMotion && (!paused || (busy?.(step) ?? false));
  useEffect(() => {
    if (!playing) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const from = position.current;
    const started = performance.now();
    const run = (offset: number) => {
      for (const [at, next] of script) {
        if (at >= offset)
          timers.push(setTimeout(() => setStep(next), at - offset));
      }
      timers.push(setTimeout(() => run(0), cycle - offset));
    };
    run(from);
    return () => {
      timers.forEach(clearTimeout);
      position.current = (from + performance.now() - started) % cycle;
    };
  }, [playing, script, cycle]);

  const handlers = {
    onPointerEnter: () => setPointer(true),
    onPointerLeave: () => setPointer(false),
    onFocus: () => setFocus(true),
    onBlur: (event: FocusEvent<T>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false);
    },
  };
  return { ref, step, handlers };
}

// Types `text` out a character at a time whenever it changes (not on first render). The count
// resets in the same render as the text, so the new text never shows whole for a frame first
// (nor the results waiting on `done`)
export function useTyped(text: string, enabled: boolean) {
  const [count, setCount] = useState(text.length);
  const [previous, setPrevious] = useState(text);
  if (previous !== text) {
    setPrevious(text);
    setCount(enabled ? 0 : text.length);
  }

  useEffect(() => {
    if (count >= text.length) return;
    const timer = setTimeout(() => setCount((current) => current + 1), 24);
    return () => clearTimeout(timer);
  }, [count, text]);

  return { typed: text.slice(0, count), done: count >= text.length };
}

// The example briefs as Glaze's SegmentedControl (2026-10-24): the small size, filling the card's
// width with the three briefs sharing it. Arrow keys move and pick, as on the real control
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
    <SegmentedControl
      aria-label="Try a brief"
      size="sm"
      fill
      value={String(active)}
      onValueChange={(value) => onChange(Number(value))}
      className={className}
    >
      {briefs.map((option, i) => (
        <SegmentedControlItem key={option.label} value={String(i)}>
          {option.label}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}

// The search field with a brief in it, drawn on Glaze's field recipe (the hairline pill on paper,
// the small control's height, the icon leading in text-3). While `typing`, a caret follows the
// text. A drawing, not a field: nothing can be typed into it.
export function QueryField({
  query,
  typing = false,
  className,
}: {
  query: string;
  typing?: boolean;
  className?: string;
}) {
  return (
    <div className={cx("field [--field-h:var(--control-sm)]", className)}>
      <Icon icon={Search} size={12} className="text-text-3" />
      <span className="sr-only">Brief:</span>
      <span className="truncate">{query}</span>
      {typing && <span aria-hidden="true" className="-ml-1.5 h-3.5 w-px shrink-0 bg-ink" />}
    </div>
  );
}

// A matched term: Glaze's outline Badge, a label of what the post is
export function Tag({ children, className }: { children: string; className?: string }) {
  return (
    <Badge variant="outline" className={className}>
      {children}
    </Badge>
  );
}
