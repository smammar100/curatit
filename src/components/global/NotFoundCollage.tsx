"use client";

// The 404 page's "404", made of real library covers laid along the digits (after Dribbble's 404,
// which builds its digits from shots). The covers fly in from different depths. Near the cursor
// they lift toward you like a lens (straightening, growing and casting a shadow, falling off with
// distance), and a cover the cursor reaches flips over in 3D, the way the cursor is going, to show
// another post; the whole collage leans a little toward the cursor. On a touch screen a tap flips
// the covers around it, and while nobody's touching it a cover turns over now and then by itself.
// Purely decorative: hidden from assistive tech, and the page's own text says what happened.
// Since 2026-10-24 a face is an image tile on Glaze's tokens: the panel's corners, the grey field
// under a cover that hasn't loaded, the faint line inside its edge; each tile's place, delay and
// turn reach the CSS as custom properties. The lift, the lens and the flip (.nf-* in global.css)
// are as they were.
import { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type Ref } from "react";
import Image from "next/image";
import { cx } from "@/lib/cx";
import { BOX, layout404, type Placement } from "./notFoundLayout";

// A flip's length (matches .nf-card in global.css) and how soon the same cover can flip again
const FLIP_MS = 700;
const COOLDOWN_MS = 1000;
// In box units (a cover is 6.6 wide): how far the lens reaches, and how close flips a cover
const LENS = 12;
const FLIP_REACH = 3.4;
const TAP_REACH = 8;
// Idle turns: one cover every so often, once the pointer has been still a while
const IDLE_EVERY_MS = 1600;
const IDLE_AFTER_MS = 3000;

type Card = { turns: number; faces: [number, number] };

const motionQuery = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return useSyncExternalStore(
    (change) => {
      const query = matchMedia(motionQuery);
      query.addEventListener("change", change);
      return () => query.removeEventListener("change", change);
    },
    () => matchMedia(motionQuery).matches,
    () => false,
  );
}

const Face = memo(function Face({ src, back }: { src: string | undefined; back?: boolean }) {
  return (
    <div className={cx("nf-face absolute inset-0 overflow-hidden rounded-panel bg-field outline-1 -outline-offset-1 outline-line-faint", back && "nf-back")}>
      {src && <Image src={src} alt="" fill sizes="(min-width: 1024px) 80px, 9vw" quality={60} draggable={false} className="object-cover" />}
    </div>
  );
});

const Tile = memo(function Tile({ place, card, covers, ref }: { place: Placement; card: Card; covers: string[]; ref: Ref<HTMLDivElement> }) {
  const cover = (i: number) => (covers.length ? covers[i % covers.length] : undefined);
  return (
    <div
      ref={ref}
      // The delay is marked important: .nf-tile's own animation shorthand would otherwise reset it
      className="nf-tile absolute top-(--top) left-(--left) w-(--width) [animation-delay:var(--delay)]!"
      style={
        {
          "--left": `${place.left}%`,
          "--top": `${place.top}%`,
          "--width": `${place.width}%`,
          "--r": `${place.rotate}deg`,
          "--s": place.scale,
          "--z": `${place.depth}px`,
          "--delay": `${place.order * 22}ms`,
        } as CSSProperties
      }
    >
      <div className="nf-shadow" />
      <div className="nf-card relative aspect-4/5 [transform:rotateY(var(--turn))]" style={{ "--turn": `${card.turns * 180}deg` } as CSSProperties}>
        <Face src={cover(card.faces[0])} />
        <Face src={cover(card.faces[1])} back />
      </div>
    </div>
  );
});

export default function NotFoundCollage({ covers, className, style }: { covers: string[]; className?: string; style?: CSSProperties }) {
  const places = useMemo(() => layout404(), []);
  const count = places.length;
  // Each cover starts with one post showing and the next one waiting on its back
  const [cards, setCards] = useState<Card[]>(() => places.map((_, i) => ({ turns: 0, faces: [i, count + i] })));
  const nextPost = useRef(count * 2);
  const lastFlip = useRef<number[]>(places.map(() => -Infinity));
  const lift = useRef<number[]>(places.map(() => 0));
  // When each cover's current turn ends; a turning cover stays on top until then
  const turningUntil = useRef<number[]>(places.map(() => -Infinity));
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const lastPointer = useRef({ x: 0, at: -Infinity });
  const stage = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const reduced = useReducedMotion();

  // Covers stack by how far they're lifted, and a turning one above all of them
  const restack = useCallback((i: number) => {
    const node = tiles.current[i];
    if (!node) return;
    const turning = performance.now() < turningUntil.current[i];
    node.style.zIndex = turning ? "30" : lift.current[i] > 0.02 ? String(1 + Math.round(lift.current[i] * 20)) : "";
  }, []);

  // Turn these covers over; once a turn is done, the face that went out of sight takes the next
  // post, so the following flip shows something new without a visible swap
  const flip = useCallback((indices: number[], direction: 1 | -1) => {
    const now = performance.now();
    const due = indices.filter((i) => now - lastFlip.current[i] >= COOLDOWN_MS);
    if (!due.length) return;
    for (const i of due) {
      lastFlip.current[i] = now;
      turningUntil.current[i] = now + FLIP_MS;
      restack(i);
    }
    setCards((previous) => {
      const next = previous.slice();
      for (const i of due) next[i] = { ...next[i], turns: next[i].turns + direction };
      return next;
    });
    setTimeout(() => {
      setCards((previous) => {
        const next = previous.slice();
        for (const i of due) {
          const card = next[i];
          const hidden = ((card.turns % 2) + 2) % 2 === 0 ? 1 : 0;
          const faces: [number, number] = [...card.faces];
          faces[hidden] = nextPost.current++;
          next[i] = { ...card, faces };
        }
        return next;
      });
      for (const i of due) restack(i);
    }, FLIP_MS);
  }, [restack]);

  // Where a client point falls in box units
  const toBox = useCallback((x: number, y: number) => {
    const rect = stage.current!.getBoundingClientRect();
    return { px: ((x - rect.left) / rect.width) * BOX.width, py: ((y - rect.top) / rect.height) * BOX.height, rect };
  }, []);

  // Write each cover's lift (0 to 1) straight to its style, only where it changed
  const setLift = useCallback(
    (at: ((i: number) => number) | null) => {
      places.forEach((_, i) => {
        const value = at ? at(i) : 0;
        if (Math.abs(value - lift.current[i]) < 0.01) return;
        lift.current[i] = value;
        tiles.current[i]?.style.setProperty("--lift", value.toFixed(3));
        restack(i);
      });
    },
    [places, restack],
  );

  function onPointerMove(event: React.PointerEvent) {
    if (event.pointerType === "touch") return;
    const { clientX, clientY } = event;
    const dx = clientX - lastPointer.current.x;
    lastPointer.current = { x: clientX, at: performance.now() };
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (!stage.current) return;
      const { px, py, rect } = toBox(clientX, clientY);
      const distance = places.map((place) => Math.hypot(place.cx - px, place.cy - py));
      flip(distance.flatMap((d, i) => (d < FLIP_REACH ? [i] : [])), dx < 0 ? -1 : 1);
      if (reduced) return;
      // A smooth falloff: full lift under the cursor, none at the lens's edge
      setLift((i) => {
        const t = Math.max(0, 1 - distance[i] / LENS);
        return t * t * (3 - 2 * t);
      });
      if (tilt.current) {
        const x = (clientX - rect.left) / rect.width - 0.5;
        const y = (clientY - rect.top) / rect.height - 0.5;
        tilt.current.style.transform = `rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
      }
    });
  }

  function onPointerLeave() {
    cancelAnimationFrame(frame.current);
    setLift(null);
    if (tilt.current) tilt.current.style.transform = "";
  }

  function onPointerDown(event: React.PointerEvent) {
    if (event.pointerType !== "touch" || !stage.current) return;
    lastPointer.current = { x: event.clientX, at: performance.now() };
    const { px, py } = toBox(event.clientX, event.clientY);
    flip(places.flatMap((place, i) => (Math.hypot(place.cx - px, place.cy - py) < TAP_REACH ? [i] : [])), 1);
  }

  // Now and then a cover turns over by itself, while the pointer's away and the tab is in view
  useEffect(() => {
    if (reduced || !count) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible" || performance.now() - lastPointer.current.at < IDLE_AFTER_MS) return;
      flip([Math.floor(Math.random() * count)], Math.random() < 0.5 ? -1 : 1);
    }, IDLE_EVERY_MS);
    return () => clearInterval(id);
  }, [reduced, count, flip]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return (
    <div
      ref={stage}
      aria-hidden="true"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      className={cx("nf-stage relative aspect-(--box) select-none", className)}
      style={{ ...style, "--box": `${BOX.width} / ${BOX.height}` } as CSSProperties}
    >
      <div ref={tilt} className="nf-tilt absolute inset-0">
        {places.map((place, i) => (
          <Tile
            key={i}
            ref={(node) => {
              tiles.current[i] = node;
            }}
            place={place}
            card={cards[i]}
            covers={covers}
          />
        ))}
      </div>
    </div>
  );
}
