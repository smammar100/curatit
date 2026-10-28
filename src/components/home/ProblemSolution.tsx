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
// Glaze
import { ChevronSort, Icon } from "@/components/glaze/icon";
import { Button } from "@/components/glaze/ui/button";
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
 * Since 2026-10-24 on Glaze: the two labels above the stage are its Buttons (the flat secondary
 * for the mess, the ink primary for Curatit; Glaze has no brand accent), the stage is its grey
 * shell with the shell corner, and the divider is the ink: its line, and a handle that is the ink
 * glass icon Button keeping its slider role, with Glaze's ink focus ring.
 */

// Where the divider starts (percent from the left); the library is the right side
const START = 72;
// A label's glide is something already on screen moving across it, so it eases in and out
// (Glaze's overlay tier, 240ms on its ease-out)
const GLIDE_MS = 240;
const GLIDE = "duration-(--dur-overlay) ease-out motion-reduce:transition-none";

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
          <Text tag="h2" variant="h1" className="text-text-1">
            <span className="block text-text-2">
              Stop searching for examples.
            </span>
            <span className="block">Start with Curatit&apos;s collection.</span>
          </Text>
          <Text
            tag="p"
            variant="body"
            className="mx-auto mt-4 max-w-xl text-text-2"
          >
            No more looking through saved posts and screenshots. Search for the
            post you need and save what's useful.
          </Text>
        </div>
        {/* The two sides named above the stage, so nothing sits on the scene itself */}
        <div className="mt-10 flex items-center justify-between lg:mt-14">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => glideTo(100)}
            aria-label="Saved posts and screenshots: show this side only"
          >
            Saved posts and screenshots
          </Button>
          <Button
            size="sm"
            onClick={() => glideTo(0)}
            aria-label="Curatit: show this side only"
          >
            Curatit
          </Button>
        </div>
        {/* overflow-clip, not hidden: a clipped box isn't a scroll container, so focusing the
            handle while it hangs over an edge (0 or 100) can't scroll the whole stage sideways.
            On touch (2026-10-28, from a QA run: the stage took over half a phone's screen and
            swallowed every swipe) vertical swipes stay the page's (touch-pan-y; the browser
            cancels the pointer when it scrolls), and a touch moves the divider only once it moves
            sideways, so resting a thumb on the scene doesn't jump it */}
        <div
          ref={stage}
          className="relative mt-3 aspect-4/5 touch-pan-y overflow-clip rounded-(--radius-float) bg-shell select-none sm:aspect-7/5"
          style={{ "--x": `${x}%` } as CSSProperties}
          onPointerDown={(e) => {
            dragging.current = true;
            stopGlide();
            e.currentTarget.setPointerCapture(e.pointerId);
            if (e.pointerType !== "touch") place(e);
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
              hide the mess under it, and the shell is opaque, so it's the stage's own colour */}
          <div
            className={cx(
              "absolute inset-0 bg-shell [clip-path:inset(0_0_0_var(--x))]",
              gliding && cx("transition-[clip-path]", GLIDE),
            )}
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
              "pointer-events-none absolute inset-0 translate-x-(--x)",
              gliding && cx("transition-[translate]", GLIDE),
            )}
          >
            <div className="absolute inset-y-0 left-0 w-px bg-ink" aria-hidden="true" />
            {/* The divider's handle: a slider for the keyboard, a grip for the pointer. Placed by
                a wrapper, so the Button keeps its own classes */}
            <span className="pointer-events-auto absolute top-1/2 left-0 flex -translate-x-1/2 -translate-y-1/2 touch-none">
              <Button
                size="icon-lg"
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
                className="cursor-ew-resize"
              >
                {/* Two carets, one each way: the up-down caret turned on its side */}
                <Icon icon={ChevronSort} className="rotate-90" />
              </Button>
            </span>
          </div>
        </div>
      </Wrapper>
    </section>
  );
}
