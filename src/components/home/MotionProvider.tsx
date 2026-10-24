"use client";

import type { ReactNode } from "react";
import { LazyMotion } from "framer-motion";

// Homepage components animate with the lightweight `m` element; the animation engine
// itself arrives as a separate chunk, so it stays out of the JavaScript the page needs
// to become interactive. Each lazy section (islands.tsx) gets its own provider, so even
// this much of framer-motion only loads with the first section that scrolls into view.
// Not `strict` since 2026-10-23: the design system's components (Fluid Functionalism's, in
// src/components/ui) render `motion.*` themselves, and a Segmented or a Switch inside a section
// would otherwise throw; the `m` elements here still load the engine lazily.
const loadFeatures = () =>
  import("./motion-features").then((module) => module.default);

export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures}>
      {children}
    </LazyMotion>
  );
}
