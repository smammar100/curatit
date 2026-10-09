// Homepage content: which real library posts each section shows, by Instagram
// short code, and the editorial copy that goes with them. The posts themselves
// (brand, caption, images) come from Supabase (src/lib/posts.ts). The tags and
// notes below describe what those posts actually do, so keep them in step if
// you swap a post. A short code that isn't published is skipped.

// Example briefs for the search demo, with the terms Curatit reads from each brief and what it returns
export const briefs = [
  {
    label: "Launch that shows the product",
    query: "launch carousel that shows the product",
    readAs: ["Product launch", "Carousel", "Product UI"],
    results: [
      { post: "DeJsl6nF39v", matched: ["Product launch", "Carousel", "Product UI"] },
      { post: "Dd6t2UpFLsO", matched: ["Product launch", "Carousel", "Product UI"] },
      { post: "DeRrE8MoEjx", matched: ["Product launch", "Carousel"] },
    ],
  },
  {
    label: "Saveable how-to",
    query: "saveable how-to carousel",
    readAs: ["Educational", "Listicle", "Carousel"],
    results: [
      { post: "DdscgU9n5lJ", matched: ["Educational", "Listicle", "Carousel"] },
      { post: "DeFNMhPnZ4t", matched: ["Listicle", "Carousel"] },
      { post: "DVpWe9ujaT_", matched: ["Educational", "Carousel"] },
    ],
  },
  {
    label: "Customer story with proof",
    query: "customer story that proves it",
    readAs: ["Customer story", "Claim–proof"],
    results: [
      { post: "DePhAU1iUEo", matched: ["Customer story", "Claim–proof"] },
      { post: "DeSAJSDIMcQ", matched: ["Customer story"] },
      { post: "DeCR5f0Nctv", matched: ["Customer story"] },
    ],
  },
] satisfies { label: string; query: string; readAs: string[]; results: { post: string; matched: string[] }[] }[];

// The post the detail demo opens: Wise's eSIM launch
export const detail = {
  post: "DeJsl6nF39v",
  objective: "Product launch",
  format: "Graphic",
  structure: "Announcement–benefits–CTA",
  styles: ["Product UI", "Brand colour", "Bold typography"],
  reason:
    "Every slide puts the app on screen, so the launch shows the product instead of describing it. Brand green carries the set; the cover breaks it with a real photo behind the phone.",
  // Each slide's role, in order
  sequence: ["Announcement", "Benefit", "Benefit", "Benefit", "CTA"],
};

// A research board as the board demo shows it
export const board = {
  name: "Payments app launch",
  references: [
    { post: "DeJsl6nF39v", note: "One benefit per slide, with the app on screen." },
    { post: "DdoBhR8DTdG", note: "Teaser the day before: one photo and a date." },
    { post: "Dd6t2UpFLsO", note: "Numbered features, then a two-word sign-off." },
  ],
} satisfies { name: string; references: { post: string; note: string }[] };

// Covers in the hero's corridor, one per brand across the categories
export const heroPosts = [
  "DdcI8NLmY21", // Nike
  "Dd9aD_hR7EV", // Uber Eats
  "DeSNcvVlJFp", // Airbnb
  "DeO6wGiE6x0", // Zara
  "DeJsl6nF39v", // Wise
  "DeRrE8MoEjx", // Claude
  "DeLMB8QiAYW", // adidas
  "Ddmt0ntEr9P", // Tripadvisor
  "Dds-wQWn8AZ", // Uniqlo
];

// Posts scattered across the "before Curatit" scene, by where they appear
export const scattered = {
  saved: ["Dd9aD_hR7EV", "DeO6wGiE6x0", "Ddmt0ntEr9P", "DeLMB8QiAYW"],
  screenshots: ["Dd18lP-Plna", "DdscgU9n5lJ"],
  canvas: ["DeEG92HioLr", "DcrGVrQEfJi", "DeSNcvVlJFp"],
  pdf: ["DdcI8NLmY21", "DeHz6sWoLji", "DeMJVogov2Z", "DdWnaHVmyRI", "DVj0f-lD3SN", "DdwauhyRAXw"],
};

// Every short code above, so the page only sends these posts to the browser
export const featuredPosts = [
  ...new Set([
    ...briefs.flatMap((brief) => brief.results.map((result) => result.post)),
    detail.post,
    ...board.references.map((reference) => reference.post),
    ...Object.values(scattered).flat(),
  ]),
];

// The six folders, each filled with the newest posts from one library category.
// `hue` is the OKLCH hue of the folder colour.
export const categories = [
  { name: "Food & Drink", category: "food-delivery", hue: 35 },
  { name: "Sports", category: "sportswear", hue: 135 },
  { name: "Technology", category: "technology", hue: 300 },
  { name: "Fashion", category: "fashion", hue: 80 },
  { name: "Finance", category: "fintech", hue: 175 },
  { name: "Travel & Transportation", category: "travel", hue: 240 },
];
