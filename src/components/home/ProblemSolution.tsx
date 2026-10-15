"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import LibraryWindow from "./LibraryWindow";
import Scattered from "./Scattered";
import { cx } from "@/lib/cx";

/*
 * Problem → solution, "Reveal" (chosen from a six-way prototype on 2026-10-15, replacing the
 * pinned scroll that crossfaded the mess into the library): one stage on a grey mat holds
 * both, and the visitor drags a divider (or arrows it across) to uncover Curatit. Nothing
 * moves unless they do, and the page scrolls like any other.
 */

// Where the divider starts (percent from the left); the library is the right side
const START = 72;
const GLIDE_MS = 450;

export default function ProblemSolution() {
  const [x, setX] = useState(START);
  const stage = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  // While a label slides the divider, the clip and the handle tween; dragging is instant
  const [gliding, setGliding] = useState(false);
  const glideTo = (value: number) => {
    setGliding(true);
    setX(value);
    window.setTimeout(() => setGliding(false), GLIDE_MS);
  };

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
        {/* The two sides named above the stage, so nothing sits on the scene itself */}
        <div className="mt-10 flex items-center justify-between text-xs font-medium lg:mt-14">
          <button
            type="button"
            onClick={() => glideTo(100)}
            aria-label="Show the mess only"
            className="min-h-11 rounded-md px-2 text-base-600 transition-colors duration-150 hover:text-base-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-400"
          >
            <span className="rounded-md bg-base-100 px-2 py-1">Your Tuesday</span>
          </button>
          <button
            type="button"
            onClick={() => glideTo(0)}
            aria-label="Show Curatit only"
            className="min-h-11 rounded-md px-2 transition-transform duration-150 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-400"
          >
            <span className="rounded-md bg-accent-600 px-2 py-1 text-paper">Curatit</span>
          </button>
        </div>
        <div
          ref={stage}
          className="relative mt-3 aspect-4/5 overflow-hidden rounded-lg bg-base-50 select-none sm:aspect-7/5 [touch-action:none]"
          style={{ "--x": `${x}%` } as CSSProperties}
          onPointerDown={(e) => {
            dragging.current = true;
            setGliding(false);
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
          <div
            className={cx("absolute inset-0 bg-base-50", gliding && "transition-[clip-path] duration-450 ease-out")}
            style={{ clipPath: "inset(0 0 0 var(--x))" }}
            aria-hidden={x === 100}
          >
            <LibraryWindow className="absolute inset-x-4 top-4 -bottom-4 sm:inset-x-8 sm:top-8 sm:-bottom-8" />
          </div>
          <div className={cx("absolute inset-y-0 w-px bg-accent-600", gliding && "transition-[left] duration-450 ease-out")} style={{ left: "var(--x)" }} aria-hidden="true" />
          {/* The divider's handle: a slider for the keyboard, a grip for the pointer */}
          <button
            type="button"
            role="slider"
            aria-label="Reveal the same brief in Curatit"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={x}
            aria-valuetext={`${100 - x}% Curatit`}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") setX((v) => Math.min(100, v + 5));
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") setX((v) => Math.max(0, v - 5));
              if (e.key === "Home") setX(0);
              if (e.key === "End") setX(100);
            }}
            className={cx(
              "absolute top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-accent-600 text-paper shadow active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-400",
              gliding ? "transition-[left,transform] duration-450 ease-out" : "transition-transform duration-150"
            )}
            style={{ left: "var(--x)" }}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
            </svg>
          </button>
        </div>
      </Wrapper>
    </section>
  );
}
