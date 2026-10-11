// How the For you feed orders the library on someone's onboarding answers (profile.tsx), and
// what their taste picks have in common. Shared by the feed and the welcome flow's live wall,
// so what the flow shows is what the feed does.
import type { DashPost } from "./types";

export type Taste = { industries: string[]; brands: string[]; taste: string[] };

// An industry they picked counts most, then a brand they follow, then what the posts they tapped
// have in common (brand, industry, format). Ties keep the feed's own order, so nothing shuffles
// for no reason, and with no answers the order is unchanged.
export function rank<P extends DashPost>(posts: P[], a: Taste): P[] {
  if (!a.industries.length && !a.brands.length && !a.taste.length) return posts;
  const liked = a.taste.flatMap((code) => posts.find((p) => p.shortCode === code) ?? []);
  const likedBrands = new Set(liked.map((p) => p.brand.slug));
  const likedCategories = new Set(liked.map((p) => p.category.slug));
  const likedFormats = new Set(liked.map((p) => p.format));
  const score = (p: DashPost) =>
    (a.industries.includes(p.category.slug) ? 3 : 0) +
    (a.brands.includes(p.brand.slug) ? 2 : 0) +
    (likedBrands.has(p.brand.slug) ? 2 : 0) +
    (likedCategories.has(p.category.slug) ? 1 : 0) +
    (likedFormats.has(p.format) ? 1 : 0);
  return posts
    .map((p, i) => ({ p, s: score(p), i }))
    .sort((x, y) => y.s - x.s || x.i - y.i)
    .map((x) => x.p);
}

const FORMAT_NAMES = { carousel: "Carousels", video: "Videos", static: "Single images" } as const;

// What the taste picks say, most common first: industries, brands, and a format once two picks
// share it
export function learned(posts: DashPost[], taste: string[]) {
  const liked = taste.flatMap((code) => posts.find((p) => p.shortCode === code) ?? []);
  const tally = <T,>(items: T[], key: (item: T) => string) => {
    const counts = new Map<string, { item: T; n: number }>();
    for (const item of items) {
      const k = key(item);
      counts.set(k, { item, n: (counts.get(k)?.n ?? 0) + 1 });
    }
    return [...counts.values()].sort((a, b) => b.n - a.n);
  };
  return {
    categories: tally(liked, (p) => p.category.slug).map(({ item }) => ({ slug: item.category.slug, name: item.category.name })),
    brands: tally(liked, (p) => p.brand.slug).map(({ item }) => ({ slug: item.brand.slug, name: item.brand.name })),
    formats: tally(liked, (p) => p.format)
      .filter(({ n }) => n >= 2)
      .map(({ item }) => FORMAT_NAMES[item.format]),
  };
}

// The chips the flow shows as you tap: two industries, two brands, one format
export function learnedChips(posts: DashPost[], taste: string[], max = 5) {
  const l = learned(posts, taste);
  return [...l.categories.slice(0, 2).map((c) => c.name), ...l.brands.slice(0, 2).map((b) => b.name), ...l.formats.slice(0, 1)].slice(0, max);
}
