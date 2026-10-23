// Shared by the dashboard and API. Turns supported language into the catalog's existing
// filters; everything else remains full text. No model, SQL generation or silent broadening.
export type SearchVocabulary = {
  categories: { slug: string; name: string; synonyms?: readonly string[] | null }[];
  brands: { slug: string; name: string }[];
  dimensions: Record<string, { slug: string; label: string; synonyms?: readonly string[] }[]>;
};

export type Interpretation = {
  query: string;
  filters: Record<string, string | string[]>;
  labels: string[];
  corrections?: { from: string; to: string }[];
  error?: string;
};

const normalize = (s: string) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const singular = (s: string) => /(?:ches|shes|xes|zes|sses)$/.test(s) ? s.slice(0, -2) : s.replace(/ies$/, "y").replace(/(?<!s|u|i)s$/, "");
const words = (s: string) => normalize(s).split(/\s+/).filter(Boolean).map(singular);
const stop = new Set("show find me please can could would you i am want need looking look search help give like for some any a an the post posts ad ads example examples inspiration reference references social media instagram that which are is with using use uses have has in on of and from by about featuring font fonts typography layout layouts style styles industry category format".split(" "));
const dimensions = ["archetype", "archetype_family", "objective", "hook_technique", "narrative_pattern", "typography", "layout", "imagery", "palette", "visual_device", "tone", "persuasion", "cta"];
const dimensionLabels: Record<string, string> = { category: "Industry", brand: "Brand", format: "Format", archetype: "Creative approach", archetype_family: "Approach family", objective: "Goal", hook_technique: "Opening hook", narrative_pattern: "Sequence", palette: "Colour", cta: "Call to action" };
// These words are ordinary language as well as brand names. Only an exact name or explicit
// attribution ('from On') selects that brand; 'text on blue' must not become an On search.
const ambiguousBrands = new Set(["on", "public", "wise", "bolt"]);
const aliases: Record<string, Record<string, string[]>> = {
  category: { finance: ["fintech", "financial", "banking"], "food-drink": ["food", "food and drink", "food delivery", "beverage"], "travel-transportation": ["travel"], shopping: ["fashion", "ecommerce"], sports: ["sportswear"], ai: ["artificial intelligence", "technology"] },
  format: { carousel: ["carousels", "slide deck"], static: ["single image", "single-image post", "static posts"], video: ["videos", "reel", "reels"] },
  archetype: {
    "feature-launch": ["launch a feature", "launching a feature", "feature announcement", "announce a new feature", "announcing a new feature", "introducing a new feature"],
    "product-launch": ["launch a product", "launching a product", "announce a new product", "announcing a new product", "introducing a new product"],
    "product-showcase": ["showcase a product", "showcasing a product", "product shots", "hero product shots"],
    testimonial: ["customer reviews", "customer testimonials", "customer quotes"],
    collaboration: ["brand collaboration", "co branded campaign", "two brands working together"],
    tutorial: ["teaches step by step", "teach step by step"],
  },
  objective: { education: ["educational"] },
  imagery: { illustration: ["illustrated", "illustrations"], "3d-render": ["3d", "3d renders", "three dimensional"], "screenshot-ui": ["app screenshots", "ui screenshots", "app screens", "screenshots of an app"], "data-visualization": ["data visualization", "data visualizations", "graphs", "charts and graphs"] },
  layout: { "text-only": ["only text", "just text"], "text-over-image": ["text over a photo", "text over photos"], "before-after": ["before vs after"], centered: ["centered composition", "centred composition"] },
  tone: { witty: ["witty copy"], playful: ["playful copy"], luxurious: ["luxury tone"] },
  typography: { "sans-serif": ["sans serif fonts", "sans serif type"] },
};

type Candidate = { dimension: string; slug: string; label: string; phrase: string[]; priority: number };

export function interpretSearch(input: string, vocabulary: SearchVocabulary): Interpretation {
  if (input.length > 300) return { query: "", filters: {}, labels: [], error: "Keep your search under 300 characters." };
  input = input.replace(/[“”]/g, '"');
  if ((input.match(/"/g) ?? []).length % 2) return { query: "", filters: {}, labels: [], error: "Close the quotation mark to search for that exact phrase." };
  const unquoted = input.replace(/"[^"]*"/g, "");
  if (/\b(?:don['’]?t|doesn['’]?t|exclude)\b|(?:^|\s)-\w/i.test(unquoted)) {
    return { query: "", filters: {}, labels: [], error: "Exclusions aren't supported in natural search yet. Describe what you want to include." };
  }
  // Quoted phrases stay literal, even if they contain a category or taxonomy label.
  const tokens = (input.match(/"[^"]*"|[^\s"]+/g) ?? []).flatMap((raw) => raw.startsWith('"')
    ? [{ value: raw, key: raw, quoted: true }]
    : normalize(raw).split(" ").filter(Boolean).map((value) => ({ value, key: singular(value), quoted: false })));
  const candidates: Candidate[] = [];
  const add = (dimension: string, slug: string, label: string, names: readonly string[], priority: number) => {
    for (const name of names) {
      const phrase = words(name);
      if (phrase.length) candidates.push({ dimension, slug, label, phrase, priority });
    }
  };
  for (const brand of vocabulary.brands) {
    add("brand", brand.slug, brand.name, [brand.name, brand.slug, normalize(brand.name).replace(/ /g, "")], 0);
  }
  for (const category of vocabulary.categories) {
    add("category", category.slug, category.name, [category.name, category.slug, ...(category.synonyms ?? []), ...(aliases.category[category.slug] ?? [])], 1);
  }
  for (const format of ["carousel", "static", "video"]) add("format", format, format, [format, ...(aliases.format[format] ?? [])], 0);
  for (const dimension of dimensions) {
    for (const term of vocabulary.dimensions[dimension] ?? []) {
      if (["none", "unknown", "other", "mixed"].includes(term.slug)) continue;
      // Context-free hook terms like 'number' or 'quote' need not describe the opening.
      const names = dimension === "hook_technique" ? [`${term.slug} hook`, `${term.label} hook`] : [term.slug, term.label, ...(term.synonyms ?? [])];
      add(dimension, term.slug, term.label, [...names, ...(aliases[dimension]?.[term.slug] ?? [])], 2 + dimensions.indexOf(dimension));
      // Explicit qualifiers disambiguate overlapping taxonomy names and make refinement
      // queries round-trip ('education goal' must not select the Education industry).
      const qualifier = dimensionLabels[dimension]?.toLowerCase() ?? dimension.replace(/_/g, " ");
      add(dimension, term.slug, term.label, [`${term.slug} ${qualifier}`, `${term.label} ${qualifier}`], -2);
      if (dimension === "hook_technique") {
        const nouns = term.slug === "number" ? ["stat", "statistic", "number", "figure"] : [term.slug, term.label];
        for (const noun of nouns) {
          for (const verb of ["open", "opens", "start", "starts", "lead", "leads", "opening", "starting", "leading"]) {
            add(dimension, term.slug, term.label, [`${verb} with a ${noun}`, `${verb} with ${noun}`], -1);
          }
          add(dimension, term.slug, term.label, [`${noun} hook`, `${noun} led`], -1);
        }
      }
    }
  }
  candidates.sort((a, b) => b.phrase.length - a.phrase.length || a.priority - b.priority || a.slug.localeCompare(b.slug));
  const knownWords = new Set(candidates.filter((candidate) => candidate.phrase.length === 1).map((candidate) => candidate.phrase[0]));
  const used = new Set<number>();
  const filters: Interpretation["filters"] = {};
  const labels: string[] = [];
  const corrections: NonNullable<Interpretation["corrections"]> = [];
  for (let i = 0; i < tokens.length; i++) {
    if (used.has(i) || tokens[i].quoted) continue;
    const eligible = (c: Candidate) => c.phrase.every((_, j) => tokens[i + j] && !used.has(i + j) && !tokens[i + j].quoted)
      && !(c.dimension === "brand" && ambiguousBrands.has(normalize(c.label)) && tokens.length !== c.phrase.length && !["from", "by"].includes(tokens[i - 1]?.value))
      && !(c.dimension === "category" && ["collaboration", "news", "reference"].includes(c.slug) && tokens.length !== c.phrase.length && !["industry", "category"].includes(tokens[i + c.phrase.length]?.value));
    const exact = candidates.find((c) => eligible(c) && c.phrase.every((word, j) => tokens[i + j].key === word));
    // Correct one insertion/deletion/substitution/transposition in a long word only, never
    // a quote, short word, or a word already in the vocabulary. Ambiguous corrections stay
    // keywords. This is deliberately stricter than general fuzzy matching.
    const fuzzy = candidates.filter((c) => eligible(c) && (c.dimension !== "brand" || tokens.length === c.phrase.length || ["from", "by"].includes(tokens[i - 1]?.value))
      && c.phrase.length > (exact?.phrase.length ?? 0) && c.phrase.filter((word, j) => word !== tokens[i + j].key).length === 1
      && c.phrase.every((word, j) => word === tokens[i + j].key || (word.length >= 6 && tokens[i + j].key.length >= 6 && !knownWords.has(tokens[i + j].key) && oneEdit(word, tokens[i + j].key))));
    const longest = fuzzy.filter((c) => c.phrase.length === fuzzy[0]?.phrase.length);
    const unambiguous = new Set(longest.map((c) => `${c.dimension}:${c.slug}`)).size === 1 ? longest[0] : undefined;
    const candidate = unambiguous ?? exact;
    if (!candidate) continue;
    if (unambiguous) corrections.push({ from: tokens.slice(i, i + candidate.phrase.length).map((t) => t.value).join(" "), to: candidate.label });
    const { dimension, slug, label, phrase } = candidate;
    const single = ["brand", "category", "format"].includes(dimension);
    const existing = filters[dimension];
    if (existing && !(Array.isArray(existing) ? existing.includes(slug) : existing === slug)) {
      return { query: "", filters, labels, error: `Search one ${dimension === "category" ? "industry" : dimension.replace(/_/g, " ")} at a time. Use separate searches for alternatives.` };
    }
    filters[dimension] = single ? slug : [...new Set([...(filters[dimension] as string[] ?? []), slug])];
    labels.push(`${dimensionLabels[dimension] ?? dimension.replace(/_/g, " ")}: ${label}`);
    phrase.forEach((_, j) => used.add(i + j));
  }
  // Never turn 'without blue' into a positive blue filter or ignore requested dates/ordering.
  const remaining = tokens.filter((_, i) => !used.has(i));
  if (remaining.some((t) => !t.quoted && /^(not|no|without|excluding|except|or|latest|newest|recent|before|after)$/.test(t.value))) {
    return { query: "", filters, labels, error: "Use positive descriptions in one search (for example, ‘blue fintech carousels’). Exclusions, alternatives and date ordering aren't supported in natural search yet." };
  }
  const query = remaining.filter((t) => t.quoted || !stop.has(t.value)).map((t) => t.value).join(" ");
  if (!query && !Object.keys(filters).length) return { query, filters, labels, error: "Add a brand, industry, format or creative idea to search for." };
  return { query, filters, labels: [...new Set(labels)], corrections };
}

function oneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1)
    || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}
