"use client";

import { useRef, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import type { LandingLibrary } from "@/lib/services/creatives";
import ClosingCta from "./ClosingCta";
import Details from "./Details";
import FeatureRows from "./FeatureRows";
import Hero from "./Hero";
import LandingFaq from "./LandingFaq";
import LibraryShowcase from "./LibraryShowcase";
import ScrollCards from "./ScrollCards";
import SectionTwo from "./SectionTwo";

/**
 * Landing page. The hero cards deal out of a deck, then follow the scroll into
 * Section 2's cascade. Below that, sections show the real product: visitor-driven
 * demos, the library itself, and the details that make it safe to share.
 */
export default function Landing({
  signedIn,
  nav,
  library,
}: {
  signedIn: boolean;
  nav: ReactNode;
  library: LandingLibrary;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={containerRef}
        className="relative bg-surface"
        // `clip` (not `hidden`) stops the cascade's right edge from causing a
        // horizontal scrollbar without creating a new scroll container.
        style={{ overflowX: "clip" }}
      >
        {nav}
        <ScrollCards containerRef={containerRef} />
        <Hero signedIn={signedIn} />
        <SectionTwo signedIn={signedIn} />
        <FeatureRows library={library} signedIn={signedIn} />
        <Details />
        <LibraryShowcase library={library} signedIn={signedIn} />
        <LandingFaq />
        <ClosingCta library={library} signedIn={signedIn} />
      </div>
    </MotionConfig>
  );
}
