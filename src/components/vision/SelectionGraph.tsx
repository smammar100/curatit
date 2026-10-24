"use client";

// The Vision page's picture of how Curatit reads the library: five real posts in hexagon
// frames, joined by thin lines, always in motion. The posts drift slowly, faint dots flow along
// every line, and a selection steps from post to post along them: a dot carries it over, the
// frame darkens, a dashed ring turns around it, a light sweeps down the cover as if it were being
// read, and its readout counts up to its slide count. Pointing at a post selects it and holds the
// walk. The drift and the flow run on requestAnimationFrame straight into the DOM (no React
// renders per frame), only while the graph is on screen and the tab is visible; a Pause button
// under it stops all of it (WCAG 2.2.2), and under reduced motion everything holds still on the
// first post. It works with three to five posts: the walk only visits the ones there are.
//
// Since 2026-10-24 on Glaze. It's drawn on the Vision page's panel, which inverts the page (dark
// on the light site, paper on the dark one) while Glaze's roles follow the page, so the drawing
// takes one colour, the panel's own text colour (currentColor), at Glaze's ink alphas: lines at
// 15% and 45%, dots at 45%, frames at 45% and the full ink when selected, the readout at the full
// ink and 60%. The frames are hollow and the lines run only between their edges, so nothing
// needs the panel's fill. The Pause button is Glaze's secondary icon Button
// and the transitions run on Glaze's overlay duration. Original work, made for Curatit.
import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/glaze/ui/button";
import { FilmStrip, Icon, Pause, Picture, Play } from "@/components/glaze/icon";
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
// A post's frame is a fifth of the graph's width (w-1/5), 6:5
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
// A post's frame in field units (a fifth of the field's width, 6:5) and its outline's corners
// around its centre. The frames are hollow, so a line runs only between their edges: it starts and
// ends where it leaves each hexagon (centrally symmetric, so one reach serves both ends)
const NODE_FIELD = { w: FIELD.w / 5, h: FIELD.w / 6 };
const CORNERS = [
  [3, 50],
  [30, 3],
  [90, 3],
  [117, 50],
  [90, 97],
  [30, 97],
].map(([x, y]) => [(x / 120 - 0.5) * NODE_FIELD.w, (y / 100 - 0.5) * NODE_FIELD.h]);
// How far a ray from the centre in direction (dx, dy), a unit vector, runs before it meets the outline
function reach(dx: number, dy: number) {
  let best = Infinity;
  CORNERS.forEach(([ax, ay], i) => {
    const [bx, by] = CORNERS[(i + 1) % CORNERS.length];
    const ex = bx - ax;
    const ey = by - ay;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) return;
    const t = (ax * ey - ay * ex) / den;
    const s = (ax * dy - ay * dx) / den;
    if (t > 0 && s >= 0 && s <= 1) best = Math.min(best, t);
  });
  return best === Infinity ? 0 : best;
}
type Point = { x: number; y: number };
// The visible stretch of the line between two posts' centres
function segment(a: Point, b: Point) {
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const dx = (b.x - a.x) / length;
  const dy = (b.y - a.y) / length;
  const r = Math.min(reach(dx, dy), length / 2);
  return { x1: a.x + dx * r, y1: a.y + dy * r, x2: b.x - dx * r, y2: b.y - dy * r };
}
const along = (s: ReturnType<typeof segment>, u: number) => ({ x: s.x1 + (s.x2 - s.x1) * u, y: s.y1 + (s.y2 - s.y1) * u });

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
        const s = segment(at[a], at[b]);
        const line = lineEls.current[k];
        if (line) {
          line.setAttribute("x1", s.x1.toFixed(2));
          line.setAttribute("y1", s.y1.toFixed(2));
          line.setAttribute("x2", s.x2.toFixed(2));
          line.setAttribute("y2", s.y2.toFixed(2));
        }
        // A faint dot flows along each line, each at its own pace
        const dot = flowEls.current[k];
        if (dot) {
          const q = along(s, (t * (0.09 + k * 0.013) + k * 0.37) % 1);
          dot.setAttribute("cx", q.x.toFixed(2));
          dot.setAttribute("cy", q.y.toFixed(2));
        }
      });
      // The handoff: a dark dot carries the selection along its line
      const move = handoff.current;
      const dot = handoffEl.current;
      if (dot) {
        const p = move ? (now - move.at) / HANDOFF_MS : 1;
        if (move && p < 1 && at[move.from] && at[move.to]) {
          const q = along(segment(at[move.from], at[move.to]), ease(Math.max(0, p)));
          dot.setAttribute("cx", q.x.toFixed(2));
          dot.setAttribute("cy", q.y.toFixed(2));
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
              {...segment(NODES[a], NODES[b])}
              vectorEffect="non-scaling-stroke"
              strokeWidth={1}
              className={cx(
                // The alpha is the element's opacity, so the change tweens (a currentColor mix doesn't)
                "stroke-current transition-opacity duration-(--dur-overlay) ease-out",
                a === active || b === active ? "opacity-45" : "opacity-15",
              )}
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
                className={cx("fill-current/45", !moving && "opacity-0")}
              />
            ))}
          {/* Hidden until a handoff runs; the frame loop sets its opacity directly */}
          {!still && <circle ref={handoffEl} r={0.9} className="fill-current opacity-0" />}
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
              className="absolute top-(--y) left-(--x) aspect-6/5 w-1/5 -translate-x-1/2 -translate-y-1/2"
              style={{ "--x": `${(NODES[i].x / FIELD.w) * 100}%`, "--y": `${(NODES[i].y / FIELD.h) * 100}%` } as CSSProperties}
            >
              {/* The reticle: a dashed ring turning around the selected post, a little wider
                  than the frame */}
              <svg
                viewBox="0 0 100 100"
                aria-hidden="true"
                className={cx(
                  "vision-reticle absolute top-1/2 left-1/2 aspect-square w-full -translate-x-1/2 -translate-y-1/2 scale-118 overflow-visible transition-opacity duration-(--dur-overlay) ease-out",
                  selected ? "opacity-100" : "opacity-0",
                )}
              >
                <circle cx="50" cy="50" r="49" fill="none" strokeWidth={1} strokeDasharray="1.5 4" vectorEffect="non-scaling-stroke" className="stroke-current/45" />
              </svg>
              <svg viewBox="0 0 120 100" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
                <path
                  d={FRAME}
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={1}
                  fill="none"
                  className={cx("stroke-current transition-opacity duration-(--dur-overlay) ease-out", selected ? "opacity-100" : "opacity-45")}
                />
              </svg>
              <div
                className={cx(
                  // The cover cut to the frame's own hexagon, inset so the two read as one shape
                  "absolute top-1/2 left-1/2 aspect-6/5 w-4/5 -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-current/10 [clip-path:var(--hex)]",
                  "transition-[scale,opacity] duration-(--dur-overlay) ease-out motion-reduce:transition-none",
                  selected ? "scale-105 opacity-100" : "opacity-80",
                )}
                style={{ "--hex": `url(#${clip})` } as CSSProperties}
              >
                <Image src={post.images[0]} alt="" fill sizes="(min-width: 1024px) 200px, 26vw" className="object-cover" draggable={false} />
                {selected && moving && <span key={run} aria-hidden="true" className="vision-scan absolute inset-x-0 h-1/4" />}
              </div>
              <Readout
                index={i}
                category={post.category.name}
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
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          aria-label={paused ? "Play the animation" : "Pause the animation"}
          className="absolute right-0 bottom-0"
        >
          <Icon icon={paused ? Play : Pause} />
        </Button>
      )}
    </div>
  );
}

// The selection readout beside a post: its number and category over its format glyph (one
// picture, or a film strip for a carousel) and its slide count, which counts up from zero when
// the post is selected
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
        // Below 40rem of graph only the selected one shows
        "absolute -top-4 type-caption whitespace-nowrap tabular-nums transition-[color,opacity] duration-(--dur-overlay) ease-out @max-[40rem]:not-data-[on]:opacity-0",
        left ? "right-5/6 text-right" : "left-5/6",
        selected ? "text-current" : "text-current/60",
      )}
      data-on={selected || undefined}
    >
      <p className="whitespace-nowrap">
        {String(index + 1).padStart(2, "0")} {category}
      </p>
      <p className={cx("mt-0.5 flex items-center gap-1.5 whitespace-nowrap", left && "justify-end")}>
        <Icon icon={carousel ? FilmStrip : Picture} size={12} />
        <span>
          {shown} {slides === 1 ? "slide" : "slides"}
        </span>
      </p>
    </div>
  );
}
