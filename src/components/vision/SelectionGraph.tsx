"use client";

// The Vision page's picture of how Curatit reads the library: five real posts in hexagon
// frames, joined by thin lines, always in motion. The posts drift slowly, faint dots flow along
// every line, and a selection steps from post to post along them: a dot carries it over, the
// frame darkens, a dashed ring turns around it, a light sweeps down the cover as if it were being
// read, and its readout counts up to its slide count. Pointing at a post selects it and holds the
// walk. The drift and the flow run on requestAnimationFrame straight into the DOM (no React
// renders per frame), only while the graph is on screen and the tab is visible; a Pause button
// under it stops all of it (WCAG 2.2.2), and under reduced motion everything holds still on the
// first post. It works with three to five posts: the walk only visits the ones there are. It's
// drawn inside the page's .vision-night panel, so its colours are the base-* and white classes
// the panel redefines (the semantic tokens don't flip there). Original work, made for Curatit.
import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import Pause from "@/components/fundations/icons/Pause";
import Play from "@/components/fundations/icons/Play";
import type { LibraryPost } from "@/lib/posts";
import { cx } from "@/lib/cx";

// The field the graph is drawn in (its own 3:2 frame) and where each post sits in it. A post
// whose readout would run off the right edge puts it on its left
const FIELD = { w: 150, h: 100 };
const NODES = [
  { x: 78, y: 17, left: false },
  { x: 24, y: 47, left: false },
  { x: 86, y: 62, left: false },
  { x: 42, y: 86, left: false },
  { x: 129, y: 38, left: true },
];
// The walk follows these lines in order: 0 → 4 → 2 → 3 → 1 → 0
const WALK = [0, 4, 2, 3, 1];
const EDGES: [number, number][] = [
  [0, 4],
  [4, 2],
  [2, 3],
  [3, 1],
  [1, 0],
  [1, 2],
  [0, 2],
];
const STEP_MS = 2600;
const HANDOFF_MS = 900;
// A post's frame is 20% of the graph's width, 6:5
const NODE_W = 20;
// How far a post drifts from its place, in field units, and how fast (radians a second)
const DRIFT = 1.8;

// A hexagon with points left and right, its corners rounded, in a w × h box: the frame's outline
// (120 × 100) and, in a 1 × 1 box, the clip that cuts each cover to the same shape
function hexagon(w: number, h: number) {
  const points = [
    [3, 50],
    [30, 3],
    [90, 3],
    [117, 50],
    [90, 97],
    [30, 97],
  ].map(([x, y]) => [(x / 120) * w, (y / 100) * h]);
  const r = (10 / 120) * w;
  const toward = (a: number[], b: number[], d: number) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [a[0] + ((b[0] - a[0]) * d) / length, a[1] + ((b[1] - a[1]) * d) / length];
  };
  return (
    points
      .map((point, i) => {
        const before = toward(point, points[(i + points.length - 1) % points.length], r);
        const after = toward(point, points[(i + 1) % points.length], r);
        const n = (v: number) => +v.toFixed(4);
        return `${i === 0 ? "M" : "L"}${n(before[0])} ${n(before[1])} Q${n(point[0])} ${n(point[1])} ${n(after[0])} ${n(after[1])}`;
      })
      .join(" ") + " Z"
  );
}
const FRAME = hexagon(120, 100);
const HEX_CLIP = hexagon(1, 1);

const short = (category: string) => category.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export default function SelectionGraph({ posts }: { posts: LibraryPost[] }) {
  const nodes = useMemo(() => posts.slice(0, NODES.length), [posts]);
  const edges = useMemo(() => EDGES.filter(([a, b]) => a < nodes.length && b < nodes.length), [nodes]);
  // The walk visits only the posts there are (with three or four, nodes 3 and 4 don't exist)
  const walk = useMemo(() => WALK.filter((i) => i < nodes.length), [nodes]);
  const root = useRef<HTMLDivElement>(null);
  // The covers' hexagon clip, by an id CSS can reference (useId's colons removed)
  const clip = `vision-hex-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const nodeEls = useRef<(HTMLDivElement | null)[]>([]);
  const lineEls = useRef<(SVGLineElement | null)[]>([]);
  const flowEls = useRef<(SVGCircleElement | null)[]>([]);
  const handoffEl = useRef<SVGCircleElement>(null);
  const handoff = useRef<{ from: number; to: number; at: number } | null>(null);

  const [step, setStep] = useState(0);
  const [held, setHeld] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [still, setStill] = useState(false);
  const [paused, setPaused] = useState(false);
  // Motion runs only on screen, unpaused, and without a reduced-motion preference
  const moving = visible && !still && !paused;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setStill(query.matches);
    update();
    query.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (root.current) observer.observe(root.current);
    return () => {
      query.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);

  // The walk
  useEffect(() => {
    if (!moving || held != null || walk.length < 2) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setStep((s) => {
        handoff.current = { from: walk[s % walk.length], to: walk[(s + 1) % walk.length], at: performance.now() };
        return s + 1;
      });
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [moving, held, walk]);

  // The drift and the flow, every frame, straight into the DOM
  useEffect(() => {
    if (!moving) return;
    let frame = 0;
    let width = root.current?.clientWidth ?? 0;
    const resize = new ResizeObserver(([entry]) => (width = entry.contentRect.width));
    if (root.current) resize.observe(root.current);
    const place = (i: number, t: number) => ({
      x: NODES[i].x + DRIFT * Math.sin(t * (0.35 + i * 0.07) + i * 1.7),
      y: NODES[i].y + DRIFT * 0.8 * Math.cos(t * (0.28 + i * 0.05) + i * 2.3),
    });
    const tick = (now: number) => {
      const t = now / 1000;
      const at = nodes.map((_, i) => place(i, t));
      const unit = width / FIELD.w;
      at.forEach((p, i) => {
        const el = nodeEls.current[i];
        // The drift only: the -50% centring is the `translate` property from the class, which
        // composes with `transform` rather than being replaced by it
        if (el) el.style.transform = `translate(${((p.x - NODES[i].x) * unit).toFixed(2)}px, ${((p.y - NODES[i].y) * unit).toFixed(2)}px)`;
      });
      edges.forEach(([a, b], k) => {
        const line = lineEls.current[k];
        if (line) {
          line.setAttribute("x1", at[a].x.toFixed(2));
          line.setAttribute("y1", at[a].y.toFixed(2));
          line.setAttribute("x2", at[b].x.toFixed(2));
          line.setAttribute("y2", at[b].y.toFixed(2));
        }
        // A faint dot flows along each line, each at its own pace
        const dot = flowEls.current[k];
        if (dot) {
          const u = (t * (0.09 + k * 0.013) + k * 0.37) % 1;
          dot.setAttribute("cx", (at[a].x + (at[b].x - at[a].x) * u).toFixed(2));
          dot.setAttribute("cy", (at[a].y + (at[b].y - at[a].y) * u).toFixed(2));
        }
      });
      // The handoff: a dark dot carries the selection along its line
      const move = handoff.current;
      const dot = handoffEl.current;
      if (dot) {
        const p = move ? (now - move.at) / HANDOFF_MS : 1;
        if (move && p < 1 && at[move.from] && at[move.to]) {
          const e = ease(Math.max(0, p));
          dot.setAttribute("cx", (at[move.from].x + (at[move.to].x - at[move.from].x) * e).toFixed(2));
          dot.setAttribute("cy", (at[move.from].y + (at[move.to].y - at[move.from].y) * e).toFixed(2));
          dot.style.opacity = "1";
        } else dot.style.opacity = "0";
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, [moving, nodes, edges]);

  const active = held ?? (still || !walk.length ? 0 : walk[step % walk.length]);
  // The selected post's count-up and scan play when it's actually seen, not off screen on load
  const run = `${step}-${held}-${visible}`;

  return (
    <div className="relative">
    <div
      ref={root}
      role="img"
      aria-label={`An illustration: ${nodes.length} recent posts from the library, one from each of ${nodes.length} categories, joined by lines`}
      data-paused={paused || still || undefined}
      className="@container relative mx-auto aspect-3/2 w-full select-none"
    >
      <svg viewBox={`0 0 ${FIELD.w} ${FIELD.h}`} className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <defs>
          <clipPath id={clip} clipPathUnits="objectBoundingBox">
            <path d={HEX_CLIP} />
          </clipPath>
        </defs>
        {edges.map(([a, b], k) => (
          <line
            key={`${a}-${b}`}
            ref={(el) => {
              lineEls.current[k] = el;
            }}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            vectorEffect="non-scaling-stroke"
            strokeWidth={1}
            className={cx("transition-[stroke] duration-500 ease-in-out-quart", a === active || b === active ? "stroke-base-500" : "stroke-base-200")}
          />
        ))}
        {!still &&
          edges.map(([a, b], k) => (
            <circle
              key={`flow-${a}-${b}`}
              ref={(el) => {
                flowEls.current[k] = el;
              }}
              cx={NODES[a].x}
              cy={NODES[a].y}
              r={0.45}
              className={cx("fill-base-400", !moving && "opacity-0")}
            />
          ))}
        {!still && <circle ref={handoffEl} r={0.9} className="fill-base-900" style={{ opacity: 0 }} />}
      </svg>

      {nodes.map((post, i) => {
        const selected = i === active;
        const slides = post.images.length;
        return (
          <div
            key={post.id}
            ref={(el) => {
              nodeEls.current[i] = el;
            }}
            onPointerEnter={() => setHeld(i)}
            onPointerLeave={() => setHeld(null)}
            className="absolute aspect-6/5 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(NODES[i].x / FIELD.w) * 100}%`, top: `${(NODES[i].y / FIELD.h) * 100}%`, width: `${NODE_W}%` }}
          >
            {/* The reticle: a dashed ring turning around the selected post */}
            <svg
              viewBox="0 0 100 100"
              aria-hidden="true"
              className={cx(
                "vision-reticle absolute top-1/2 left-1/2 aspect-square w-[118%] -translate-x-1/2 -translate-y-1/2 overflow-visible transition-opacity duration-500 ease-in-out-quart",
                selected ? "opacity-100" : "opacity-0",
              )}
            >
              <circle cx="50" cy="50" r="49" fill="none" strokeWidth={1} strokeDasharray="1.5 4" vectorEffect="non-scaling-stroke" className="stroke-base-400" />
            </svg>
            <svg viewBox="0 0 120 100" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
              <path
                d={FRAME}
                vectorEffect="non-scaling-stroke"
                strokeWidth={1}
                className={cx("fill-white transition-[stroke] duration-500 ease-in-out-quart", selected ? "stroke-base-900" : "stroke-base-300")}
              />
            </svg>
            <div
              className={cx(
                // The cover cut to the frame's own hexagon, inset so the two read as one shape
                "absolute top-1/2 left-1/2 aspect-6/5 w-[80%] -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-base-100",
                "transition-[scale,opacity] duration-500 ease-in-out-quart motion-reduce:transition-none",
                selected ? "scale-105 opacity-100" : "opacity-80",
              )}
              style={{ clipPath: `url(#${clip})` }}
            >
              <Image src={post.images[0]} alt="" fill sizes="(min-width: 1024px) 200px, 26vw" className="object-cover" draggable={false} />
              {selected && moving && <span key={run} aria-hidden="true" className="vision-scan absolute inset-x-0 h-1/4" />}
            </div>
            <Readout
              index={i}
              category={short(post.category.name)}
              carousel={slides > 1}
              slides={slides}
              selected={selected}
              run={run}
              still={!moving}
              left={NODES[i].left}
            />
          </div>
        );
      })}
    </div>
    {!still && (
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        aria-pressed={paused}
        aria-label={paused ? "Play the animation" : "Pause the animation"}
        className="absolute right-0 bottom-0 flex size-11 items-center justify-center rounded-full text-base-500 ring-1 ring-base-200 transition-[color,background-color] duration-150 ease-out-quint hover:bg-base-100 hover:text-base-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-500"
      >
        {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
      </button>
    )}
    </div>
  );
}

// The selection readout beside a post: "<.03 FINT.>" over format dots and its slide count, which
// counts up from zero when the post is selected
function Readout({
  index,
  category,
  carousel,
  slides,
  selected,
  run,
  still,
  left,
}: {
  index: number;
  category: string;
  carousel: boolean;
  slides: number;
  selected: boolean;
  run: string;
  still: boolean;
  left: boolean;
}) {
  const [shown, setShown] = useState(slides);
  useEffect(() => {
    if (!selected || still) {
      setShown(slides);
      return;
    }
    setShown(0);
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      setShown(Math.min(n, slides));
      if (n >= slides) clearInterval(timer);
    }, 70);
    return () => clearInterval(timer);
  }, [selected, slides, still, run]);

  return (
    <div
      aria-hidden="true"
      className={cx(
        // Sized from the graph's own width, never under 9px; below 40rem only the selected one shows
        "absolute top-[-8%] font-mono text-[clamp(9px,1.05cqw,11px)] leading-tight whitespace-nowrap tabular-nums transition-[color,opacity] duration-500 ease-in-out-quart @max-[40rem]:not-data-[on]:opacity-0",
        left ? "right-[86%] text-right" : "left-[86%]",
        selected ? "text-base-900" : "text-base-400",
      )}
      data-on={selected || undefined}
    >
      <p>
        &lt;.0{index + 1} {category}.&gt;
      </p>
      <p className="mt-0.5 flex items-center justify-between gap-3">
        <span className="flex gap-0.5">
          <span className="size-[0.7em] rounded-full bg-current" />
          {carousel && <span className="size-[0.7em] rounded-full bg-current" />}
        </span>
        <span>{String(shown).padStart(2, "0")} sl.</span>
      </p>
    </div>
  );
}
