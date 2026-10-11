// Creative Intelligence: a slide's colours, measured from its pixels rather than guessed by the
// model. The pixels are binned (four bits a channel), the bins grouped greedily by distance from
// the largest down, and a group that only sits on the blend between two others (anti-aliased
// type, a thin line or a gridline over its background) is dropped, judged against every other
// group, not just bigger ones: cream type on a dark ground covers less of the image than its own
// soft edges do. What's left is the colours a designer would pick out (the ground, the type, the
// accents), largest first, each with its share of the image.
export type Swatch = { hex: string; share: number };

type Group = { n: number; r: number; g: number; b: number };

const mean = (group: Group) => [group.r / group.n, group.g / group.n, group.b / group.n] as const;

// "Redmean": a cheap distance closer to how far apart two colours look than plain RGB
export function distance(a: readonly number[], b: readonly number[]) {
  const r = (a[0] + b[0]) / 2;
  const [dr, dg, db] = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  return Math.sqrt((2 + r / 256) * dr * dr + 4 * dg * dg + (2 + (255 - r) / 256) * db * db);
}

// How far a colour sits from the straight blend between two others
function offBlend(c: readonly number[], a: readonly number[], b: readonly number[]) {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const length = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
  if (!length) return distance(c, a);
  const t = Math.max(0, Math.min(1, ((c[0] - a[0]) * ab[0] + (c[1] - a[1]) * ab[1] + (c[2] - a[2]) * ab[2]) / length));
  if (t < 0.1 || t > 0.9) return Infinity;
  return distance(c, [a[0] + t * ab[0], a[1] + t * ab[1], a[2] + t * ab[2]]);
}

export const hexOf = (rgb: readonly number[]) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
export const rgbOf = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function dominantColours(pixels: Uint8Array, channels: number, options: { max?: number; minShare?: number; merge?: number } = {}): Swatch[] {
  const { max = 6, minShare = 0.004, merge = 72 } = options;
  const bins = new Map<number, Group>();
  let total = 0;
  for (let i = 0; i + 2 < pixels.length; i += channels) {
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bin = bins.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bin.n++;
    bin.r += r;
    bin.g += g;
    bin.b += b;
    bins.set(key, bin);
    total++;
  }
  if (!total) return [];

  const groups: Group[] = [];
  for (const bin of [...bins.values()].sort((a, b) => b.n - a.n)) {
    const colour = mean(bin);
    const home = groups.find((group) => distance(mean(group), colour) < merge);
    if (home) {
      home.n += bin.n;
      home.r += bin.r;
      home.g += bin.g;
      home.b += bin.b;
    } else groups.push({ ...bin });
  }
  groups.sort((a, b) => b.n - a.n);

  const candidates = groups.filter((group) => group.n / total >= minShare).slice(0, 16);
  // The two largest groups are never blends; any other is when it lies between two others. So a
  // flat in-between colour bigger than the type it sits between is kept, and a mid-grey smaller
  // than the black and white around it is read as their blend
  const blend = (group: Group, i: number) =>
    i >= 2 && candidates.some((a, j) => j !== i && candidates.some((b, k) => k > j && k !== i && offBlend(mean(group), mean(a), mean(b)) < merge / 2));
  const kept = candidates.filter((group, i) => !blend(group, i)).slice(0, max);
  return kept.map((group) => ({ hex: hexOf(mean(group)), share: Math.round((group.n / total) * 1000) / 1000 }));
}
