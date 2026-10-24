// The hero's corridor of covers. Not a client component: the corridor is CSS keyframes computed
// once at render, and the only hooks (useId, useMemo) run on the server too. That keeps its code
// and the hydration of eighteen animated cards out of the browser's work on the homepage.
//
// Moved here from components/ui/image-stream-hero on 2026-10-24 (Glaze): the shadcn-style vendored
// folder is going away. Everything that was an inline style is now in the generated stylesheet
// below, or a custom property a card sets for it (its rail and its delay), and each card is a
// Glaze well (bg-field) with the faint hairline until its cover fades in.
import * as React from "react";
import DeferredImages from "@/components/global/DeferredImages";
import { cx } from "@/lib/cx";

/* ── the corridor ────────────────────────────────────────────────
 * Two rails of cards ride from far behind the screen toward the
 * viewer. Perspective alone does the work that looks like two
 * animations: as a card's z grows it gets bigger *and* its screen x
 * sweeps outward from the vanishing point, because the projection
 * scales position and size by the same factor.
 *
 * Three things shape it, and each one fixes a specific artefact:
 *
 * 1. Depth is authored as *apparent size*, geometrically: each card
 *    is a constant ratio bigger than the one behind it, all the way
 *    out. Spacing a straight z-range evenly instead makes the near
 *    cards tear apart from each other as the projection blows up.
 * 2. The rails open hard in the first stretch and then hold
 *    (`fan` > 1). That opening cancels the (still slow) growth back
 *    there, so the ribbon leaves the centre as a flat band, bends
 *    once, and only then runs out on the diagonal. Parallel rails
 *    project to a straight cone with no bend at all.
 * 3. Neither end of the loop is ever on screen. A card dies with its
 *    inner edge past 50cqw, clear of the container's edge. And it is
 *    born *across* the axis: `railBirth` is negative, so the newest
 *    card starts on the far side and sweeps back through the centre.
 *    That plugs the throat: the axis stays covered at every instant,
 *    and a newborn lands behind cards that already cover it, so it
 *    needs no fade in. Birthing on its own side instead leaves a hole
 *    at dead centre that blinks open once every cycle.
 *
 * Every length is in `cqw` (a percentage of the container's width),
 * so the whole corridor keeps its proportions at any size. The
 * defaults were fitted numerically against a reference recording's
 * card-height and edge-position profile, not eyeballed.
 * ─────────────────────────────────────────────────────────────── */

/**
 * Geometry of the corridor. Every length is `cqw`, a percentage of the
 * container's width, so the shape is resolution-independent.
 *
 * These interact: the ribbon only stays solid while consecutive cards
 * overlap, which needs `exitHeight / birthHeight` spread over enough
 * `cards`. Raising `exitHeight`, dropping `cards`, or pulling `railExit`
 * in all push toward a visible tear near the frame edge.
 */
export type CorridorPath = {
  /** Strength of the projection. Lower is a wider-angle, more dramatic rush. @default 30 */
  perspective?: number;
  /** Card width in world units. @default 18 */
  cardWidth?: number;
  /** Card height in world units. @default 25 */
  cardHeight?: number;
  /** Corner radius applied to each card. @default 0.4 */
  cardRadius?: number;
  /** On-screen card height at the waist, where a card is born. @default 2.6 */
  birthHeight?: number;
  /** On-screen card height as a card leaves the frame. @default 46 */
  exitHeight?: number;
  /** Lateral offset at birth. Negative starts the card across the axis (note 3 above). @default -11 */
  railBirth?: number;
  /** Lateral offset once the rails have finished opening. @default 44 */
  railExit?: number;
  /** How front-loaded the opening is. >1 opens early then holds. @default 3.3 */
  fan?: number;
  /** Y-rotation at birth, degrees. @default 6 */
  turnBirth?: number;
  /** Y-rotation at exit, degrees. @default 28 */
  turnExit?: number;
  /** Keyframe stops used to trace the curve. Raise only if motion looks faceted. @default 24 */
  stops?: number;
};

const PATH: Required<CorridorPath> = {
  perspective: 30,
  cardWidth: 18,
  cardHeight: 25,
  cardRadius: 0.4,
  birthHeight: 2.6,
  exitHeight: 46,
  railBirth: -11,
  railExit: 44,
  fan: 3.3,
  turnBirth: 6,
  turnExit: 28,
  stops: 24,
};

/** Sample the path once so the CSS keyframes trace the real curve. */
function keyframes(dir: 1 | -1, name: string, p: Required<CorridorPath>) {
  const steps: string[] = [];
  for (let s = 0; s <= p.stops; s++) {
    const u = s / p.stops;
    // Geometric in apparent size, so consecutive cards keep a constant size
    // ratio and the ribbon stays solid at both ends.
    const scale = (p.birthHeight / p.cardHeight) * Math.pow(p.exitHeight / p.birthHeight, u);
    const z = p.perspective * (1 - 1 / scale);
    const rail = p.railExit - (p.railExit - p.railBirth) * Math.pow(1 - u, p.fan);
    const turn = p.turnBirth + (p.turnExit - p.turnBirth) * u;
    steps.push(
      `${(u * 100).toFixed(2)}%{transform:translate3d(${(dir * rail).toFixed(2)}cqw,0,${z.toFixed(2)}cqw) rotateY(${(-dir * turn).toFixed(2)}deg)}`,
    );
  }
  return `@keyframes ${name}{${steps.join("")}}`;
}

export type CorridorImage = {
  src: string;
  /** Optional responsive sources, so small screens load small files. */
  srcSet?: string;
  sizes?: string;
};

export default function Corridor({
  images,
  cards = 9,
  speed = 18,
  axis = 55,
  path,
  className,
}: {
  /**
   * Images cycled onto the rails. Both rails run the same sequence, so the corridor reads as one
   * mirrored stream. Fewer than `cards` simply repeat.
   */
  images: CorridorImage[];
  /**
   * Cards on each rail at once. More cards means a denser corridor, not a faster one: spacing is
   * derived from this and `speed`. Drop it far below the default and consecutive cards grow too
   * fast to stay overlapped near the exit, which tears a gap in the ribbon.
   */
  cards?: number;
  /** Seconds for one card to travel the whole corridor. */
  speed?: number;
  /** Vertical placement of the corridor's axis, as a percentage of height. */
  axis?: number;
  /** Override any part of the corridor geometry. Merged over the defaults. */
  path?: CorridorPath;
  className?: string;
}) {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const right = `ish-r-${id}`;
  const left = `ish-l-${id}`;
  const card = `ish-c-${id}`;
  const stage = `ish-s-${id}`;

  const p = React.useMemo(() => ({ ...PATH, ...path }), [path]);

  // The keyframes, the stage's perspective and every card's place, size and run, written once.
  // A card says which rail it rides and how far into the run it starts (--rail, --delay)
  const css = React.useMemo(
    () =>
      `${keyframes(1, right, p)}${keyframes(-1, left, p)}` +
      `.${stage}{perspective:${p.perspective}cqw;perspective-origin:50% ${axis}%}` +
      `.${stage}>div{transform-style:preserve-3d}` +
      `.${card}{left:50%;top:${axis}%;width:${p.cardWidth}cqw;height:${p.cardHeight}cqw;` +
      `margin-left:${-p.cardWidth / 2}cqw;margin-top:${-p.cardHeight / 2}cqw;border-radius:${p.cardRadius}cqw;` +
      `animation:var(--rail) ${speed}s linear infinite;animation-delay:var(--delay);backface-visibility:hidden}` +
      // Pausing rather than disabling keeps the corridor whole: every card is already dropped
      // mid-flight by its negative delay, so it freezes as a finished still instead of
      // collapsing onto the axis.
      `@media(prefers-reduced-motion:reduce){.${card}{animation-play-state:paused}}`,
    [right, left, card, stage, p, axis, speed],
  );

  return (
    <div className={cx("@container relative overflow-hidden", className)}>
      <style>{css}</style>

      <div aria-hidden className={cx(stage, "pointer-events-none absolute inset-0")}>
        <div className="absolute inset-0">
          {[right, left].map((name) =>
            Array.from({ length: cards }, (_, i) => {
              // Both rails walk the same sequence, so the left side mirrors the right at every depth.
              const img = images[i % Math.max(images.length, 1)];
              return (
                // A well with the faint hairline, so each card reads as a quiet tile until its
                // cover fades in over both (the edge is inset, under the image), and breathes
                // gently while it waits (.corridor-tile in global.css)
                <div
                  key={`${name}-${i}`}
                  className={cx(card, "corridor-tile absolute overflow-hidden bg-field ring-1 ring-line-faint ring-inset")}
                  // A negative delay drops each card mid-flight, so the corridor is full on the first frame
                  style={{ "--rail": name, "--delay": `${-(i * speed) / cards}s` } as React.CSSProperties}
                >
                  {img ? (
                    // The file is named in data attributes and set by DeferredImages once the
                    // page has loaded, so the first paint doesn't wait on these bytes
                    <img
                      data-src={img.src}
                      data-srcset={img.srcSet}
                      suppressHydrationWarning
                      sizes={img.sizes}
                      alt=""
                      decoding="async"
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : null}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* Swaps each card's file in after load (the img above). A small client child; the corridor
          itself stays a server component */}
      <DeferredImages selector={`.${card} img`} />
    </div>
  );
}
