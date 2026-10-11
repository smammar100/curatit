// Creative Intelligence: the SQL that writes the taxonomy (taxonomy.ts) into
// public.creative_taxonomy_terms. Its output is pasted into a migration whenever the vocabulary
// changes (`npm run -s creative -- taxonomy-sql`); a test checks the migrations hold every current term.
import { DIMENSIONS, TAXONOMY_VERSION } from "./taxonomy";

const quote = (value: string | null | undefined) => (value == null ? "null" : `'${value.replace(/'/g, "''")}'`);
const array = (list?: readonly string[]) => (list?.length ? `array[${list.map(quote).join(", ")}]` : "'{}'::text[]");

// Archetypes sit under families; no other dimension nests
const PARENT_DIMENSION: Partial<Record<string, string>> = { archetype: "archetype_family" };

export function taxonomySql() {
  const rows: string[] = [];
  for (const [dimension, terms] of Object.entries(DIMENSIONS)) {
    for (const term of terms) {
      const parentDimension = term.parent ? (PARENT_DIMENSION[dimension] ?? null) : null;
      rows.push(
        `(${[quote(dimension), quote(term.slug), quote(term.label), quote(term.description), quote(parentDimension), quote(term.parent ?? null), array(term.synonyms), quote(term.criteria ?? null), quote(TAXONOMY_VERSION)].join(", ")})`,
      );
    }
  }
  return [
    `-- Taxonomy ${TAXONOMY_VERSION}, generated from src/lib/creative/taxonomy.ts`,
    "insert into public.creative_taxonomy_terms",
    "  (dimension, slug, label, description, parent_dimension, parent_slug, synonyms, criteria, taxonomy_version)",
    "values",
    `  ${rows.join(",\n  ")}`,
    "on conflict (dimension, slug) do update set",
    "  label = excluded.label, description = excluded.description, parent_dimension = excluded.parent_dimension,",
    "  parent_slug = excluded.parent_slug, synonyms = excluded.synonyms, criteria = excluded.criteria,",
    "  taxonomy_version = excluded.taxonomy_version, retired_at = null;",
    "",
    "-- Terms the current version no longer has stay (old analyses point at them) but are retired",
    `update public.creative_taxonomy_terms set retired_at = now() where taxonomy_version <> ${quote(TAXONOMY_VERSION)} and retired_at is null;`,
    "",
  ].join("\n");
}
