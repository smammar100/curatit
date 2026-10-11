// Creative Intelligence: the controlled vocabulary every analysis is written in. Versioned, so
// each stored analysis records which vocabulary it used (TAXONOMY_VERSION), and seeded into
// public.creative_taxonomy_terms from here. Each dimension is independent: a post's industry (the
// brand's, from public.categories) is not its archetype, its archetype is not its objective, and
// so on. Every dimension has explicit "other" and/or "unknown" terms, so the model is never
// forced to guess; long-tail names from the earlier ~535-type candidate list live on as synonyms
// of these canonical terms, not as competing classes. Add a term by appending it with a new
// slug and bumping "taxonomy" in versions.json (then generate a migration with
// `npm run -s creative -- taxonomy-sql`); never rename or reuse a slug.

import versions from "./versions.json";

export const TAXONOMY_VERSION = versions.taxonomy;

export type Term = {
  slug: string;
  label: string;
  description: string;
  // A term of the same dimension this one sits under (archetypes sit under families)
  parent?: string;
  // Other names the term goes by: long-tail subtypes, older names, common phrasings
  synonyms?: readonly string[];
  // When to apply it, for the model and for reviewers
  criteria?: string;
};

const t = (slug: string, label: string, description: string, extra: Partial<Term> = {}): Term => ({ slug, label, description, ...extra });

const OTHER = t("other", "Other", "Something real that no term here covers; say what in the rationale.");
const UNKNOWN = t("unknown", "Unknown", "Can't be told from the caption and images.");
const NONE = t("none", "None", "Not present.");

// Content archetype: what the post is. Families group the primary types.
export const ARCHETYPE_FAMILIES: readonly Term[] = [
  t("product", "Product", "The product itself is the subject."),
  t("launch", "Launch & announcement", "Something new or changed is being announced."),
  t("promotion", "Promotion", "A deal, drop, giveaway or other incentive to act now."),
  t("proof", "Proof", "Evidence that the brand delivers: customers, numbers, press."),
  t("partnership", "Partnership", "Another brand, creator or organisation shares the post."),
  t("education", "Education", "Teaches or explains something useful."),
  t("brand", "Brand", "Who the brand is: story, values, people, process."),
  t("community", "Community", "Customers and followers are the subject or the audience being invited in."),
  t("entertainment", "Entertainment", "Made mainly to amuse or join a cultural moment."),
  t("lifestyle", "Lifestyle", "Mood, aspiration and the life around the product."),
  t("event", "Events & seasons", "Tied to an event, a date or a season."),
  t("impact", "Impact", "Social or environmental responsibility."),
  t("recruiting", "Recruiting", "Hiring and team culture."),
  t("operational", "Operational", "Service, policy or availability updates."),
  t("editorial", "Editorial", "Journalism-style content: features, commentary, interviews."),
  t("lead-gen", "Lead generation", "Pushes a sign-up, download or other captured action."),
  t("utility", "Utility", "A useful artefact in its own right: itinerary, recipe, checklist, calculator."),
  OTHER,
  UNKNOWN,
];

export const ARCHETYPES: readonly Term[] = [
  t("product-showcase", "Product showcase", "Shows the product as the hero.", { parent: "product", synonyms: ["product shot", "hero product", "packshot", "product display"] }),
  t("product-feature", "Feature explainer", "Explains what a product or feature does.", { parent: "product", synonyms: ["feature highlight", "how it works"] }),
  t("how-to-use", "How to use", "Shows the product in use, step by step.", { parent: "product", synonyms: ["product tutorial", "demo"] }),
  t("product-launch", "Product launch", "A new product is introduced.", { parent: "launch", synonyms: ["new product", "drop announcement", "release"] }),
  t("feature-launch", "Feature launch", "A new feature or update to an existing product.", { parent: "launch", synonyms: ["product update", "new feature"] }),
  t("announcement", "Announcement", "News that isn't a launch: milestones, openings, changes.", { parent: "launch", synonyms: ["news", "update"] }),
  t("teaser", "Teaser", "Hints at something coming without showing it all.", { parent: "launch", synonyms: ["coming soon", "countdown"] }),
  t("sale-offer", "Sale or offer", "A discount, deal or price promotion.", { parent: "promotion", synonyms: ["discount", "promo code", "price drop", "bundle"] }),
  t("limited-drop", "Limited drop", "Scarcity-led: limited stock or a short window.", { parent: "promotion", synonyms: ["limited edition", "flash sale"] }),
  t("giveaway", "Giveaway or contest", "Enter to win.", { parent: "promotion", synonyms: ["contest", "sweepstakes"] }),
  t("testimonial", "Testimonial", "A customer's words or experience.", { parent: "proof", synonyms: ["customer quote", "review"] }),
  t("case-study", "Case study", "A worked example of a result for a customer.", { parent: "proof", synonyms: ["success story"] }),
  t("stats-proof", "Stats as proof", "Numbers the brand puts forward about itself.", { parent: "proof", synonyms: ["milestone numbers", "by the numbers"] }),
  t("press-mention", "Press mention", "Coverage, awards or rankings.", { parent: "proof", synonyms: ["as seen in", "award"] }),
  t("collaboration", "Collaboration", "A joint product or campaign with another brand.", { parent: "partnership", synonyms: ["collab", "co-branded", "brand partnership"] }),
  t("creator-feature", "Creator feature", "A creator, athlete or celebrity fronts the post.", { parent: "partnership", synonyms: ["influencer", "ambassador", "athlete"] }),
  t("sponsorship", "Sponsorship", "The brand sponsors a team, event or cause.", { parent: "partnership" }),
  t("tutorial", "Tutorial", "Teaches a task step by step.", { parent: "education", synonyms: ["how-to", "guide", "walkthrough"] }),
  t("tips-list", "Tips list", "A numbered or bulleted set of tips.", { parent: "education", synonyms: ["listicle", "dos and don'ts", "hacks"] }),
  t("explainer", "Explainer", "Explains a concept, term or how something works.", { parent: "education", synonyms: ["101", "glossary", "what is"] }),
  t("myth-busting", "Myth busting", "Corrects a common belief.", { parent: "education", synonyms: ["myth vs fact"] }),
  t("data-insight", "Data insight", "A chart, study or statistic about the world (not the brand).", { parent: "education", synonyms: ["research", "report", "trend data"] }),
  t("brand-story", "Brand story", "Origins, mission or what the brand stands for.", { parent: "brand", synonyms: ["manifesto", "values", "about us"] }),
  t("behind-the-scenes", "Behind the scenes", "How things are made or the people making them.", { parent: "brand", synonyms: ["BTS", "making of", "process"] }),
  t("founder-voice", "Founder voice", "The founder or leadership speaks directly.", { parent: "brand", synonyms: ["CEO note", "letter"] }),
  t("ugc-repost", "UGC repost", "Content made by a customer, shared by the brand.", { parent: "community", synonyms: ["user-generated", "customer photo", "repost"] }),
  t("customer-spotlight", "Customer spotlight", "Features a customer or community member.", { parent: "community", synonyms: ["community feature", "member story"] }),
  t("community-prompt", "Community prompt", "Asks followers to answer, vote, tag or share.", { parent: "community", synonyms: ["question post", "poll", "this or that", "caption this"] }),
  t("milestone", "Milestone celebration", "Thanks followers for a milestone.", { parent: "community", synonyms: ["anniversary", "followers milestone"] }),
  t("meme", "Meme", "A known meme format or internet joke.", { parent: "entertainment", synonyms: ["reaction image", "shitpost"] }),
  t("relatable-humor", "Relatable humour", "A joke about a shared experience.", { parent: "entertainment", synonyms: ["POV", "when you", "relatable"] }),
  t("trend-participation", "Trend participation", "Joins a trend, format or cultural moment.", { parent: "entertainment", synonyms: ["trend", "newsjacking", "pop culture"] }),
  t("lifestyle-mood", "Lifestyle mood", "Aspirational imagery of the life around the product.", { parent: "lifestyle", synonyms: ["aesthetic", "moodboard", "inspiration"] }),
  t("event-promo", "Event promotion", "Promotes an upcoming event.", { parent: "event", synonyms: ["save the date", "tickets"] }),
  t("event-recap", "Event recap", "Shows what happened at an event.", { parent: "event", synonyms: ["highlights", "recap"] }),
  t("seasonal", "Seasonal", "Tied to a holiday or season.", { parent: "event", synonyms: ["holiday", "Black Friday", "summer", "back to school"] }),
  t("csr-impact", "Social impact", "Charity, sustainability or community impact.", { parent: "impact", synonyms: ["CSR", "sustainability", "giving back"] }),
  t("hiring", "Hiring", "Job openings and why to join.", { parent: "recruiting", synonyms: ["we're hiring", "careers", "team culture"] }),
  t("service-update", "Service update", "Availability, hours, outages or policy changes.", { parent: "operational", synonyms: ["policy update", "store hours", "now available in"] }),
  t("editorial-feature", "Editorial feature", "A magazine-style feature or interview.", { parent: "editorial", synonyms: ["interview", "profile", "commentary"] }),
  t("lead-magnet", "Lead magnet", "Offers something in exchange for a sign-up or download.", { parent: "lead-gen", synonyms: ["download the app", "sign up", "free guide", "waitlist"] }),
  t("utility-content", "Utility content", "A useful artefact: itinerary, recipe, checklist, template.", { parent: "utility", synonyms: ["itinerary", "recipe", "checklist", "template", "calculator"] }),
  OTHER,
  UNKNOWN,
];

export const OBJECTIVES: readonly Term[] = [
  t("awareness", "Awareness", "Get the brand or product noticed."),
  t("consideration", "Consideration", "Help people weigh the product: features, comparisons, proof."),
  t("conversion", "Conversion", "Get people to buy, sign up or download now."),
  t("retention", "Retention & loyalty", "Keep existing customers engaged or coming back."),
  t("engagement", "Engagement", "Get comments, saves, shares or participation."),
  t("education", "Education", "Teach something, with or without the product."),
  t("reputation", "Reputation", "Shape how the brand is seen: values, impact, credibility."),
  t("recruitment", "Recruitment", "Attract people to work there."),
  UNKNOWN,
];

export const HOOK_TECHNIQUES: readonly Term[] = [
  t("question", "Question", "Opens with a question."),
  t("bold-claim", "Bold claim", "A strong statement or promise."),
  t("number", "Number or statistic", "Leads with a figure."),
  t("curiosity-gap", "Curiosity gap", "Withholds the answer to make you swipe or read on."),
  t("how-to-promise", "How-to promise", "Promises to show how to do something."),
  t("list-count", "List count", "Announces a number of items (5 ways…)."),
  t("contrarian", "Contrarian", "Goes against a common belief."),
  t("relatable-pain", "Relatable pain", "Names a frustration the audience shares."),
  t("reveal", "Reveal", "Shows something new or surprising up front."),
  t("news", "News", "Leads with an announcement."),
  t("humor", "Humour", "Leads with a joke."),
  t("social-proof", "Social proof", "Leads with what others say or do."),
  t("urgency", "Urgency", "Leads with a deadline or limited time."),
  t("offer", "Offer", "Leads with the deal."),
  t("visual-only", "Visual only", "The image does the work; there's no verbal hook."),
  t("quote", "Quote", "Opens with someone's words."),
  NONE,
  UNKNOWN,
];

export const PERSUASION: readonly Term[] = [
  t("humor", "Humour", "Uses jokes or wit."),
  t("comparison", "Comparison", "Sets two things side by side."),
  t("curiosity", "Curiosity", "Makes you want to know more."),
  t("social-proof", "Social proof", "Others use or endorse it."),
  t("authority", "Authority", "Experts, credentials or data."),
  t("urgency", "Urgency", "Act now."),
  t("scarcity", "Scarcity", "Limited quantity or access."),
  t("aspiration", "Aspiration", "Who you could be or how life could look."),
  t("empathy", "Empathy", "Shows it understands the audience."),
  t("utility", "Utility", "Gives something useful outright."),
  t("novelty", "Novelty", "It's new."),
  t("exclusivity", "Exclusivity", "For a select group."),
  t("value", "Value", "Price or savings."),
  NONE,
];

export const TONES: readonly Term[] = [
  t("playful", "Playful", ""),
  t("witty", "Witty", ""),
  t("warm", "Warm", ""),
  t("confident", "Confident", ""),
  t("authoritative", "Authoritative", ""),
  t("educational", "Educational", ""),
  t("urgent", "Urgent", ""),
  t("inspirational", "Inspirational", ""),
  t("minimal", "Minimal", "Says very little."),
  t("irreverent", "Irreverent", ""),
  t("earnest", "Earnest", ""),
  t("luxurious", "Luxurious", ""),
  UNKNOWN,
];

export const IMAGERY: readonly Term[] = [
  t("product-photography", "Product photography", "The product photographed as the subject.", { synonyms: ["packshot", "studio product"] }),
  t("lifestyle-photography", "Lifestyle photography", "People or scenes with the product in context."),
  t("portrait", "Portrait", "A person is the subject."),
  t("ugc-style", "UGC-style photo", "Looks phone-shot, casual or customer-made."),
  t("illustration", "Illustration", "Drawn or vector artwork."),
  t("3d-render", "3D render", "Rendered 3D imagery."),
  t("typographic", "Typographic", "Type is the image; little or no imagery."),
  t("screenshot-ui", "Screenshot or UI", "App screens, tweets, chats or other interface captures.", { synonyms: ["tweet screenshot", "app UI", "chat"] }),
  t("data-visualization", "Data visualisation", "Charts, graphs or diagrams of data."),
  t("collage", "Collage", "Several images or cut-outs combined."),
  t("video-frame", "Video frame", "A still taken from video."),
  t("meme-format", "Meme format", "A recognised meme template."),
  t("mixed", "Mixed", "Several media with none dominant."),
  UNKNOWN,
];

// A general class only: never a named font
export const TYPOGRAPHY: readonly Term[] = [
  t("sans-serif", "Sans-serif", "No serifs."),
  t("serif", "Serif", "Serifs on the letterforms."),
  t("slab-serif", "Slab serif", "Heavy, block-like serifs."),
  t("display", "Display", "Decorative or highly stylised headline type."),
  t("condensed", "Condensed", "Narrow, tall letterforms."),
  t("script", "Script", "Joined, calligraphic letterforms."),
  t("handwritten", "Handwritten", "Looks hand-lettered or written."),
  t("monospace", "Monospace", "Fixed-width, code-like."),
  t("mixed", "Mixed", "Several classes with none dominant."),
  NONE,
  UNKNOWN,
];

export const TYPE_WEIGHTS: readonly Term[] = [
  t("light", "Light", ""),
  t("regular", "Regular", ""),
  t("bold", "Bold", ""),
  t("heavy", "Heavy", "Black or extra-bold."),
  t("mixed", "Mixed", "Strong contrast between weights."),
  NONE,
  UNKNOWN,
];

export const LAYOUTS: readonly Term[] = [
  t("centered", "Centred", "A single subject or block in the middle."),
  t("split", "Split", "Two halves, side by side or stacked."),
  t("grid", "Grid", "A regular grid of items."),
  t("full-bleed", "Full bleed", "An image fills the frame."),
  t("text-over-image", "Text over image", "Copy sits on top of a photo or artwork."),
  t("text-only", "Text only", "Copy on a plain or patterned ground."),
  t("list-stack", "List stack", "Items stacked as a list."),
  t("diagram", "Diagram", "A flow, map or labelled diagram."),
  t("ui-mockup", "UI mock-up", "Built to look like an app, tweet, chat or notification."),
  t("before-after", "Before and after", "Shows a change across two states."),
  t("collage", "Collage", "Free arrangement of several elements."),
  t("framed-card", "Framed card", "Content set in a card or frame on a ground."),
  t("asymmetric", "Asymmetric", "Deliberately off-centre balance."),
  UNKNOWN,
];

export const VISUAL_DEVICES: readonly Term[] = [
  t("arrows", "Arrows or pointers", ""),
  t("annotations", "Annotations or callouts", ""),
  t("highlighter", "Highlighter or underline marks", ""),
  t("stickers-badges", "Stickers or badges", ""),
  t("icons", "Icons", ""),
  t("emoji", "Emoji", ""),
  t("charts", "Charts", ""),
  t("logo-lockup", "Logo lock-up", "The brand's logo placed as a deliberate element."),
  t("price-tag", "Price tag", ""),
  t("numbered-steps", "Numbered steps", ""),
  t("swipe-cue", "Swipe cue", "An arrow or text telling you to swipe."),
  t("cutout", "Cut-out", "A subject cut out from its background."),
  t("hand-drawn", "Hand-drawn marks", ""),
  t("solid-ground", "Solid colour ground", ""),
  t("gradient-ground", "Gradient ground", ""),
  t("texture", "Texture or grain", ""),
  NONE,
];

export const SLIDE_ROLES: readonly Term[] = [
  t("hook", "Hook", "Stops the scroll; usually the first slide."),
  t("context", "Context", "Sets up the situation."),
  t("problem", "Problem", "Names the problem or tension."),
  t("insight", "Insight", "The key idea or turn."),
  t("explanation", "Explanation", "Explains how or why."),
  t("step", "Step", "One step of a sequence."),
  t("example", "Example", "A worked example or instance."),
  t("proof", "Proof", "Evidence: numbers, quotes, results."),
  t("comparison", "Comparison", "Sets options side by side."),
  t("product-detail", "Product detail", "A closer look at the product."),
  t("offer", "Offer", "The deal or incentive."),
  t("cta", "Call to action", "Tells you what to do next."),
  t("recap", "Recap", "Sums up."),
  t("gallery-frame", "Gallery frame", "One more image in a set, with no distinct role in a story."),
  t("closing", "Closing", "Sign-off, logo or credits."),
  OTHER,
  UNKNOWN,
];

export const NARRATIVE_PATTERNS: readonly Term[] = [
  t("single-image", "Single image", "One frame; no sequence."),
  t("hook-problem-solution", "Hook, problem, solution", "Opens, names a problem, resolves it."),
  t("listicle", "Listicle", "A set of parallel items."),
  t("step-by-step", "Step by step", "An ordered process."),
  t("reveal-then-detail", "Reveal, then detail", "Shows the thing, then zooms in."),
  t("before-after", "Before and after", "A change across states."),
  t("story-arc", "Story arc", "Characters or events move through a beginning, middle and end."),
  t("data-story", "Data story", "Builds an argument from numbers."),
  t("q-and-a", "Q&A", "Questions with answers."),
  t("comparison-series", "Comparison series", "Option after option, compared."),
  t("gallery", "Gallery", "Several images with no plot: a set, not a sequence."),
  OTHER,
  UNKNOWN,
];

export const CTAS: readonly Term[] = [
  t("shop", "Shop", "Buy or shop now."),
  t("learn-more", "Learn more", ""),
  t("sign-up", "Sign up", ""),
  t("download", "Download", "Download the app or a resource."),
  t("follow", "Follow", ""),
  t("comment", "Comment", "Answer, vote or reply in the comments."),
  t("share", "Share", "Send it to someone."),
  t("save", "Save", "Save the post for later."),
  t("tag-a-friend", "Tag a friend", ""),
  t("link-in-bio", "Link in bio", ""),
  t("visit", "Visit", "Go to a store or place."),
  t("book", "Book or reserve", ""),
  t("enter", "Enter", "Enter a giveaway or contest."),
  t("watch", "Watch", "Watch a video, episode or stream."),
  NONE,
  UNKNOWN,
];

export const PALETTE: readonly Term[] = [
  "red", "orange", "yellow", "green", "teal", "blue", "purple", "pink", "brown", "beige", "black", "white", "grey", "multicolor",
].map((slug) => t(slug, slug === "multicolor" ? "Multicolour" : slug[0].toUpperCase() + slug.slice(1), "A dominant colour family."));

export const LEVELS: readonly Term[] = [
  NONE,
  t("low", "Low", ""),
  t("medium", "Medium", ""),
  t("high", "High", ""),
  UNKNOWN,
];

export const DIMENSIONS = {
  archetype_family: ARCHETYPE_FAMILIES,
  archetype: ARCHETYPES,
  objective: OBJECTIVES,
  hook_technique: HOOK_TECHNIQUES,
  persuasion: PERSUASION,
  tone: TONES,
  imagery: IMAGERY,
  typography: TYPOGRAPHY,
  type_weight: TYPE_WEIGHTS,
  layout: LAYOUTS,
  visual_device: VISUAL_DEVICES,
  slide_role: SLIDE_ROLES,
  narrative_pattern: NARRATIVE_PATTERNS,
  cta: CTAS,
  palette: PALETTE,
  level: LEVELS,
} as const;

export type Dimension = keyof typeof DIMENSIONS;

// A dimension's slugs as the non-empty tuple zod's enum wants
export function slugs(dimension: Dimension): [string, ...string[]] {
  const list = DIMENSIONS[dimension].map((term) => term.slug);
  if (!list.length) throw new Error(`Taxonomy dimension ${dimension} is empty`);
  return list as [string, ...string[]];
}

export function term(dimension: Dimension, slug: string): Term | undefined {
  return DIMENSIONS[dimension].find((entry) => entry.slug === slug);
}

const normalise = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// A slug, a label or a synonym, matched loosely, to its canonical slug; null when nothing fits.
// For reviewers' edits and for reading back long-tail names, not for trusting model output
// (that must already be a canonical slug).
export function resolve(dimension: Dimension, text: string): string | null {
  const wanted = normalise(text);
  if (!wanted) return null;
  for (const entry of DIMENSIONS[dimension]) {
    if (normalise(entry.slug) === wanted || normalise(entry.label) === wanted) return entry.slug;
    if (entry.synonyms?.some((synonym) => normalise(synonym) === wanted)) return entry.slug;
  }
  return null;
}

export function familyOf(archetype: string): string | undefined {
  return term("archetype", archetype)?.parent;
}
