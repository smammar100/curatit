"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  CARD_SIZE,
  HERO_ROW_Y,
  cardImages,
  cascade,
  clamp,
  fanSlots,
  getTimeForProgress,
  hoverEase,
  smoothEase,
} from "./tokens";

/* -------------------------------------------------------------------------- */
/*  Geometry                                                                   */
/* -------------------------------------------------------------------------- */

type Viewport = { w: number; h: number };

type Geometry = {
  vp: Viewport;
  /** Layout scale: 1 at ≥1280px wide, shrinking on smaller screens. */
  k: number;
  size: number;
  heroRowY: number;
  cascadeLeft: number;
};

type Measurements = { lockProgress: number; scrollableHeight: number; heroRowY: number };

function fanPose(g: Geometry, index: number) {
  const slot = fanSlots[index];
  return { x: g.vp.w / 2 + slot.x * g.k, y: g.heroRowY + slot.y * g.k, rotate: slot.rotate, scale: slot.scale };
}

function cascadePose(g: Geometry, index: number) {
  const step = cascade[index];
  return {
    x: g.cascadeLeft + step.left * g.k + g.size / 2,
    y: step.top * g.k + g.size / 2,
    rotate: step.rotate,
  };
}

/* -------------------------------------------------------------------------- */
/*  Card                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The visible card. Rendered inside a zero-size motion.div whose x/y is the
 * card *centre*, so rotation and scale pivot around the middle.
 */
function CardFace({ index, size, radius }: { index: number; size: number; radius: number }) {
  return (
    <div
      className="absolute overflow-hidden"
      style={{
        left: -size / 2,
        top: -size / 2,
        width: size,
        height: size,
        borderRadius: radius,
        boxShadow: "0 20px 60px rgba(0,0,0,0.20)",
      }}
    >
      <Image
        src={cardImages[index]}
        alt=""
        fill
        sizes="440px"
        priority
        draggable={false}
        className="select-none"
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Intro (Section 1, scroll ≈ 0)                                              */
/* -------------------------------------------------------------------------- */

const introDelay = 0.8;
const introDuration = 0.72; // rise from below centre to the hero row
const travelToRightDuration = 0.6; // fly to slot 6 (rightmost)
const sweepLeftDuration = 1.6; // sweep across to slot 0 (leftmost)
const totalDuration = introDuration + travelToRightDuration + sweepLeftDuration;
const sweepStart = introDelay + introDuration + travelToRightDuration;

/** When the lead card passes each slot, reveal it (inverting smoothEase). */
const revealDelays = fanSlots.map((slot, index) => {
  if (index === 0) return 0;
  const progress = (slot.x - fanSlots[6].x) / (fanSlots[0].x - fanSlots[6].x);
  return sweepStart + getTimeForProgress(progress, smoothEase) * sweepLeftDuration;
});

function IntroOverlay({ g, onDone }: { g: Geometry; onDone: () => void }) {
  const revealed = useRef(new Set<number>());
  const slot0 = fanPose(g, 0);
  const slot6 = fanPose(g, 6);

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 5 }} aria-hidden="true">
      {[1, 2, 3, 4, 5, 6].map((index) => {
        const pose = fanPose(g, index);
        const quick = revealed.current.has(index);
        return (
          <motion.div
            key={index}
            className="absolute left-0 top-0"
            style={{ zIndex: fanSlots[index].z, x: pose.x, y: pose.y, rotate: pose.rotate, scale: pose.scale }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={
              quick
                ? { duration: 0.25, ease: hoverEase }
                : { delay: revealDelays[index], duration: index <= 3 ? 0.06 : 0.18, ease: "easeOut" }
            }
            onAnimationComplete={() => revealed.current.add(index)}
          >
            <CardFace index={index} size={g.size} radius={18 * g.k} />
          </motion.div>
        );
      })}

      {/* Lead card: rise → fly to the rightmost slot → sweep to the leftmost. */}
      <motion.div
        className="absolute left-0 top-0"
        style={{ zIndex: 10 }}
        initial={{ x: g.vp.w / 2, y: g.vp.h / 2 + 180, rotate: 0, scale: 0.3, opacity: 0 }}
        animate={{
          x: [g.vp.w / 2, g.vp.w / 2, slot6.x, slot0.x],
          y: [g.vp.h / 2 + 180, g.heroRowY, slot6.y, slot0.y],
          rotate: [0, 0, slot6.rotate, slot0.rotate],
          scale: [0.3, 1, slot6.scale, slot0.scale],
          opacity: [0, 1, 1, 1],
        }}
        transition={{
          delay: introDelay,
          duration: totalDuration,
          times: [0, introDuration / totalDuration, (introDuration + travelToRightDuration) / totalDuration, 1],
          ease: [smoothEase, smoothEase, smoothEase],
        }}
        onAnimationComplete={onDone}
      >
        <CardFace index={0} size={g.size} radius={18 * g.k} />
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Scroll-linked (fan → stack → cascade → locked)                             */
/* -------------------------------------------------------------------------- */

function ScrollLinkedCard({
  index,
  g,
  progress,
  lockProgress,
}: {
  index: number;
  g: Geometry;
  progress: MotionValue<number>;
  lockProgress: number;
}) {
  const [hovered, setHovered] = useState(false);
  const lp = Math.max(lockProgress, 0.05);
  const p1 = lp * 0.33;
  const p2 = lp * 0.66;

  const fan = fanPose(g, index);
  const ladder = cascadePose(g, index);
  const stack = { x: g.vp.w / 2, y: g.vp.h / 2 };

  // 0 → p1: gather into one centred stack; p1 → p2: descend; p2 → lp: fan into the ladder.
  const x = useTransform(progress, [0, p1, p2, lp], [fan.x, stack.x, stack.x, ladder.x]);
  const y = useTransform(progress, [0, p1, p2, lp], [fan.y, stack.y, ladder.y, ladder.y]);
  const rotate = useTransform(progress, [0, p1, lp], [fan.rotate, 0, ladder.rotate]);
  const scale = useTransform(progress, [0, p1, lp], [fan.scale, 1, 1]);
  // Fan order until the stack forms, then the cascade order (leftmost on top).
  const z = useTransform(progress, (value) => (value < p1 / 2 ? fanSlots[index].z : cascade[index].z));

  return (
    <motion.div
      className="pointer-events-auto absolute left-0 top-0"
      style={{ x, y, rotate, scaleX: scale, scaleY: scale, zIndex: hovered ? 30 : z }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ transition: { duration: 0.2, ease: hoverEase } }}
    >
      <CardFace index={index} size={g.size} radius={18 * g.k} />
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Overlay                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Owns the seven artwork cards across the whole landing page: the intro
 * choreography in the hero, then a scroll-linked journey that pins the cards
 * as a cascade at the top of Section 2.
 */
export default function ScrollCards({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const reduceMotion = useReducedMotion();
  const [vp, setVp] = useState<Viewport | null>(null);
  const [m, setM] = useState<Measurements>({ lockProgress: 0.5, scrollableHeight: 1, heroRowY: HERO_ROW_Y });
  const [introDone, setIntroDone] = useState(false);
  const [locked, setLocked] = useState(false);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  const lockRef = useRef(m.lockProgress);
  lockRef.current = m.lockProgress;
  // Clamp at the lock point so the cascade can't keep moving past Section 2.
  const clamped = useTransform(scrollYProgress, (value) => Math.min(value, lockRef.current));

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const k = clamp(w / 1280, 0.42, 1);

    const containerTop = container.getBoundingClientRect().top + window.scrollY;
    const scrollableHeight = Math.max(1, container.scrollHeight - h);
    const two = container.querySelector<HTMLElement>('[data-section="two"]');
    const sectionTwoTop = two ? two.getBoundingClientRect().top + window.scrollY : containerTop + h;
    const lockProgress = clamp((sectionTwoTop - containerTop) / scrollableHeight, 0.05, 0.99);

    // Centre the card row in the hero spacer. Measured rather than fixed, since
    // the headline height depends on the font and on wrapping.
    let heroRowY = HERO_ROW_Y;
    const row = container.querySelector<HTMLElement>("[data-hero-row]");
    if (row) {
      const rect = row.getBoundingClientRect();
      heroRowY = rect.top + window.scrollY - containerTop + rect.height / 2 + 20 * k;
    }

    setVp((current) => (current && current.w === w && current.h === h ? current : { w, h }));
    setM({ lockProgress, scrollableHeight, heroRowY });
    setLocked(scrollYProgress.get() >= lockProgress);
  }, [containerRef, scrollYProgress]);

  useEffect(() => {
    measure();
    const settle = window.setTimeout(measure, 300);
    window.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // Skip the intro for reduced motion, a restored scroll position, or if the
  // visitor starts scrolling before it finishes.
  useEffect(() => {
    if (introDone) return;
    if (reduceMotion || window.scrollY > 10) {
      setIntroDone(true);
      return;
    }
    const onScroll = () => {
      if (window.scrollY > 40) setIntroDone(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [introDone, reduceMotion]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = value >= m.lockProgress;
    setLocked((current) => (current === next ? current : next));
  });

  const geometry = useMemo<Geometry | null>(() => {
    if (!vp) return null;
    const k = clamp(vp.w / 1280, 0.42, 1);
    return {
      vp,
      k,
      size: CARD_SIZE * k,
      heroRowY: m.heroRowY,
      cascadeLeft: vp.w < 768 ? 16 : vp.w * 0.4,
    };
  }, [vp, m.heroRowY]);

  if (!geometry) return null;

  if (!introDone) return <IntroOverlay g={geometry} onDone={() => setIntroDone(true)} />;

  // Same element either way — only its positioning changes — so the seven
  // cards stay mounted and never visibly reset when crossing into Section 2.
  const wrapperStyle: React.CSSProperties = locked
    ? {
        position: "absolute",
        top: m.lockProgress * m.scrollableHeight,
        left: 0,
        width: "100%",
        height: geometry.vp.h,
        zIndex: 5,
      }
    : { position: "fixed", inset: 0, zIndex: 5 };

  return (
    <div className="pointer-events-none" style={wrapperStyle} aria-hidden="true">
      {cardImages.map((_, index) => (
        <ScrollLinkedCard
          key={index}
          index={index}
          g={geometry}
          progress={clamped}
          lockProgress={m.lockProgress}
        />
      ))}
    </div>
  );
}
