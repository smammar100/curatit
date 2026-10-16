// curatit_get_taxonomy: the values every filter accepts, read from the catalog (industries and
// brands from their tables, the creative dimensions from the taxonomy terms with how many
// published analyses use each), and the dimensions the catalog doesn't have, named.

import { FILTERS, TAXONOMY_DIMENSIONS, type TaxonomyDimension, type TaxonomyInputT, type TaxonomyOutputT } from "../contracts";
import type { CatalogRepository } from "../repo/types";

// The taxonomy's own names for the dimensions whose public name differs
const TERM_DIMENSION: Partial<Record<TaxonomyDimension, string>> = {
  goal: "objective",
  creative_approach: "archetype",
  approach_family: "archetype_family",
};

export const NOT_AVAILABLE = [
  "theme_or_occasion: the catalog doesn't label seasonal or occasion themes (Halloween, Black Friday...). Search the caption with `query` instead.",
  "platform: every post is from Instagram.",
];

export async function getTaxonomy(repo: CatalogRepository, input: TaxonomyInputT): Promise<{ data: TaxonomyOutputT; taxonomyVersion: string | null }> {
  const wanted = TAXONOMY_DIMENSIONS.filter((d) => !input.dimension || d.dimension === input.dimension);
  const needsTerms = wanted.some((d) => !["industry", "brand", "format"].includes(d.dimension));
  const [terms, categories, brands] = await Promise.all([
    needsTerms ? repo.terms() : Promise.resolve(null),
    wanted.some((d) => d.dimension === "industry") ? repo.categories() : Promise.resolve([]),
    wanted.some((d) => d.dimension === "brand") ? repo.brands() : Promise.resolve([]),
  ]);

  const dimensions: TaxonomyOutputT["dimensions"] = wanted.map(({ dimension, filter }) => {
    const base = { dimension, filter, single_value: FILTERS[filter].single, description: FILTERS[filter].description };
    // Counts and everyday names come from curatit_mcp_taxonomy where it has them
    // (…_mcp_category_resolution); null where the database doesn't count yet
    if (dimension === "industry") {
      return {
        ...base,
        values: categories.map((c) => ({
          slug: c.slug,
          label: c.name,
          description: c.description,
          parent: null,
          synonyms: c.synonyms ?? [],
          posts: typeof c.posts === "number" ? c.posts : null,
          main_posts: typeof c.main_posts === "number" ? c.main_posts : null,
        })),
      };
    }
    if (dimension === "brand") {
      return {
        ...base,
        values: brands.map((b) => ({
          slug: b.slug,
          label: b.name,
          description: b.category ? `Industry: ${b.category}` : null,
          parent: b.category,
          synonyms: [],
          posts: typeof b.posts === "number" ? b.posts : null,
        })),
      };
    }
    if (dimension === "format") {
      return {
        ...base,
        values: [
          { slug: "static", label: "Single image", description: "One image.", parent: null, synonyms: ["image", "single"], posts: null },
          { slug: "carousel", label: "Carousel", description: "Several slides, swiped through.", parent: null, synonyms: ["sidecar"], posts: null },
          { slug: "video", label: "Video", description: "A video post; the library keeps only its cover frame, and holds none today.", parent: null, synonyms: ["reel"], posts: null },
        ],
      };
    }
    const key = TERM_DIMENSION[dimension] ?? dimension;
    const values = (terms?.dimensions[key] ?? []).map((t) => ({
      slug: t.slug,
      label: t.label,
      description: t.description,
      parent: t.parent,
      synonyms: t.synonyms ?? [],
      posts: typeof t.posts === "number" ? t.posts : null,
    }));
    return { ...base, values };
  });

  return {
    data: { taxonomy_version: terms?.taxonomy_version ?? null, dimensions, not_available: NOT_AVAILABLE },
    taxonomyVersion: terms?.taxonomy_version ?? null,
  };
}
