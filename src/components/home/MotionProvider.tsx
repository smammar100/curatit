"use client";

import type { ReactNode } from "react";
import { LazyMotion } from "framer-motion";

// Homepage components animate with the lightweight `m` element; the animation engine
// itself arrives as a separate chunk, so it stays out of the JavaScript the page needs
// to become interactive. Each lazy section (islands.tsx) gets its own provider, so even
// this much of framer-motion only loads with the first section that scrolls into view.
// `strict` turns any stray `motion.*` into an error.
const loadFeatures = () => import("./motion-features").then((module) => module.default);

export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
