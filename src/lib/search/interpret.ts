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
  // How part of the sentence was read other than as a filter, for the caller to pass on
  notes?: string[];
  error?: string;
};

const normalize = (s: string) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const singular = (s: string) => /(?:ches|shes|xes|zes|sses)$/.test(s) ? s.slice(0, -2) : s.replace(/ies$/, "y").replace(/(?<!s|u|i)s$/, "");
const words = (s: string) => normalize(s).split(/\s+/).filter(Boolean).map(singular);
const stop = new Set(("show find me please can could would you i am want need looking look search help give like for some any a an the post posts ad ads example examples inspiration reference references social media instagram that which are is with using use uses have has in on of and from by about featuring font fonts typography layout layouts style styles industry category format"
  // What designers and assistants add around the idea itself (2026-10-25): left as keywords, every
  // one had to appear in a post, so 'Halloween campaign' or 'educational finance content' found nothing
  + " brand brands campaign campaigns content contents creative creatives idea ideas inspo concept concepts lot lots something thing things stuff how to what kind kinds type types good great best nice cool really very strong modern design designs visual visuals colour colours color colors palette palettes background backgrounds messaging message messages drive drives get gets boost more").split(" "));
// Ordinary words that are also a whole industry or approach family narrow a sentence to almost
// nothing ('memes from food brands' became the Brand family); alone they still select it
const generic = new Set(["category:graphics-design", "archetype_family:brand", "archetype_family:product"]);
const dimensions = ["archetype", "archetype_family", "objective", "hook_technique", "narrative_pattern", "typography", "layout", "imagery", "palette", "visual_device", "tone", "persuasion", "cta"];
const dimensionLabels: Record<string, string> = { category: "Industry", brand: "Brand", format: "Format", archetype: "Creative approach", archetype_family: "Approach family", objective: "Goal", hook_technique: "Opening hook", narrative_pattern: "Sequence", palette: "Colour", cta: "Call to action" };
// These words are ordinary language as well as brand names. Only an exact name or explicit
// attribution ('from On') selects that brand; 'text on blue' must not become an On search.
const ambiguousBrands = new Set(["on", "public", "wise", "bolt"]);
const aliases: Record<string, Record<string, string[]>> = {
  category: { finance: ["fintech", "financial", "banking"], "food-drink": ["food", "food and drink", "food delivery", "beverage"], "travel-transportation": ["travel"], shopping: ["fashion", "ecommerce"], sports: ["sportswear"], ai: ["artificial intelligence", "technology", "tech"] },
  format: { carousel: ["carousels", "slide deck"], static: ["single image", "single-image post", "static posts"], video: ["videos", "reel", "reels"] },
  archetype: {
    "feature-launch": ["launch a feature", "launching a feature", "feature announcement", "announce a new feature", "announcing a new feature", "introducing a new feature"],
    "product-launch": ["launch a product", "launching a product", "announce a new product", "announcing a new product", "introducing a new product"],
    "product-showcase": ["showcase a product", "showcasing a product", "product shots", "hero product shots"],
    testimonial: ["customer reviews", "customer testimonials", "customer quotes"],
    collaboration: ["brand collaboration", "co branded campaign", "two brands working together"],
    tutorial: ["teaches step by step", "teach step by step"],
    "ugc-repost": ["user generated content", "ugc"],
    "community-prompt": ["ask a question", "asks a question", "asking a question", "ask questions", "asks questions"],
    explainer: ["explain", "explains", "explaining", "explained"],
    "sale-offer": ["sale"],
  },
  objective: { education: ["educational"] },
  imagery: { illustration: ["illustrated", "illustrations"], "3d-render": ["3d", "3d renders", "three dimensional"], "screenshot-ui": ["app screenshots", "ui screenshots", "app screens", "screenshots of an app", "screenshot", "ui"], "data-visualization": ["data visualization", "data visualizations", "graphs", "charts and graphs", "chart", "infographic"] },
  layout: { "text-only": ["only text", "just text"], "text-over-image": ["text over a photo", "text over photos"], "before-after": ["before vs after"], centered: ["centered composition", "centred composition"] },
  tone: { witty: ["witty copy"], playful: ["playful copy"], luxurious: ["luxury tone"], minimal: ["minimalist", "minimalism", "white space", "whitespace", "clean"], inspirational: ["motivational", "motivation", "inspiring"] },
  typography: { "sans-serif": ["sans serif fonts", "sans serif type"] },
  narrative_pattern: { "story-arc": ["storytelling", "narrative"] },
  persuasion: { empathy: ["emotional", "emotion", "emotive", "heartfelt"], humor: ["funny", "humorous", "hilarious", "joke"] },
  palette: { black: ["dark background", "dark mode"] },
};

// `fuzzy`: a typo may be corrected to this name. Names and the aliases above, not the database's
// own synonyms, which include everyday words ('content' was corrected to the giveaway's 'contest')
type Candidate = { dimension: string; slug: string; label: string; phrase: string[]; priority: number; fuzzy: boolean };

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
  const add = (dimension: string, slug: string, label: string, names: readonly string[], priority: number, fuzzy = true) => {
    for (const name of names) {
      const phrase = words(name);
      if (phrase.length) candidates.push({ dimension, slug, label, phrase, priority, fuzzy });
    }
  };
  for (const brand of vocabulary.brands) {
    add("brand", brand.slug, brand.name, [brand.name, brand.slug, normalize(brand.name).replace(/ /g, "")], 0);
  }
  for (const category of vocabulary.categories) {
    add("category", category.slug, category.name, [category.name, category.slug, ...(aliases.category[category.slug] ?? [])], 1);
    add("category", category.slug, category.name, category.synonyms ?? [], 1, false);
  }
  for (const format of ["carousel", "static", "video"]) add("format", format, format, [format, ...(aliases.format[format] ?? [])], 0);
  for (const dimension of dimensions) {
    for (const term of vocabulary.dimensions[dimension] ?? []) {
      if (["none", "unknown", "other", "mixed"].includes(term.slug)) continue;
      // Context-free hook terms like 'number' or 'quote' need not describe the opening.
      const names = dimension === "hook_technique" ? [`${term.slug} hook`, `${term.label} hook`] : [term.slug, term.label];
      add(dimension, term.slug, term.label, [...names, ...(aliases[dimension]?.[term.slug] ?? [])], 2 + dimensions.indexOf(dimension));
      if (dimension !== "hook_technique") add(dimension, term.slug, term.label, term.synonyms ?? [], 2 + dimensions.indexOf(dimension), false);
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
  // Words kept as keywords on purpose (a second creative approach), never matched again
  const kept = new Set<number>();
  const filters: Interpretation["filters"] = {};
  const labels: string[] = [];
  const chosen: Record<string, string> = {};
  const corrections: NonNullable<Interpretation["corrections"]> = [];
  const notes: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (used.has(i) || kept.has(i) || tokens[i].quoted) continue;
    const eligible = (c: Candidate) => c.phrase.every((_, j) => tokens[i + j] && !used.has(i + j) && !kept.has(i + j) && !tokens[i + j].quoted)
      && !(c.dimension === "brand" && ambiguousBrands.has(normalize(c.label)) && tokens.length !== c.phrase.length && !["from", "by"].includes(tokens[i - 1]?.value))
      && !(c.dimension === "category" && ["collaboration", "news", "reference"].includes(c.slug) && tokens.length !== c.phrase.length && !["industry", "category"].includes(tokens[i + c.phrase.length]?.value))
      && !(c.phrase.length === 1 && generic.has(`${c.dimension}:${c.slug}`) && tokens.length !== 1);
    const exact = candidates.find((c) => eligible(c) && c.phrase.every((word, j) => tokens[i + j].key === word));
    // Correct one insertion/deletion/substitution/transposition in a long word only, never
    // a quote, short word, or a word already in the vocabulary. Ambiguous corrections stay
    // keywords. This is deliberately stricter than general fuzzy matching.
    const fuzzy = candidates.filter((c) => c.fuzzy && eligible(c) && (c.dimension !== "brand" || tokens.length === c.phrase.length || ["from", "by"].includes(tokens[i - 1]?.value))
      && c.phrase.length > (exact?.phrase.length ?? 0) && c.phrase.filter((word, j) => word !== tokens[i + j].key).length === 1
      && c.phrase.every((word, j) => word === tokens[i + j].key || (word.length >= 6 && tokens[i + j].key.length >= 6 && !knownWords.has(tokens[i + j].key) && oneEdit(word, tokens[i + j].key))));
    const longest = fuzzy.filter((c) => c.phrase.length === fuzzy[0]?.phrase.length);
    const unambiguous = new Set(longest.map((c) => `${c.dimension}:${c.slug}`)).size === 1 ? longest[0] : undefined;
    const candidate = unambiguous ?? exact;
    if (!candidate) continue;
    const { dimension, slug, label, phrase } = candidate;
    const single = ["brand", "category", "format"].includes(dimension);
    const existing = filters[dimension];
    if (existing && !(Array.isArray(existing) ? existing.includes(slug) : existing === slug)) {
      if (dimension !== "archetype") {
        return { query: "", filters, labels, error: `Search one ${dimension === "category" ? "industry" : dimension.replace(/_/g, " ")} at a time. Use separate searches for alternatives.` };
      }
      // Two creative approaches in one sentence ('influencer collaboration', 'product launch
      // announcement') describe one post, not alternatives: the first stays the filter and the
      // second stays words the post must match, which narrows rather than widens
      const text = tokens.slice(i, i + phrase.length).map((t) => t.value).join(" ");
      notes.push(`One creative approach per search: ${chosen[dimension]} is the filter, and "${text}" is matched as words.`);
      phrase.forEach((_, j) => kept.add(i + j));
      continue;
    }
    if (unambiguous) corrections.push({ from: tokens.slice(i, i + phrase.length).map((t) => t.value).join(" "), to: label });
    filters[dimension] = single ? slug : [...new Set([...(filters[dimension] as string[] ?? []), slug])];
    chosen[dimension] ??= label;
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
  return { query, filters, labels: [...new Set(labels)], corrections, ...(notes.length ? { notes } : {}) };
}

function oneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1)
    || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}
