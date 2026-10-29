// The library's categories, after Mobbin's app categories (2026-10-13): the same 28 as the
// `categories` table, in its `position` order, then Others (position 30), a catch-all for brands
// none of them fits (GoFundMe, filed there in the database on 2026-10-21, listed here on 2026-10-29
// at the owner's request so Discover has a tab for it). Each has a hue for its swatch, tab and folder
// (OKLCH; lightness and chroma are shared by whoever draws it). A brand has one main category
// and may carry extra ones as post tags, so a post can be in several: `post.categories`, main
// first. The site lists only the categories that have posts. Imported by client code: no Node.

// `catchAll`: Others. Discover, the search chips and a post's chips list it; the homepage's tabs,
// the welcome flow's industries and the Vision graph leave it out, where it reads as no answer
export type CategoryDef = { slug: string; name: string; hue: number; catchAll?: true };

export const CATEGORIES: CategoryDef[] = [
  { slug: "ai", name: "AI", hue: 300 },
  { slug: "business", name: "Business", hue: 268 },
  { slug: "collaboration", name: "Collaboration", hue: 222 },
  { slug: "communication", name: "Communication", hue: 192 },
  { slug: "crm", name: "CRM", hue: 252 },
  { slug: "crypto-web3", name: "Crypto & Web3", hue: 80 },
  { slug: "developer-tools", name: "Developer Tools", hue: 282 },
  { slug: "education", name: "Education", hue: 62 },
  { slug: "entertainment", name: "Entertainment", hue: 318 },
  { slug: "finance", name: "Finance", hue: 175 },
  { slug: "food-drink", name: "Food & Drink", hue: 35 },
  { slug: "graphics-design", name: "Graphics & Design", hue: 345 },
  { slug: "health-fitness", name: "Health & Fitness", hue: 150 },
  { slug: "jobs-recruitment", name: "Jobs & Recruitment", hue: 100 },
  { slug: "lifestyle", name: "Lifestyle", hue: 5 },
  { slug: "maps-navigation", name: "Maps & Navigation", hue: 160 },
  { slug: "medical", name: "Medical", hue: 15 },
  { slug: "music-audio", name: "Music & Audio", hue: 290 },
  { slug: "news", name: "News", hue: 50 },
  { slug: "photo-video", name: "Photo & Video", hue: 310 },
  { slug: "productivity", name: "Productivity", hue: 205 },
  { slug: "real-estate", name: "Real Estate", hue: 120 },
  { slug: "reference", name: "Reference", hue: 70 },
  { slug: "shopping", name: "Shopping", hue: 330 },
  { slug: "social-networking", name: "Social Networking", hue: 232 },
  { slug: "sports", name: "Sports", hue: 135 },
  { slug: "travel-transportation", name: "Travel & Transportation", hue: 240 },
  { slug: "utilities", name: "Utilities", hue: 90 },
  { slug: "others", name: "Others", hue: 110, catchAll: true },
];

const BY_SLUG = new Map(CATEGORIES.map((category) => [category.slug, category]));
export const categoryBySlug = (slug: string) => BY_SLUG.get(slug) ?? null;

// The original seven and what each became (the same mapping the …_app_categories migration
// applied to saved onboarding answers): an answer from before the change becomes all of these,
// and a link to one opens the first
export const OLD_CATEGORIES: Record<string, string[]> = {
  fintech: ["finance", "crypto-web3"],
  "food-delivery": ["food-drink"],
  sportswear: ["sports"],
  technology: ["ai"],
  travel: ["travel-transportation"],
  ecommerce: ["shopping", "business"],
  fashion: ["shopping", "lifestyle"],
};
export const OLD_SLUGS: Record<string, string> = Object.fromEntries(Object.entries(OLD_CATEGORIES).map(([old, next]) => [old, next[0]]));

// Saved answers in today's slugs, in order, once each
export const currentSlugs = (slugs: string[]) => [...new Set(slugs.flatMap((slug) => OLD_CATEGORIES[slug] ?? [slug]))];

// The original seven's names, so a search for one still finds the posts now filed under these
export const OLD_NAMES: Record<string, string[]> = {
  finance: ["Fintech"],
  "crypto-web3": ["Fintech"],
  ai: ["Technology"],
  sports: ["Sportswear"],
  shopping: ["E-commerce", "Fashion"],
  lifestyle: ["Fashion"],
  business: ["E-commerce"],
  "travel-transportation": ["Travel"],
};

type Tagged = { category: { slug: string }; categories: { slug: string }[] };

export const inCategory = (post: Pick<Tagged, "categories">, slug: string) => post.categories.some((category) => category.slug === slug);

// The categories with at least `min` posts, in CATEGORIES order. A post counts in each of its
// categories, or with `main` in its brand's main category alone (the homepage's tabs, where a
// tag-only category would repeat another tab's posts)
export function categoriesWithPosts(posts: Tagged[], { min = 1, main = false, catchAll = true }: { min?: number; main?: boolean; catchAll?: boolean } = {}): CategoryDef[] {
  const counts = new Map<string, number>();
  for (const post of posts) for (const { slug } of main ? [post.category] : post.categories) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  return CATEGORIES.filter((category) => (catchAll || !category.catchAll) && (counts.get(category.slug) ?? 0) >= min);
}
