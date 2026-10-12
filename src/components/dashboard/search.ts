// The dashboard's search: how a query matches a post, and when it names a brand. Shared by the
// feed (Feed) and the search panel (SearchBox), kept apart from both so neither imports the other.
import type { DashPost } from "./types";

// Search text with the punctuation and accents taken out, so "coca cola" finds Coca-Cola and
// "h&m" or "hm" finds H&M; `compact` also drops the spaces ("ubereats", "uber eats")
export const normalise = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
export const compact = (s: string) => normalise(s).replace(/ /g, "");

// Every word of the query appears in the post's hook, brand, category or format, or the query is
// the brand's name however it's spaced
export function matches(post: DashPost, query: string) {
  const words = normalise(query).split(" ").filter(Boolean);
  const text = normalise(`${post.hook} ${post.brand.name} ${post.category.name} ${post.format}`);
  return words.every((word) => text.includes(word)) || compact(post.brand.name) === compact(query);
}

// The brand a query names exactly (by name or slug), if any: that search shows the brand's posts
// alone, not every hook that happens to share the word ("Public")
export function brandNamed(posts: DashPost[], query: string) {
  const q = compact(query);
  if (!q) return null;
  return posts.find((post) => compact(post.brand.name) === q || compact(post.brand.slug) === q)?.brand ?? null;
}
