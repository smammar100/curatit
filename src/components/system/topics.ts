// Where the design system page keeps its Light / Dark / Both choice (read before paint by the
// layout's inline script, so it lives here rather than in the client switch)
export const SYSTEM_THEME_KEY = "curatit-system-theme";

// The design system page's topics (/system/<slug>), in the order of its navigation. Foundations
// are the tokens; atoms are single elements (src/components/fundations/elements); molecules are
// atoms composed into a pattern (src/components/fundations/molecules). DESIGN.md and
// docs/design/components.md hold the same inventory.
export const GROUPS = ["Foundations", "Atoms", "Molecules"] as const;

export const TOPICS = [
  { slug: "colour", title: "Colour", group: "Foundations", blurb: "Semantic tokens for surfaces, text, brand, status and borders, and the scales under them." },
  { slug: "type", title: "Type", group: "Foundations", blurb: "Hedvig headings and Inter text on Interfere's scale, and the dashboard's six roles." },
  { slug: "shape", title: "Shape and depth", group: "Foundations", blurb: "The radius scale, the layered shadows and the alpha borders." },
  { slug: "motion", title: "Motion", group: "Foundations", blurb: "Easing, durations, the shared keyframes and the motion hooks, live." },
  { slug: "icons", title: "Icons", group: "Foundations", blurb: "Every Phosphor icon in the set, its sizes and how to add one." },
  { slug: "layout", title: "Layout", group: "Foundations", blurb: "Wrapper widths, the page gutter and the rhythm between sections." },
  { slug: "brand", title: "Brand", group: "Foundations", blurb: "The wordmark, the mark and the lockup." },
  { slug: "button", title: "Button", group: "Atoms", blurb: "Every variant, size and state, as a button and as a link." },
  { slug: "text-link", title: "Text link", group: "Atoms", blurb: "Links inside running text and quiet navigation links." },
  { slug: "badge", title: "Badge", group: "Atoms", blurb: "Small labels: variants, sizes and when a badge isn't the answer." },
  { slug: "input", title: "Input", group: "Atoms", blurb: "The text input: sizes, states and slots for icons." },
  { slug: "textarea", title: "Textarea", group: "Atoms", blurb: "Multi-line text entry on the input's recipe." },
  { slug: "checkbox", title: "Checkbox", group: "Atoms", blurb: "Independent on/off choices in a list." },
  { slug: "controls", title: "Segmented and switch", group: "Atoms", blurb: "One choice from a few, and on or off." },
  { slug: "avatar", title: "Avatar", group: "Atoms", blurb: "A person: their picture, or their initials." },
  { slug: "spinner", title: "Spinner", group: "Atoms", blurb: "An inline wait under a second or two." },
  { slug: "skeleton", title: "Skeleton", group: "Atoms", blurb: "The shape of content that is still loading." },
  { slug: "kbd", title: "Kbd", group: "Atoms", blurb: "A key to press." },
  { slug: "separator", title: "Separator", group: "Atoms", blurb: "A hairline between groups." },
  { slug: "field", title: "Field", group: "Molecules", blurb: "A label, a control, a hint and an error, wired together." },
  { slug: "search-field", title: "Search field", group: "Molecules", blurb: "Search input with its icon, clear button and shortcut." },
  { slug: "auth-fields", title: "Auth fields", group: "Molecules", blurb: "The sign-in forms' fields, password meter and notice." },
  { slug: "notice", title: "Notice", group: "Molecules", blurb: "An inline message: information, success, warning or error." },
  { slug: "toast", title: "Toast", group: "Molecules", blurb: "A short message after an action, that leaves on its own." },
  { slug: "empty-state", title: "Empty state", group: "Molecules", blurb: "What a place looks like with nothing in it yet, and the way forward." },
  { slug: "card", title: "Card", group: "Molecules", blurb: "A grouped surface: the grey mat and the white card." },
  { slug: "menu", title: "Menu", group: "Molecules", blurb: "A list of actions or choices opened from a button." },
  { slug: "dialog", title: "Dialog", group: "Molecules", blurb: "A task that takes the screen's focus until it's done." },
  { slug: "tooltip", title: "Tooltip", group: "Molecules", blurb: "A few words about a control, on hover and focus." },
  { slug: "tabs", title: "Tabs", group: "Molecules", blurb: "Views of the same thing, one at a time." },
  { slug: "code", title: "Code", group: "Molecules", blurb: "Snippets with a copy button, dark and light." },
  { slug: "patterns", title: "Patterns", group: "Molecules", blurb: "The theme switch, the FAQ, the agent's thinking line." },
] as const;

export type Topic = (typeof TOPICS)[number];
export type TopicSlug = Topic["slug"];

export function topicBySlug(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}
