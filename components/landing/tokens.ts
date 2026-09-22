/** Design tokens and choreography constants for the landing page. */

export type Bezier = [number, number, number, number];

export const smoothEase: Bezier = [0.22, 1, 0.36, 1];
export const hoverEase: Bezier = [0.34, 1.56, 0.64, 1];

/** Carbon theme colours (see app/globals.css), so the landing follows the palette. */
export const colors = {
  page: "var(--color-white)",
  ink: "var(--color-base-900)",
  dark: "var(--color-base-800)",
  accent: "var(--color-accent-600)",
  accentSoft: "var(--color-accent-500)",
  eyebrow: "var(--color-base-500)",
  body: "var(--color-base-600)",
} as const;

export const CARD_SIZE = 220;
/** Vertical centre of the hero card row at desktop sizes. */
export const HERO_ROW_Y = 522;

export type Slot = { x: number; y: number; rotate: number; scale: number; z: number };

/** Section 1 fan, relative to the viewport centre (x) and HERO_ROW_Y (y). */
export const fanSlots: Slot[] = [
  { x: -480, y: 18, rotate: -18, scale: 0.88, z: 1 },
  { x: -310, y: 6, rotate: -10, scale: 0.92, z: 2 },
  { x: -155, y: -2, rotate: -4, scale: 0.96, z: 3 },
  { x: 0, y: -8, rotate: 0, scale: 1, z: 4 },
  { x: 160, y: -2, rotate: 5, scale: 0.96, z: 3 },
  { x: 320, y: 6, rotate: 12, scale: 0.92, z: 2 },
  { x: 480, y: 18, rotate: 20, scale: 0.88, z: 1 },
];

/** Section 2 diagonal ladder, upper-left to lower-right. Leftmost on top. */
export const cascade = Array.from({ length: 7 }, (_, i) => ({
  top: 300 + i * 70,
  left: 20 + i * 150,
  rotate: -3 + i * 3,
  z: 7 - i,
}));

/**
 * Card and banner artwork from qclay.design's "Pallet" concept.
 * Third-party work: replace it, or get permission, before a public launch.
 */
export const cardImages = Array.from({ length: 7 }, (_, i) => `/landing/card-${i + 1}.png`);
export const bannerImages = [1, 2, 3].map((n) => `/landing/banner-${n}.png`);

/** Squash-and-stretch pop used by the chat-style tags. */
export const jelly = {
  opacity: [0, 1],
  scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
  scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1],
};

function cubic(a: number, b: number, t: number) {
  // One axis of a cubic bezier with endpoints 0 and 1.
  const u = 1 - t;
  return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
}

/**
 * Invert an easing curve: at what fraction of the animation's *time* does it
 * reach `progress`? Used to reveal each fan card exactly as the lead card
 * sweeps past it.
 */
export function getTimeForProgress(progress: number, [x1, y1, x2, y2]: Bezier) {
  const target = Math.min(1, Math.max(0, progress));
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (cubic(y1, y2, mid) < target) lo = mid;
    else hi = mid;
  }
  return cubic(x1, x2, (lo + hi) / 2);
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
