// Explicit, one-click alternatives. These are never run automatically and do not claim
// matches exist. Keep each still-active constraint when proposing removal of another.
export type SearchRefinement = { label: string; query: string };
const qualifiers: Record<string, string> = {
  archetype: "creative approach", archetype_family: "approach family", objective: "goal",
  hook_technique: "opening hook", narrative_pattern: "sequence", palette: "colour", cta: "call to action",
};
const labels: Record<string, string> = { category: "industry", brand: "brand", format: "format", ...qualifiers };

export function searchRefinements(filters: Record<string, string | string[]>, keywords: string): SearchRefinement[] {
  const entries = Object.entries(filters);
  if (entries.some(([, value]) => Array.isArray(value) && value.length !== 1)) return [];
  const render = (items: typeof entries, text: string) => [...items.map(([key, value]) => {
    const slug = Array.isArray(value) ? value[0] : value;
    if (key === "brand") return `from ${slug}`;
    if (key === "category") return `${slug} industry`;
    if (key === "format") return slug;
    return `${slug} ${qualifiers[key] ?? key.replace(/_/g, " ")}`;
  }), text, "posts"].filter(Boolean).join(" ");
  const out: SearchRefinement[] = [];
  if (keywords && entries.length) out.push({ label: "Search these filters without keywords", query: render(entries, "") });
  // Prefer dropping creative constraints before the explicitly requested brand or industry.
  const priority = (key: string) => ["category", "brand", "format"].includes(key) ? 1 : 0;
  for (const [key] of [...entries].sort(([a], [b]) => priority(a) - priority(b))) {
    if (entries.length === 1 && !keywords) continue;
    out.push({ label: `Remove ${labels[key] ?? key.replace(/_/g, " ")} filter`, query: render(entries.filter(([other]) => other !== key), keywords) });
  }
  return out.filter((item) => item.query.length <= 300).slice(0, 3);
}
