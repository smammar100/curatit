/** Design tokens and choreography constants for the landing page. */

export type Bezier = [number, number, number, number];

export const smoothEase: Bezier = [0.22, 1, 0.36, 1];
export const hoverEase: Bezier = [0.34, 1.56, 0.64, 1];
/** Spring for the hero deal-out: quick, with a small settle. */
export const dealSpring = { type: "spring", stiffness: 260, damping: 28, mass: 0.9 } as const;

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

export const CARD_SIZE = 200;
/** Vertical centre of the hero card row at desktop sizes. */
export const HERO_ROW_Y = 522;

export type Slot = { x: number; y: number; rotate: number; scale: number; z: number };

/**
 * Section 1 fan, relative to the viewport centre (x) and the hero row (y).
 * Tight overlap in a shallow arc; cards to the right sit on top. Slot 6 holds
 * the lead card, which forms the top of the deck.
 */
export const fanSlots: Slot[] = [
  { x: -390, y: 14, rotate: -9, scale: 1, z: 1 },
  { x: -260, y: 6, rotate: -6, scale: 1, z: 2 },
  { x: -130, y: 2, rotate: -3, scale: 1, z: 3 },
  { x: 0, y: 0, rotate: 0, scale: 1, z: 4 },
  { x: 130, y: 2, rotate: 3, scale: 1, z: 5 },
  { x: 260, y: 6, rotate: 6, scale: 1, z: 6 },
  { x: 390, y: 14, rotate: 9, scale: 1, z: 7 },
];

/** Index of the lead card (top of the deck, ends in the rightmost slot). */
export const LEAD = 6;

/** Section 2 diagonal ladder, upper-left to lower-right. Leftmost on top. */
export const cascade = Array.from({ length: 7 }, (_, i) => ({
  top: 300 + i * 70,
  left: 20 + i * 150,
  rotate: -3 + i * 3,
  z: 7 - i,
}));

/**
 * Card artwork from the qclay.design "Pallet" concept.
 * Third-party work: replace it, or get permission, before a public launch.
 */
export const cardImages = Array.from({ length: 7 }, (_, i) => `/landing/card-${i + 1}.png`);

/** Squash-and-stretch pop used by the chat-style tags. */
export const jelly = {
  opacity: [0, 1],
  scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
  scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1],
};


export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
