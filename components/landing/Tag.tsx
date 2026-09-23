"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, type MotionProps } from "framer-motion";
import { fontWeights } from "@/lib/font-weight";

type Tail = { side: "left" | "right" | "center"; offset?: number; near: number; far: number };

/**
 * Chat-bubble label with a small triangular tail, used for the floating
 * taxonomy tags. `tail.near`/`far` are the tail's two border widths.
 */
export default function Tag({
  color,
  ink = "var(--background)",
  children,
  className = "",
  style,
  padding = "8px 18px",
  fontSize = 15,
  tail,
  motionProps,
}: {
  color: string;
  /** Text colour on the bubble; pair `ink` with `colors.onInk`, `brand` with `colors.onBrand`. */
  ink?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  padding?: string;
  fontSize?: number;
  tail: Tail;
  motionProps?: MotionProps;
}) {
  const tailStyle: CSSProperties = {
    position: "absolute",
    bottom: -9,
    width: 0,
    height: 0,
    borderTop: `10px solid ${color}`,
    ...(tail.side === "center"
      ? { left: "50%", transform: "translateX(-50%)", borderLeft: `${tail.near}px solid transparent`, borderRight: `${tail.far}px solid transparent` }
      : tail.side === "left"
        ? { left: tail.offset ?? 16, borderLeft: `${tail.near}px solid transparent`, borderRight: `${tail.far}px solid transparent` }
        : { right: tail.offset ?? 16, borderLeft: `${tail.far}px solid transparent`, borderRight: `${tail.near}px solid transparent` }),
  };

  return (
    <motion.div className={`absolute whitespace-nowrap ${className}`} style={style} {...motionProps}>
      <div
        className="relative rounded-full"
        style={{ background: color, color: ink, padding, fontSize, fontVariationSettings: fontWeights.medium }}
      >
        {children}
        <span aria-hidden="true" style={tailStyle} />
      </div>
    </motion.div>
  );
}
