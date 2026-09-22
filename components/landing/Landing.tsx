"use client";

import { useRef, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import Hero from "./Hero";
import ScrollCards from "./ScrollCards";
import SectionThree from "./SectionThree";
import SectionTwo from "./SectionTwo";
import { colors } from "./tokens";

/** Soft grey blobs fixed behind everything. */
function Blobs() {
  const soft = "radial-gradient(circle, rgba(180,180,180,0.12) 0%, transparent 70%)";
  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }} aria-hidden="true">
      <div className="absolute" style={{ top: "5%", left: "8%", width: 300, height: 300, background: soft, filter: "blur(40px)" }} />
      <div className="absolute" style={{ top: "8%", right: "10%", width: 250, height: 250, background: soft, filter: "blur(40px)" }} />
      <div
        className="absolute"
        style={{
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 400,
          background: "radial-gradient(circle, rgba(160,160,160,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
    </div>
  );
}

/**
 * Scroll-driven landing page: three full-height sections in one container,
 * with a global card overlay that travels from the hero fan into the
 * Section 2 cascade.
 */
export default function Landing({ signedIn, nav }: { signedIn: boolean; nav: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={containerRef}
        className="relative"
        // `clip` (not `hidden`) stops the cascade's right edge from causing a
        // horizontal scrollbar without creating a new scroll container.
        style={{ background: colors.page, overflowX: "clip" }}
      >
        <Blobs />
        {nav}
        <ScrollCards containerRef={containerRef} />
        <Hero signedIn={signedIn} />
        <SectionTwo signedIn={signedIn} />
        <SectionThree signedIn={signedIn} />
      </div>
    </MotionConfig>
  );
}
