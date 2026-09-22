/**
 * Controlled creative vocabulary (plan §8, §25).
 *
 * IDs are stable slugs; display names may change. AI or editors may only pick
 * from these lists — never invent variants. The creative-classification values
 * (objective + format + narrative + visual style) total 36, inside the plan's
 * 30–40 launch ceiling. Categories and brands are identifiers, not counted.
 */

export const TAXONOMY_VERSION = "2026-09-v1";

export type Term = { id: string; name: string; synonyms?: string[] };

/** The six launch categories (plan §32). Deferred categories are not listed. */
export const categories = [
  { id: "food-drink", name: "Food & Drink", synonyms: ["food", "drink", "beverage", "restaurant", "snack", "coffee", "soda"] },
  { id: "sports", name: "Sports", synonyms: ["sport", "sportswear", "athletic", "running", "fitness", "athlete"] },
  { id: "entertainment", name: "Entertainment", synonyms: ["film", "movie", "streaming", "gaming", "game", "show", "franchise"] },
  { id: "shopping", name: "Shopping", synonyms: ["retail", "fashion", "beauty", "marketplace", "ecommerce", "store"] },
  { id: "finance", name: "Finance", synonyms: ["bank", "banking", "payments", "fintech", "card", "money"] },
  { id: "travel-transportation", name: "Travel & Transportation", synonyms: ["travel", "airline", "flight", "hotel", "destination", "trip", "transport"] },
] as const satisfies readonly Term[];

export const objectives = [
  { id: "product-launch", name: "Product launch", synonyms: ["launch", "launches", "new product", "drop", "release"] },
  { id: "feature-announcement", name: "Feature announcement", synonyms: ["feature", "announcing", "announcement", "update"] },
  { id: "educational", name: "Educational", synonyms: ["explain", "explainer", "education", "how to", "tips", "guide", "teach"] },
  { id: "thought-leadership", name: "Thought leadership", synonyms: ["opinion", "insight", "perspective", "manifesto"] },
  { id: "testimonial", name: "Testimonial or customer story", synonyms: ["testimonial", "customer story", "review", "case study"] },
  { id: "employer-branding", name: "Employer branding", synonyms: ["employer", "hiring", "careers", "employees", "team", "culture"] },
  { id: "event", name: "Event", synonyms: ["event", "premiere", "live", "festival", "tournament"] },
  { id: "promotion", name: "Promotion", synonyms: ["sale", "discount", "offer", "promo", "deal", "seasonal"] },
  { id: "brand-storytelling", name: "Brand storytelling", synonyms: ["story", "storytelling", "heritage", "campaign", "brand film"] },
  { id: "community-engagement", name: "Community engagement", synonyms: ["community", "fans", "ugc", "poll", "question", "engagement"] },
] as const satisfies readonly Term[];

/** Composition-led format. Static vs carousel lives in `media_type`, not here. */
export const formats = [
  { id: "graphic", name: "Graphic", synonyms: ["graphic", "poster"] },
  { id: "infographic", name: "Infographic", synonyms: ["infographic", "diagram"] },
  { id: "quote", name: "Quote", synonyms: ["quote", "quotation"] },
  { id: "product-ui", name: "Product UI", synonyms: ["ui", "app", "screen", "interface", "screenshot"] },
  { id: "photo-led", name: "Photo-led", synonyms: ["photo", "photography", "photos", "image"] },
  { id: "illustration-led", name: "Illustration-led", synonyms: ["illustrated", "illustration", "drawing"] },
  { id: "data-visualisation", name: "Data visualisation", synonyms: ["data", "chart", "stats", "statistics", "numbers"] },
  { id: "mixed-media", name: "Mixed media", synonyms: ["mixed media", "mixed"] },
] as const satisfies readonly Term[];

export const narratives = [
  { id: "problem-solution", name: "Problem–solution", synonyms: ["problem", "solution", "pain point"] },
  { id: "hook-explanation-cta", name: "Hook–explanation–CTA", synonyms: ["hook"] },
  { id: "listicle", name: "Listicle", synonyms: ["list", "listicle", "top", "reasons", "steps"] },
  { id: "before-after", name: "Before–after", synonyms: ["before after", "before and after", "transformation"] },
  { id: "comparison", name: "Comparison", synonyms: ["comparison", "compare", "versus", "vs"] },
  { id: "story-journey", name: "Story or journey", synonyms: ["journey", "narrative", "behind the scenes"] },
  { id: "claim-proof", name: "Claim–proof", synonyms: ["claim", "proof", "evidence"] },
  { id: "announcement-benefits-cta", name: "Announcement–benefits–CTA", synonyms: ["benefits"] },
] as const satisfies readonly Term[];

export const visualStyles = [
  { id: "minimal", name: "Minimal", synonyms: ["minimal", "minimalist", "clean", "simple", "little text", "whitespace"] },
  { id: "editorial", name: "Editorial", synonyms: ["editorial", "magazine", "serif", "warm editorial"] },
  { id: "bold-typography", name: "Bold typography", synonyms: ["bold typography", "bold type", "big type", "typographic", "typography", "bold"] },
  { id: "swiss-systematic", name: "Swiss / systematic", synonyms: ["swiss", "grid", "systematic", "modular"] },
  { id: "playful", name: "Playful", synonyms: ["playful", "fun", "colourful", "colorful", "quirky"] },
  { id: "collage", name: "Collage", synonyms: ["collage", "cutout", "scrapbook"] },
  { id: "3d", name: "3D", synonyms: ["3d", "render", "cgi"] },
  { id: "illustration", name: "Illustration", synonyms: ["illustrative", "hand drawn"] },
  { id: "photography-led", name: "Photography-led", synonyms: ["product photography", "lifestyle photography", "lifestyle"] },
  { id: "product-first", name: "Product-first", synonyms: ["product shot", "packshot", "product-first", "hero product"] },
] as const satisfies readonly Term[];

export const mediaTypes = [
  { id: "static", name: "Static", synonyms: ["static", "single image", "single post"] },
  { id: "carousel", name: "Carousel", synonyms: ["carousel", "carousels", "slides", "multi-slide"] },
] as const satisfies readonly Term[];

export const textDensities = [
  { id: "low", name: "Low text", synonyms: ["low text", "little text", "minimal text", "no text"] },
  { id: "medium", name: "Medium text" },
  { id: "high", name: "Text-heavy", synonyms: ["text heavy", "text-heavy", "lots of text", "copy heavy"] },
] as const satisfies readonly Term[];

export const ctaTypes = [
  { id: "shop-now", name: "Shop now" },
  { id: "learn-more", name: "Learn more" },
  { id: "sign-up", name: "Sign up" },
  { id: "book-now", name: "Book now" },
  { id: "watch", name: "Watch" },
  { id: "none", name: "No explicit CTA" },
] as const satisfies readonly Term[];

export type CategoryId = (typeof categories)[number]["id"];
export type ObjectiveId = (typeof objectives)[number]["id"];
export type FormatId = (typeof formats)[number]["id"];
export type NarrativeId = (typeof narratives)[number]["id"] | "not_applicable" | "unknown";
export type VisualStyleId = (typeof visualStyles)[number]["id"];
export type MediaType = (typeof mediaTypes)[number]["id"];
export type TextDensity = (typeof textDensities)[number]["id"];
export type CtaType = (typeof ctaTypes)[number]["id"];

/** Filter dimensions exposed to search, in display order. */
export const filterDimensions = {
  category: { label: "Category", terms: categories },
  objective: { label: "Objective", terms: objectives },
  mediaType: { label: "Media type", terms: mediaTypes },
  format: { label: "Format", terms: formats },
  visualStyle: { label: "Visual style", terms: visualStyles },
  narrative: { label: "Structure", terms: narratives },
  textDensity: { label: "Text density", terms: textDensities },
} as const;

export type FilterDimension = keyof typeof filterDimensions;

const allTerms: Record<string, readonly Term[]> = {
  ...Object.fromEntries(Object.entries(filterDimensions).map(([k, v]) => [k, v.terms])),
  cta: ctaTypes,
};

export function termName(dimension: FilterDimension | "cta", id: string | null | undefined) {
  if (!id) return null;
  if (id === "not_applicable") return "Not applicable";
  if (id === "unknown") return "Unknown";
  return allTerms[dimension]?.find((term) => term.id === id)?.name ?? id;
}

export function isValidTerm(dimension: FilterDimension, id: string) {
  return filterDimensions[dimension].terms.some((term) => term.id === id);
}
