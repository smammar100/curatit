"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { m, useInView, useReducedMotion } from "framer-motion";
import { cx } from "@/lib/cx";

/*
 * A reel of app-icon tiles that advance through five slots laid out on a
 * shallow arc: small and soft at the ends, full size in the middle. One tile
 * moves on every beat while the reel is on screen; the rest wait their turn
 * hidden beyond the ends. Reduced motion holds the reel still. A tile is an app icon: the
 * container corner (24px) and the ladder's card shadow (2026-10-23).
 */

const SIZE = 96; // tile size at the middle slot, px
const SLOTS = 5;
const BEAT = 1800; // ms between steps
const MIN_POOL = 7; // visible slots plus the hidden entry and exit positions

// Slot geometry for a vertical reel on the left of the text, as tile centres in a 140×320 box.
// The middle tile sits furthest from the text, so the arc bows outward.
const BOX = { short: 140, long: 320 };
const CENTRES = [
  [70, 36],
  [50, 92],
  [36, 160],
  [50, 228],
  [70, 284],
];
const SCALES = [0.73, 0.84, 1, 0.84, 0.73];
const BLURS = [2.75, 0, 0, 0, 2.75];

type Orientation = "vertical" | "horizontal";
// `near` is the side of the box that faces the text
type Near = "start" | "end";

function slotStyle(virtual: number, orientation: Orientation, near: Near) {
  // Entry (-1) and exit (5) positions continue the arc past the ends, hidden
  const index = Math.min(Math.max(virtual, 0), SLOTS - 1);
  let [cx, cy] = CENTRES[index];
  if (virtual < 0) cy = CENTRES[0][1] - (CENTRES[1][1] - CENTRES[0][1]);
  if (virtual >= SLOTS)
    cy =
      CENTRES[SLOTS - 1][1] + (CENTRES[SLOTS - 1][1] - CENTRES[SLOTS - 2][1]);
  const hidden = virtual < 0 || virtual >= SLOTS;
  const scale = hidden ? 0.6 : SCALES[index];
  const blur = hidden ? BLURS[0] : BLURS[index];
  // CENTRES assume the text is on the right ("end"); mirror across the short axis otherwise
  if (near === "start") cx = BOX.short - cx;
  const [x, y] = orientation === "vertical" ? [cx, cy] : [cy, cx];
  return {
    x: x - SIZE / 2,
    y: y - SIZE / 2,
    scale,
    opacity: hidden ? 0 : 1,
    filter: `blur(${blur}px)`,
  };
}

export default function LogoReel({
  items,
  orientation = "vertical",
  near = "end",
  // Offsets the beat so reels on the page don't all step at once
  phase = 0,
  className,
}: {
  items: ReactNode[];
  orientation?: Orientation;
  near?: Near;
  phase?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduceMotion = useReducedMotion();
  const [offset, setOffset] = useState(0);

  // Pad short lists so there is always something waiting beyond the ends
  const pool =
    items.length >= MIN_POOL
      ? items
      : Array.from({ length: MIN_POOL }, (_, i) => items[i % items.length]);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      setOffset((o) => o + 1);
      interval = setInterval(() => setOffset((o) => o + 1), BEAT);
    }, phase);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [inView, reduceMotion, phase]);

  const n = pool.length;
  const width = orientation === "vertical" ? BOX.short : BOX.long;
  const height = orientation === "vertical" ? BOX.long : BOX.short;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cx("relative shrink-0 select-none", className)}
      style={{ width, height }}
    >
      {pool.map((item, i) => {
        // Tiles advance from the last slot to the first; -1 and 5 are the hidden entry and exit positions
        let virtual = (((i - offset) % n) + n) % n;
        if (virtual === n - 1) virtual = -1;
        if (virtual > SLOTS) return null;
        return (
          <m.div
            key={i}
            className="absolute top-0 left-0 overflow-hidden rounded-[24px] shadow-surface-2"
            style={{ width: SIZE, height: SIZE }}
            initial={false}
            animate={slotStyle(virtual, orientation, near)}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {item}
          </m.div>
        );
      })}
    </div>
  );
}
