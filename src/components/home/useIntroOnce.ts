"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

// idle: server render, shows the finished state. armed: hidden, waiting to scroll into view.
// play: running. done: finished, no animation.
export type IntroState = "idle" | "armed" | "play" | "done";

// sessionStorage can be unavailable (private mode, blocked storage); the intro then plays again next time
export const seen = (key: string) => {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};
export const markSeen = (key: string) => {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // Nothing to do; see above
  }
};

// Plays an intro once per session, the first time the element scrolls into view.
// Reduced motion skips straight to the finished state, and so does an element already on
// screen as it mounts (a refresh partway down, a link into the page, a fast fling): the server
// HTML is the finished state, and hiding what the visitor already sees would blink it out and
// pop it back. Decided in a layout effect, so not even one frame is painted before it.
export function useIntroOnce<T extends Element>(key: string, amount = 0.35) {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, amount });
  const reduceMotion = useReducedMotion();
  const [intro, setIntro] = useState<IntroState>("idle");

  useLayoutEffect(() => {
    const top = ref.current?.getBoundingClientRect().top ?? 0;
    setIntro(
      !reduceMotion && !seen(key) && top >= window.innerHeight
        ? "armed"
        : "done",
    );
  }, [key, reduceMotion]);

  useEffect(() => {
    if (intro !== "armed" || !inView) return;
    setIntro("play");
    markSeen(key);
  }, [intro, inView, key]);

  const finish = useCallback(() => setIntro("done"), []);

  return { ref, intro, finish };
}
