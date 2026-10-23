"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
// Fundation
import Button from "@/components/fundations/elements/Button";
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
 *
 * Since 2026-10-23 the two labels above the stage are the system's Buttons (the tinted muted
 * one for the mess, the accent one for Curatit), the stage is a mat with the container corner,
 * and the divider's handle keeps its slider role on the brand's solid with the one focus ring.
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
          <Text tag="h2" variant="h1" className="text-foreground">
            <span className="block text-muted-foreground">
              Stop hunting for examples.
            </span>
            <span className="block">Start with Curatit&apos;s collection.</span>
          </Text>
          <Text
            tag="p"
            variant="body"
            className="text-muted-foreground mt-4 max-w-xl mx-auto"
          >
            No more digging through saved posts and screenshots. Search for the
            post you need and save what's useful.
          </Text>
        </div>
        {/* The two sides named above the stage, so nothing sits on the scene itself */}
        <div className="mt-10 flex items-center justify-between lg:mt-14">
          <Button
            variant="muted"
            size="sm"
            onClick={() => glideTo(100)}
            aria-label="Show the mess only"
          >
            Saved posts and screenshots
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={() => glideTo(0)}
            aria-label="Show Curatit only"
          >
            Curatit
          </Button>
        </div>
        {/* overflow-clip, not hidden: a clipped box isn't a scroll container, so focusing the
            handle while it hangs over an edge (0 or 100) can't scroll the whole stage sideways */}
        <div
          ref={stage}
          className="relative mt-3 aspect-4/5 overflow-clip rounded-[24px] bg-card select-none sm:aspect-7/5 [touch-action:none]"
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
          {/* The library, on the same mat, clipped to the right of the divider. The layer has to
              hide the mess under it, and bg-card is a tint, so it's the page's colour with the
              mat's tint over it (::before): the stage's own colour, opaque, in both themes */}
          <div
            className={cx(
              "absolute inset-0 bg-background before:absolute before:inset-0 before:bg-card",
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
              className="absolute inset-y-0 left-0 w-px bg-brand-solid"
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
              className="pointer-events-auto absolute top-1/2 left-0 flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-brand-solid text-on-brand-solid-foreground shadow-surface-3 transition-[scale] duration-150 ease-out-quint motion-safe:active:scale-[0.96] focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
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
