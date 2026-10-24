// Where the design system page keeps its Light / Dark / Both choice (read before paint by the
// layout's inline script, so it lives here rather than in the client switch)
export const SYSTEM_THEME_KEY = "curatit-system-theme";

// The design system page's topics (/system/<slug>), in the order of its navigation. Since
// 2026-10-24 the site is built on Glaze (src/components/glaze), with Fluid Functionalism's type,
// motion and surfaces (src/styles/glaze-bridge.css): Foundations are those tokens, the rest one
// sheet per Glaze component the site uses, grouped as Glaze groups them.
export const GROUPS = ["Foundations", "Actions", "Inputs", "Display", "Feedback", "Overlays"] as const;

export const TOPICS = [
  { slug: "colour", title: "Colour", group: "Foundations", blurb: "Ink and paper, greys as ink at alphas, and colour only for status." },
  { slug: "type", title: "Type", group: "Foundations", blurb: "Fluid Functionalism's scale as Glaze's type roles, and the Text scale for marketing pages." },
  { slug: "surfaces", title: "Surfaces", group: "Foundations", blurb: "The eight-step ladder, and where the card, overlays and dialogs sit on it." },
  { slug: "motion", title: "Motion", group: "Foundations", blurb: "Three tiers of duration, two curves and the springs." },
  { slug: "radius", title: "Radius", group: "Foundations", blurb: "Pills for one-line controls, the card's two corners, overlays and tags." },
  { slug: "space", title: "Space and sizes", group: "Foundations", blurb: "The 4px grid, control heights, icon sizes and the page's gutter and rhythm." },
  { slug: "icons", title: "Icons", group: "Foundations", blurb: "The Icon entry and every glyph registered in it." },
  { slug: "brand", title: "Brand", group: "Foundations", blurb: "The mark, the wordmark and the lockup." },
  { slug: "button", title: "Button", group: "Actions", blurb: "Starts an action: one glass primary per group, flat secondaries." },
  { slug: "copy-button", title: "Copy button", group: "Actions", blurb: "Copies a value and confirms in place." },
  { slug: "text-link", title: "Text link", group: "Actions", blurb: "A link that is words, inside running text or on its own." },
  { slug: "field", title: "Field and input", group: "Inputs", blurb: "A label, a one-line input, a hint and an error, wired together." },
  { slug: "textarea", title: "Textarea", group: "Inputs", blurb: "Several lines of text, with an optional limit." },
  { slug: "select", title: "Select", group: "Inputs", blurb: "Picks one option from a list." },
  { slug: "checkbox", title: "Checkbox", group: "Inputs", blurb: "Turns one option on or off in a list or a form." },
  { slug: "switch", title: "Switch", group: "Inputs", blurb: "Turns a setting on or off at once." },
  { slug: "segmented-control", title: "Segmented control", group: "Inputs", blurb: "Switches between a few views of one thing." },
  { slug: "chip", title: "Chip", group: "Inputs", blurb: "A filter or a chosen value." },
  { slug: "tabs", title: "Tabs", group: "Display", blurb: "Switches between panels of one view." },
  { slug: "card", title: "Card and panel", group: "Display", blurb: "The grey shell and the paper panel inside it." },
  { slug: "item", title: "Item", group: "Display", blurb: "One thing as a row in a list." },
  { slug: "data-list", title: "Data list", group: "Display", blurb: "Label and value pairs about one thing." },
  { slug: "collapsible", title: "Collapsible", group: "Display", blurb: "Shows and hides a region." },
  { slug: "badge", title: "Badge", group: "Display", blurb: "Labels what something is or how it stands." },
  { slug: "avatar", title: "Avatar", group: "Display", blurb: "Who or what acted." },
  { slug: "kbd", title: "Kbd", group: "Display", blurb: "A key or a shortcut." },
  { slug: "code-block", title: "Code block", group: "Display", blurb: "Code or commands to copy." },
  { slug: "alert", title: "Alert", group: "Feedback", blurb: "A problem or a note about the current view." },
  { slug: "toast", title: "Toast", group: "Feedback", blurb: "Confirms an action or reports an event out of view." },
  { slug: "empty-state", title: "Empty state", group: "Feedback", blurb: "Why a region is empty, and the way forward." },
  { slug: "skeleton", title: "Skeleton", group: "Feedback", blurb: "The shape of content while it loads." },
  { slug: "dialog", title: "Dialog", group: "Overlays", blurb: "Asks for a decision on top of the page." },
  { slug: "dropdown-menu", title: "Dropdown menu", group: "Overlays", blurb: "The actions on one thing." },
  { slug: "popover", title: "Popover", group: "Overlays", blurb: "A few lines next to a control." },
  { slug: "tooltip", title: "Tooltip", group: "Overlays", blurb: "Names a control on hover or focus." },
] as const;

export type Topic = (typeof TOPICS)[number];
export type TopicSlug = Topic["slug"];

export function topicBySlug(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}
