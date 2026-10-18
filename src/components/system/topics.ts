// Where the design system page keeps its Light / Dark / Both choice (read before paint by the
// layout's inline script, so it lives here rather than in the client switch)
export const SYSTEM_THEME_KEY = "curatit-system-theme";

// The design system page's topics (/system/<slug>), in the order of its tab row. Foundations
// are the tokens; components are the shared pieces built from them.
export const TOPICS = [
  { slug: "colour", title: "Colour", group: "Foundations", blurb: "Semantic tokens for surfaces, text, brand, status and borders, and the scales under them." },
  { slug: "type", title: "Type", group: "Foundations", blurb: "Hedvig headings and Inter text on Interfere's scale, and the dashboard's six roles." },
  { slug: "shape", title: "Shape and depth", group: "Foundations", blurb: "The radius scale, the layered shadows and the alpha borders." },
  { slug: "motion", title: "Motion", group: "Foundations", blurb: "Easing, durations, the shared keyframes and the motion hooks, live." },
  { slug: "icons", title: "Icons", group: "Foundations", blurb: "Every Phosphor icon in the set, its sizes and how to add one." },
  { slug: "layout", title: "Layout", group: "Foundations", blurb: "Wrapper widths, the page gutter and the rhythm between sections." },
  { slug: "button", title: "Button", group: "Components", blurb: "Every variant, size and state, as a button and as a link." },
  { slug: "badge", title: "Badge", group: "Components", blurb: "Small labels: variants, sizes and when a badge isn't the answer." },
  { slug: "input", title: "Input", group: "Components", blurb: "Text fields, their notes and errors, the password meter and the form notice." },
  { slug: "code", title: "Code", group: "Components", blurb: "Snippets with a copy button, dark and light." },
  { slug: "patterns", title: "Patterns", group: "Components", blurb: "The theme switch, the FAQ, loading skeletons and the agent's thinking line." },
  { slug: "brand", title: "Brand", group: "Components", blurb: "The wordmark, the mark and the lockup." },
] as const;

export type Topic = (typeof TOPICS)[number];
export type TopicSlug = Topic["slug"];

export function topicBySlug(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}
