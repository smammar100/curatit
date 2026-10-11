// Where the 404 page's covers sit (NotFoundCollage): along the strokes of "4", "0", "4", the way
// Dribbble's 404 lays shots along its digits. Positions are in a 100 × 48 box (each digit 26 wide
// and 40 tall, 7 apart), handed out as percentages. The jitter (a nudge, a small turn, a size) and
// each cover's starting depth come from a seeded generator, so the server and the browser agree.

export const BOX = { width: 100, height: 48 };
// A cover's width in box units; covers are 4:5, like the posts
export const TILE = 6.6;
const SPACING = 5.2;

export type Placement = {
  // Centre, in box units
  cx: number;
  cy: number;
  // Top-left and width as percentages of the box, for absolute positioning
  left: number;
  top: number;
  width: number;
  rotate: number;
  scale: number;
  // How far in front of the page it starts its fly-in, in px
  depth: number;
  // Its place in the writing order, for the fly-in's stagger
  order: number;
};

type Point = [number, number];

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function line(a: Point, b: Point): Point[] {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const steps = Math.max(1, Math.round(length / SPACING));
  return Array.from({ length: steps + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / steps, a[1] + ((b[1] - a[1]) * i) / steps]);
}

// Clockwise from the top, so the fly-in draws the 0 round
function ellipse(c: Point, rx: number, ry: number): Point[] {
  const perimeter = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  const steps = Math.round(perimeter / SPACING);
  return Array.from({ length: steps }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / steps;
    return [c[0] + rx * Math.cos(angle), c[1] + ry * Math.sin(angle)];
  });
}

// A 4 as it's written: down the diagonal, along the bar, then the stem
const four = (x: number, y: number) => [line([x + 19, y], [x, y + 28]), line([x, y + 28], [x + 26, y + 28]), line([x + 19, y], [x + 19, y + 40])];
const zero = (x: number, y: number) => [ellipse([x + 13, y + 20], 12, 19.5)];

export function layout404(seed = 404): Placement[] {
  const random = seeded(seed);
  const strokes = [...four(4, 4), ...zero(37, 4), ...four(70, 4)];
  const points: Point[] = [];
  for (const stroke of strokes) {
    for (const point of stroke) {
      // Where strokes meet, one cover is enough
      if (points.some((p) => Math.hypot(p[0] - point[0], p[1] - point[1]) < SPACING * 0.6)) continue;
      points.push(point);
    }
  }
  const height = TILE * 1.25;
  return points.map(([x, y], order) => {
    const cx = x + (random() - 0.5);
    const cy = y + (random() - 0.5);
    return {
      cx,
      cy,
      left: ((cx - TILE / 2) / BOX.width) * 100,
      top: ((cy - height / 2) / BOX.height) * 100,
      width: (TILE / BOX.width) * 100,
      rotate: Math.round((random() - 0.5) * 10 * 10) / 10,
      scale: Math.round((0.82 + random() * 0.18) * 1000) / 1000,
      depth: Math.round(180 + random() * 420),
      order,
    };
  });
}
