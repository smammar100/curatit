"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
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
// A label's glide is something already on screen moving across it, so it eases in and out
const GLIDE_MS = 400;
const GLIDE = "duration-400 ease-in-out-quart motion-reduce:transition-none";

export default function ProblemSolution() {
  const [x, setX] = useState(START);
  const stage = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  // While a label slides the divider, the clip and the divider tween; dragging and the arrow
  // keys are instant
  const [gliding, setGliding] = useState(false);
  const glideTimer = useRef(0);
  const stopGlide = () => {
    window.clearTimeout(glideTimer.current);
    setGliding(false);
  };
  const glideTo = (value: number) => {
    setGliding(true);
    setX(value);
    // A second label pressed mid-glide restarts the clock, so the first can't cut it short
    window.clearTimeout(glideTimer.current);
    glideTimer.current = window.setTimeout(() => setGliding(false), GLIDE_MS);
  };
  useEffect(() => () => window.clearTimeout(glideTimer.current), []);

  const place = (event: PointerEvent) => {
    const rect = stage.current?.getBoundingClientRect();
    if (!rect) return;
    setX(
      Math.round(
        Math.min(
          100,
          Math.max(0, ((event.clientX - rect.left) / rect.width) * 100),
        ),
      ),
    );
  };

  return (
    <section className="section-y">
      <Wrapper variant="standard">
        <div className="text-balance max-w-3xl mx-auto text-center">
          <Text tag="h2" variant="displayLG" className="text-base-900">
            <span className="block text-base-500">
              Stop hunting for examples.
            </span>
            <span className="block">Start with Curatit&apos;s collection.</span>
          </Text>
          <Text
            tag="p"
            variant="textBase"
            className="text-base-600 mt-4 max-w-xl mx-auto"
          >
            No more digging through saved posts and screenshots. Search for the
            post you need and save what's useful.
          </Text>
        </div>
        {/* The two sides named above the stage, so nothing sits on the scene itself */}
        <div className="mt-10 flex items-center justify-between text-xs font-medium lg:mt-14">
          <button
            type="button"
            onClick={() => glideTo(100)}
            aria-label="Show the mess only"
            className="min-h-11 rounded-md px-2 text-base-600 transition-[color,scale] duration-150 ease-out-quint hover:text-base-900 motion-safe:active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus"
          >
            <span className="inline-flex h-5 items-center rounded-sm bg-component px-1.5 text-caption-lg">
              Saved posts and screenshots
            </span>
          </button>
          <button
            type="button"
            onClick={() => glideTo(0)}
            aria-label="Show Curatit only"
            className="min-h-11 rounded-md px-2 transition-[scale] duration-150 ease-out-quint motion-safe:active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus"
          >
            <span className="inline-flex h-5 items-center rounded-sm bg-brand-solid px-1.5 text-caption-lg text-on-brand-solid-foreground">
              Curatit
            </span>
          </button>
        </div>
        {/* overflow-clip, not hidden: a clipped box isn't a scroll container, so focusing the
            handle while it hangs over an edge (0 or 100) can't scroll the whole stage sideways */}
        <div
          ref={stage}
          className="relative mt-3 aspect-4/5 overflow-clip rounded-2xl bg-base-50 select-none sm:aspect-7/5 [touch-action:none]"
          style={{ "--x": `${x}%` } as CSSProperties}
          onPointerDown={(e) => {
            dragging.current = true;
            stopGlide();
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
            className={cx(
              "absolute inset-0 bg-base-50",
              gliding && cx("transition-[clip-path]", GLIDE),
            )}
            style={{ clipPath: "inset(0 0 0 var(--x))" }}
            aria-hidden={x === 100}
          >
            <LibraryWindow className="absolute inset-x-4 top-4 -bottom-4 sm:inset-x-8 sm:top-8 sm:-bottom-8" />
          </div>
          {/* The divider: its line and handle ride one full-width layer moved by --x (a
              percentage of the layer's own width is the same percentage of the stage's), so a
              glide moves a transform, not `left`. The layer lets the pointer through to the
              stage; the handle takes it */}
          <div
            className={cx(
              "pointer-events-none absolute inset-0",
              gliding && cx("transition-[translate]", GLIDE),
            )}
            style={{ translate: "var(--x) 0" }}
          >
            <div
              className="absolute inset-y-0 left-0 w-px bg-accent-600"
              aria-hidden="true"
            />
            {/* The divider's handle: a slider for the keyboard, a grip for the pointer */}
            <button
              type="button"
              role="slider"
              aria-label="Reveal the same brief in Curatit"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={x}
              aria-valuetext={`${100 - x}% Curatit`}
              // Instant, even mid-glide, and the keys stay off the page: unhandled, the arrows,
              // Home and End would scroll it as well
              onKeyDown={(e) => {
                const next =
                  e.key === "ArrowRight" || e.key === "ArrowUp"
                    ? Math.min(100, x + 5)
                    : e.key === "ArrowLeft" || e.key === "ArrowDown"
                      ? Math.max(0, x - 5)
                      : e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? 100
                          : null;
                if (next === null) return;
                e.preventDefault();
                stopGlide();
                setX(next);
              }}
              className="pointer-events-auto absolute top-1/2 left-0 flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-accent-600 text-paper shadow transition-[scale] duration-150 ease-out-quint motion-safe:active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
              </svg>
            </button>
          </div>
        </div>
      </Wrapper>
    </section>
  );
}
