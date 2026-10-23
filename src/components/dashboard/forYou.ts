// How the For you feed orders the library on someone's onboarding answers (profile.tsx), and
// what their taste picks have in common. Shared by the feed and the welcome flow's live wall,
// so what the flow shows is what the feed does.
import type { DashPost } from "./types";

export type Taste = { industries: string[]; brands: string[]; taste: string[] };

// An industry they picked counts most (a post is in its brand's main category and its extra tags), then a brand they follow, then what the posts they tapped
// have in common (brand, industry, format). Ties keep the feed's own order (newest imports first),
// so nothing shuffles for no reason, and with no answers the order is unchanged. `library` is
// where the tapped posts are looked up: the whole library, even when `posts` is a search's
// results. With `fresh` (the feed, 2026-10-12), posts from the library's newest import day count 3
// as well, as much as a picked industry, so a new import is seen whatever the answers; "newest"
// is read from the library, not the clock, so the server and the browser agree.
export function rank<P extends DashPost>(posts: P[], a: Taste, library: DashPost[] = posts, { fresh = false }: { fresh?: boolean } = {}): P[] {
  if (!a.industries.length && !a.brands.length && !a.taste.length) return posts;
  const newestDay = fresh ? library.reduce((max, p) => (p.addedAt > max ? p.addedAt : max), "").slice(0, 10) : null;
  const liked = a.taste.flatMap((code) => library.find((p) => p.shortCode === code) ?? []);
  const likedBrands = new Set(liked.map((p) => p.brand.slug));
  const likedCategories = new Set(liked.map((p) => p.category.slug));
  const likedFormats = new Set(liked.map((p) => p.format));
  const inAny = (p: DashPost, slugs: { has: (slug: string) => boolean }) => p.categories.some((category) => slugs.has(category.slug));
  const picked = new Set(a.industries);
  const score = (p: DashPost) =>
    (inAny(p, picked) ? 3 : 0) +
    (a.brands.includes(p.brand.slug) ? 2 : 0) +
    (likedBrands.has(p.brand.slug) ? 2 : 0) +
    (inAny(p, likedCategories) ? 1 : 0) +
    (likedFormats.has(p.format) ? 1 : 0) +
    (newestDay && p.addedAt.startsWith(newestDay) ? 3 : 0);
  return posts
    .map((p, i) => ({ p, s: score(p), i }))
    .sort((x, y) => y.s - x.s || x.i - y.i)
    .map((x) => x.p);
}

// Keeps the order but never lets a brand come back within `gap` places while another brand could
// go there instead, so one brand's run of posts (a new import, or a brand the answers favour) can't
// fill a row. A brand with nothing else left to place keeps its order at the end
export function spread<P extends { brand: { slug: string } }>(posts: P[], gap: number): P[] {
  const rest = [...posts];
  const out: P[] = [];
  while (rest.length) {
    const recent = new Set(out.slice(-gap).map((post) => post.brand.slug));
    const i = rest.findIndex((post) => !recent.has(post.brand.slug));
    out.push(rest.splice(i === -1 ? 0 : i, 1)[0]);
  }
  return out;
}
