"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import LibraryWindow from "./LibraryWindow";
import Scattered from "./Scattered";

/*
 * Problem → solution, "Reveal" (chosen from a six-way prototype on 2026-10-15, replacing the
 * pinned scroll that crossfaded the mess into the library): one stage on a grey mat holds
 * both, and the visitor drags a divider (or arrows it across) to uncover Curatit. Nothing
 * moves unless they do, and the page scrolls like any other.
 */

const START = 28;

export default function ProblemSolution() {
  const [x, setX] = useState(START);
  const stage = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const place = (event: PointerEvent) => {
    const rect = stage.current?.getBoundingClientRect();
    if (!rect) return;
    setX(Math.round(Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100))));
  };

  return (
    <section className="section-y">
      <Wrapper variant="standard">
        <div className="text-balance max-w-3xl mx-auto text-center">
          <Text tag="h2" variant="displayLG" className="text-base-900 font-display font-thin">
            <span className="block text-base-500">You saved it. Somewhere.</span>
            <span className="block">Now it&apos;s one search away.</span>
          </Text>
          <Text tag="p" variant="textBase" className="text-base-600 mt-4 max-w-xl mx-auto">
            Every brief starts in the same mess: the camera roll, a Slack thread, a spreadsheet of links. Drag the line to see the same brief in
            Curatit.
          </Text>
        </div>
        <div
          ref={stage}
          className="relative mt-10 aspect-4/5 overflow-hidden rounded-lg bg-base-50 select-none sm:aspect-7/5 [touch-action:none] lg:mt-14"
          style={{ "--x": `${x}%` } as CSSProperties}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            place(e);
          }}
          onPointerMove={(e) => dragging.current && place(e)}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
        >
          <Scattered className="absolute inset-0" />
          {/* The library, on the same mat, clipped to the right of the divider */}
          <div className="absolute inset-0 bg-base-50" style={{ clipPath: "inset(0 calc(100% - var(--x)) 0 0)" }} aria-hidden={x === 0}>
            <LibraryWindow className="absolute inset-x-4 top-4 -bottom-4 sm:inset-x-8 sm:top-8 sm:-bottom-8" />
          </div>
          <div className="absolute inset-y-0 w-px bg-base-900" style={{ left: "var(--x)" }} aria-hidden="true" />
          {/* The divider's handle: a slider for the keyboard, a grip for the pointer */}
          <button
            type="button"
            role="slider"
            aria-label="Reveal the same brief in Curatit"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={x}
            aria-valuetext={`${x}% Curatit`}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") setX((v) => Math.min(100, v + 5));
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") setX((v) => Math.max(0, v - 5));
              if (e.key === "Home") setX(0);
              if (e.key === "End") setX(100);
            }}
            className="absolute top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-base-900 text-white shadow transition-transform duration-150 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-400"
            style={{ left: "var(--x)" }}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
            </svg>
          </button>
          <span className="pointer-events-none absolute top-4 left-4 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-base-900 ring-1 ring-base-200">
            Your Tuesday
          </span>
          <span className="pointer-events-none absolute top-4 right-4 rounded-md bg-base-900 px-2 py-1 text-xs font-medium text-white">Curatit</span>
        </div>
      </Wrapper>
    </section>
  );
}
