"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import {
  motion,
  useAnimationControls,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  CARD_SIZE,
  HERO_ROW_Y,
  LEAD,
  cardImages,
  cascade,
  clamp,
  dealSpring,
  fanSlots,
  smoothEase,
} from "./tokens";
import { useIntroSkipped } from "./useIntro";
import { spring } from "@/lib/springs";

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
 * card *centre*, so rotation and scale pivot around the middle. The hover lift
 * lives here, on the inner element, so it never fights the scroll-driven x/y.
 */
function CardFace({
  index,
  size,
  radius,
  hoverable = false,
}: {
  index: number;
  size: number;
  radius: number;
  hoverable?: boolean;
}) {
  return (
    <motion.div
      className="absolute overflow-hidden shadow-surface-6"
      style={{
        left: -size / 2,
        top: -size / 2,
        width: size,
        height: size,
        borderRadius: radius,
      }}
      whileHover={hoverable ? { y: -8, transition: spring.moderate } : undefined}
    >
      <Image
        src={cardImages[index]}
        alt=""
        fill
        sizes="400px"
        priority
        draggable={false}
        className="select-none"
        style={{ objectFit: "cover" }}
      />
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Intro: deal from the deck                                                  */
/* -------------------------------------------------------------------------- */

const LEAD_RISE_DELAY = 0.35;
const LEAD_RISE_DURATION = 0.6;
const DECK_START = 0.75;
const DEAL_START = 1.1;
const DEAL_STAGGER = 0.035;

/**
 * One card of the intro. The lead rises to the centre; the rest fade in as a
 * deck underneath it; then every card springs out to its fan slot, the ones
 * travelling furthest leaving last.
 */
function DealCard({ g, index, startedAt, onDealt }: { g: Geometry; index: number; startedAt: number; onDealt?: () => void }) {
  const controls = useAnimationControls();
  const isLead = index === LEAD;
  const depth = LEAD - index; // 0 = top of the deck
  const center = { x: g.vp.w / 2, y: g.heroRowY };
  const target = fanPose(g, index);
  const deck = {
    x: center.x + 2 * depth * g.k,
    y: center.y + 2 * depth * g.k,
    rotate: isLead ? 0 : depth % 2 ? 1.5 : -1.5,
  };

  useEffect(() => {
    let cancelled = false;
    const elapsed = () => (performance.now() - startedAt) / 1000;

    void (async () => {
      if (isLead) {
        await controls.start({
          x: center.x,
          y: center.y,
          rotate: 0,
          scale: 1,
          opacity: 1,
          transition: { delay: LEAD_RISE_DELAY, duration: LEAD_RISE_DURATION, ease: smoothEase },
        });
      } else {
        await controls.start({
          opacity: 1,
          scale: 1,
          transition: { delay: DECK_START + (depth - 1) * 0.03, duration: 0.3, ease: "easeOut" },
        });
      }
      if (cancelled) return;

      const dealAt = DEAL_START + depth * DEAL_STAGGER;
      await controls.start({
        x: target.x,
        y: target.y,
        rotate: target.rotate,
        transition: { ...dealSpring, delay: Math.max(0, dealAt - elapsed()) },
      });
      if (!cancelled) onDealt?.();
    })();

    return () => {
      cancelled = true;
      controls.stop();
    };
    // Runs once per mount; geometry changes remount the overlay via its key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="absolute left-0 top-0"
      style={{ zIndex: fanSlots[index].z }}
      initial={
        isLead
          ? { x: center.x, y: center.y + 60 * g.k, rotate: -4, scale: 0.85, opacity: 0 }
          : { ...deck, scale: 0.96, opacity: 0 }
      }
      animate={controls}
    >
      <CardFace index={index} size={g.size} radius={18 * g.k} />
    </motion.div>
  );
}

function IntroOverlay({ g, onDone }: { g: Geometry; onDone: () => void }) {
  const [startedAt] = useState(() => performance.now());
  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 5 }} aria-hidden="true">
      {fanSlots.map((_, index) => (
        <DealCard
          key={index}
          g={g}
          index={index}
          startedAt={startedAt}
          // Slot 0 travels furthest and deals last, so its landing ends the intro.
          onDealt={index === 0 ? onDone : undefined}
        />
      ))}
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
    >
      <CardFace index={index} size={g.size} radius={18 * g.k} hoverable />
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
  const introSeen = useIntroSkipped();
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
    if (reduceMotion || introSeen || window.scrollY > 10) {
      setIntroDone(true);
      return;
    }
    const onScroll = () => {
      if (window.scrollY > 40) setIntroDone(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [introDone, reduceMotion, introSeen]);

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

  if (!introDone) {
    return (
      <IntroOverlay
        key={`${geometry.vp.w}x${geometry.vp.h}:${Math.round(geometry.heroRowY)}`}
        g={geometry}
        onDone={() => setIntroDone(true)}
      />
    );
  }

  // Same element either way (only its positioning changes), so the seven
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
