"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

// idle: server render, shows the finished state. armed: hidden, waiting to scroll into view.
// play: running. done: finished, no animation.
export type IntroState = "idle" | "armed" | "play" | "done";

// sessionStorage can be unavailable (private mode, blocked storage); the intro then plays again next time
const seen = (key: string) => {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};
const markSeen = (key: string) => {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // Nothing to do; see above
  }
};

// Plays an intro once per session, the first time the element scrolls into view.
// Reduced motion skips straight to the finished state.
export function useIntroOnce<T extends Element>(key: string, amount = 0.35) {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, amount });
  const reduceMotion = useReducedMotion();
  const [intro, setIntro] = useState<IntroState>("idle");

  useEffect(() => {
    setIntro(reduceMotion || seen(key) ? "done" : "armed");
  }, [key, reduceMotion]);

  useEffect(() => {
    if (intro !== "armed" || !inView) return;
    setIntro("play");
    markSeen(key);
  }, [intro, inView, key]);

  const finish = useCallback(() => setIntro("done"), []);

  return { ref, intro, finish };
}
