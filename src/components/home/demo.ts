// Demo content for the homepage, taken from Curatit's demo library.
// Every brand here is fictional. Post artwork is drawn in code (PostCover), so each brand's
// colours live here as data: they stand in for the screenshots real posts will have.

export type Brand = {
  name: string;
  category: string;
  bg: string;
  fg: string;
  accent: string;
  serif?: boolean;
};

export const brands = {
  fizzwell: { name: "Fizzwell", category: "Food & Drink", bg: "#E8322B", fg: "#FFF6E9", accent: "#FFD23F" },
  oatEmber: { name: "Oat & Ember", category: "Food & Drink", bg: "#F3E6D3", fg: "#3B2A1E", accent: "#C8553D", serif: true },
  stridewise: { name: "Stridewise", category: "Sports", bg: "#111111", fg: "#F4F4F0", accent: "#C6FF3D" },
  kinetik: { name: "Kinetik", category: "Sports", bg: "#1C3FAA", fg: "#FFFFFF", accent: "#FF6B35" },
  lumen: { name: "Lumen Pictures", category: "Entertainment", bg: "#0E0B16", fg: "#F5EFE6", accent: "#E0B04A", serif: true },
  pixelforge: { name: "Pixelforge", category: "Entertainment", bg: "#2B1055", fg: "#FFFFFF", accent: "#3DF2C2" },
  parcel: { name: "Parcel & Co", category: "Shopping", bg: "#FFF4D6", fg: "#1A1A1A", accent: "#FF5A1F" },
  maisonVire: { name: "Maison Vire", category: "Shopping", bg: "#EDE7DF", fg: "#1E1E1E", accent: "#8C6F56", serif: true },
  northbank: { name: "Northbank", category: "Finance", bg: "#0B3D2E", fg: "#EAF4EE", accent: "#7FD8A6" },
  tallypay: { name: "Tallypay", category: "Finance", bg: "#5B3DF5", fg: "#FFFFFF", accent: "#FFD84D" },
  wayfarer: { name: "Wayfarer Air", category: "Travel & Transportation", bg: "#0A2540", fg: "#FFFFFF", accent: "#F2A541" },
  staybright: { name: "Staybright", category: "Travel & Transportation", bg: "#FFE9D6", fg: "#2A1A12", accent: "#E4572E", serif: true },
} satisfies Record<string, Brand>;

export type BrandId = keyof typeof brands;

export type Slide = {
  layout: "headline" | "stat" | "list" | "quote" | "product";
  headline: string;
  eyebrow?: string;
  body?: string;
  stat?: string;
  items?: string[];
  // Swap background and text colours, as brands do on closing slides
  invert?: boolean;
};

export type Post = {
  brand: BrandId;
  hook: string;
  objective: string;
  format: string;
  structure: string;
  styles: string[];
  mediaType: "Carousel" | "Static";
  reason: string;
  slides: Slide[];
  // Name of each slide's role, in order (carousels only)
  sequence?: string[];
};

export const posts = {
  fizzwellYuzu: {
    brand: "fizzwell",
    hook: "One word, one can, zero clutter.",
    objective: "Product launch",
    format: "Graphic",
    structure: "Announcement–benefits–CTA",
    styles: ["Bold typography", "Product-first"],
    mediaType: "Carousel",
    reason:
      "Shows how a launch can carry on type alone before revealing the product. Full-bleed brand red, oversized type locked to the left edge, can centred on slide two.",
    sequence: ["Announcement", "Product reveal", "Benefit", "Benefit", "CTA"],
    slides: [
      { layout: "headline", headline: "YUZU.", eyebrow: "New flavour" },
      { layout: "product", headline: "Fizzwell Yuzu", body: "330ml · zero sugar" },
      { layout: "headline", headline: "Sharp citrus", body: "Bright, never syrupy." },
      { layout: "headline", headline: "Zero sugar", body: "All the fizz, none of the crash." },
      { layout: "headline", headline: "In stores Friday", eyebrow: "Find it cold", invert: true },
    ],
  },
  fizzwellMultipack: {
    brand: "fizzwell",
    hook: "Summer multipack, priced like a dare.",
    objective: "Promotion",
    format: "Graphic",
    structure: "Single image",
    styles: ["Playful", "Bold typography"],
    mediaType: "Static",
    reason: "Clean example of a price-led promo that still feels on-brand.",
    slides: [{ layout: "stat", stat: "12", headline: "cans for the price of 9", eyebrow: "Summer pack" }],
  },
  oatEmberSourdough: {
    brand: "oatEmber",
    hook: "Five ways to keep sourdough fresh.",
    objective: "Educational",
    format: "Infographic",
    structure: "Listicle",
    styles: ["Editorial", "Illustration"],
    mediaType: "Carousel",
    reason: "A useful, saveable carousel format for food brands.",
    slides: [{ layout: "headline", headline: "Five ways to keep sourdough fresh", eyebrow: "Save this" }],
  },
  oatEmberAutumn: {
    brand: "oatEmber",
    hook: "The autumn loaf is back.",
    objective: "Product launch",
    format: "Photo-led",
    structure: "Announcement–benefits–CTA",
    styles: ["Editorial", "Minimal"],
    mediaType: "Static",
    reason: "Shows seasonal urgency without sale language.",
    slides: [{ layout: "headline", headline: "The autumn loaf is back.", body: "Pumpkin · rye · toasted seeds" }],
  },
  stridewiseLighter: {
    brand: "stridewise",
    hook: "Lighter than your last excuse.",
    objective: "Product launch",
    format: "Graphic",
    structure: "Claim–proof",
    styles: ["Bold typography", "Product-first", "Minimal"],
    mediaType: "Carousel",
    reason: "Tight claim–proof structure with one number doing the work.",
    slides: [{ layout: "stat", stat: "198g", headline: "Stride 4, men's size 9", eyebrow: "Lighter than your last excuse" }],
  },
  stridewise10k: {
    brand: "stridewise",
    hook: "Your first 10K, in four weeks.",
    objective: "Educational",
    format: "Infographic",
    structure: "Listicle",
    styles: ["Swiss / systematic", "Bold typography"],
    mediaType: "Carousel",
    reason: "Grid layouts make dense training content scannable.",
    slides: [{ layout: "headline", headline: "Your first 10K in four weeks", eyebrow: "Training plan" }],
  },
  kinetikJersey: {
    brand: "kinetik",
    hook: "Old jersey vs. new jersey.",
    objective: "Product launch",
    format: "Graphic",
    structure: "Comparison",
    styles: ["3D", "Product-first"],
    mediaType: "Carousel",
    reason: "Comparison makes an incremental product update feel meaningful.",
    slides: [{ layout: "headline", headline: "Old vs. new.", body: "40% lighter. Same fit you know." }],
  },
  lumenReview: {
    brand: "lumen",
    hook: "“A slow-burning masterpiece.”",
    objective: "Brand storytelling",
    format: "Quote",
    structure: "Claim–proof",
    styles: ["Editorial"],
    mediaType: "Carousel",
    reason: "Social proof sequence reusable for any launch with early reviews.",
    slides: [{ layout: "quote", headline: "A slow-burning masterpiece.", body: "The Evening Review" }],
  },
  pixelforgeCoop: {
    brand: "pixelforge",
    hook: "Co-op is finally here.",
    objective: "Feature announcement",
    format: "Product UI",
    structure: "Hook–explanation–CTA",
    styles: ["Playful", "3D"],
    mediaType: "Carousel",
    reason: "Shows how to explain a feature in the product's own visual language.",
    slides: [{ layout: "headline", headline: "Co-op is finally here.", eyebrow: "Update 2.1" }],
  },
  parcelGifts: {
    brand: "parcel",
    hook: "Gifts under $25, sorted by person.",
    objective: "Promotion",
    format: "Graphic",
    structure: "Listicle",
    styles: ["Playful", "Swiss / systematic"],
    mediaType: "Carousel",
    reason: "Recipient-led structure is a strong pattern for gifting campaigns.",
    slides: [{ layout: "headline", headline: "Gifts under $25", eyebrow: "Sorted by person" }],
  },
  parcelTestimonial: {
    brand: "parcel",
    hook: "“My shop tripled in a year.”",
    objective: "Testimonial",
    format: "Quote",
    structure: "Claim–proof",
    styles: ["Minimal"],
    mediaType: "Static",
    reason: "Simple testimonial layout with one supporting number.",
    slides: [{ layout: "quote", headline: "My shop tripled in a year.", body: "Ana, ceramics seller" }],
  },
  maisonSalt: {
    brand: "maisonVire",
    hook: "Collection 07: Salt.",
    objective: "Product launch",
    format: "Photo-led",
    structure: "Story or journey",
    styles: ["Editorial", "Photography-led", "Minimal"],
    mediaType: "Carousel",
    reason: "Lookbook pacing: minimal copy, strong sequence.",
    slides: [{ layout: "headline", headline: "Collection 07: Salt" }],
  },
  northbankCredit: {
    brand: "northbank",
    hook: "What actually affects your credit score?",
    objective: "Educational",
    format: "Infographic",
    structure: "Hook–explanation–CTA",
    styles: ["Swiss / systematic", "Minimal"],
    mediaType: "Carousel",
    reason: "Turns a complex service topic into a scannable weighted list.",
    slides: [{ layout: "headline", headline: "What affects your credit score?", eyebrow: "Explained" }],
  },
  tallypaySplit: {
    brand: "tallypay",
    hook: "Split the bill in one tap.",
    objective: "Feature announcement",
    format: "Product UI",
    structure: "Claim–proof",
    styles: ["Bold typography", "Playful"],
    mediaType: "Carousel",
    reason: "Claim–proof with UI steps as evidence.",
    slides: [{ layout: "stat", stat: "1", headline: "tap. Everyone's paid.", eyebrow: "Split the bill" }],
  },
  wayfarerCities: {
    brand: "wayfarer",
    hook: "Five cities under £200 this winter.",
    objective: "Promotion",
    format: "Photo-led",
    structure: "Listicle",
    styles: ["Photography-led", "Editorial"],
    mediaType: "Carousel",
    reason: "Fare-per-destination listicle is a proven travel format.",
    slides: [{ layout: "list", headline: "Five cities under £200", items: ["Lisbon from £89", "Marrakech from £129", "Reykjavík from £179"] }],
  },
  staybrightPacking: {
    brand: "staybright",
    hook: "How to pack for a week in one bag.",
    objective: "Educational",
    format: "Infographic",
    structure: "Listicle",
    styles: ["Editorial", "Illustration"],
    mediaType: "Carousel",
    reason: "Useful guide format that earns saves for a hospitality brand.",
    slides: [{ layout: "headline", headline: "A week in one bag", eyebrow: "Packing guide" }],
  },
  staybrightStay: {
    brand: "staybright",
    hook: "“We came for three nights and stayed ten.”",
    objective: "Testimonial",
    format: "Photo-led",
    structure: "Claim–proof",
    styles: ["Photography-led", "Editorial"],
    mediaType: "Carousel",
    reason: "Guest voice plus visual proof.",
    slides: [{ layout: "quote", headline: "We came for three nights and stayed ten.", body: "The Harlows" }],
  },
  fizzwellPoll: {
    brand: "fizzwell",
    hook: "Pick one: lime or never again?",
    objective: "Community engagement",
    format: "Graphic",
    structure: "Hook–explanation–CTA",
    styles: ["Playful", "Minimal"],
    mediaType: "Carousel",
    reason: "Low-effort engagement format that seeds the next launch.",
    slides: [{ layout: "headline", headline: "Settle this.", eyebrow: "Flavour vote" }],
  },
  stridewiseRunClub: {
    brand: "stridewise",
    hook: "5:30am run club, every Tuesday.",
    objective: "Community engagement",
    format: "Photo-led",
    structure: "Story or journey",
    styles: ["Photography-led", "Editorial"],
    mediaType: "Carousel",
    reason: "Real-member storytelling that sells a community rather than a product.",
    slides: [{ layout: "headline", headline: "5:30am. Every Tuesday.", eyebrow: "Run club" }],
  },
  kinetik5k: {
    brand: "kinetik",
    hook: "City 5K. Register before Friday.",
    objective: "Event",
    format: "Graphic",
    structure: "Single image",
    styles: ["Bold typography", "Swiss / systematic"],
    mediaType: "Static",
    reason: "Reference for information-dense event posters that stay legible.",
    slides: [{ layout: "stat", stat: "5K", headline: "City run · 14 Oct", eyebrow: "Register by Friday" }],
  },
  lumenCinemas: {
    brand: "lumen",
    hook: "In cinemas 14 November.",
    objective: "Product launch",
    format: "Graphic",
    structure: "Announcement–benefits–CTA",
    styles: ["Editorial", "Minimal"],
    mediaType: "Static",
    reason: "Restraint as a signal of prestige; the date is the only call to action.",
    slides: [{ layout: "headline", headline: "The Quiet Harbour", eyebrow: "14 November", body: "Only in cinemas" }],
  },
  lumenPremiere: {
    brand: "lumen",
    hook: "Tonight: the premiere, live.",
    objective: "Event",
    format: "Photo-led",
    structure: "Single image",
    styles: ["Photography-led", "Editorial"],
    mediaType: "Static",
    reason: "Minimal live-event format that works for any premiere.",
    slides: [{ layout: "headline", headline: "Tonight, the premiere.", eyebrow: "Live · 7pm GMT" }],
  },
  pixelforgeSale: {
    brand: "pixelforge",
    hook: "50% off. This weekend only.",
    objective: "Promotion",
    format: "Graphic",
    structure: "Single image",
    styles: ["Bold typography", "Playful"],
    mediaType: "Static",
    reason: "Maximum-clarity sale layout.",
    slides: [{ layout: "stat", stat: "50%", headline: "off everything", eyebrow: "Weekend only" }],
  },
  parcelDelivery: {
    brand: "parcel",
    hook: "Missed a delivery again?",
    objective: "Feature announcement",
    format: "Product UI",
    structure: "Problem–solution",
    styles: ["Minimal", "Product-first"],
    mediaType: "Carousel",
    reason: "Problem–solution in three slides with the UI as proof.",
    slides: [{ layout: "headline", headline: "Missed a delivery again?" }],
  },
  maisonArchive: {
    brand: "maisonVire",
    hook: "Archive sale. Quietly.",
    objective: "Promotion",
    format: "Graphic",
    structure: "Single image",
    styles: ["Minimal", "Editorial"],
    mediaType: "Static",
    reason: "Luxury sale framing without percentages.",
    slides: [{ layout: "headline", headline: "Archive sale.", body: "Selected pieces" }],
  },
  northbankRoundups: {
    brand: "northbank",
    hook: "Round-ups are here.",
    objective: "Feature announcement",
    format: "Product UI",
    structure: "Announcement–benefits–CTA",
    styles: ["Minimal", "Product-first"],
    mediaType: "Carousel",
    reason: "Minimal UI-led feature announcement.",
    slides: [{ layout: "product", headline: "Round-ups are here.", body: "Spare change, saved" }],
  },
  tallypayCoffee: {
    brand: "tallypay",
    hook: "Where does a $5 coffee payment go?",
    objective: "Educational",
    format: "Data visualisation",
    structure: "Listicle",
    styles: ["Playful", "Swiss / systematic"],
    mediaType: "Carousel",
    reason: "A clear pattern for explaining payment infrastructure to consumers.",
    slides: [{ layout: "headline", headline: "Where does $5 go?", eyebrow: "Follow the money" }],
  },
  tallypayFlatmates: {
    brand: "tallypay",
    hook: "“I stopped chasing my flatmates.”",
    objective: "Testimonial",
    format: "Quote",
    structure: "Single image",
    styles: ["Bold typography"],
    mediaType: "Static",
    reason: "Type-only testimonial that reads at thumbnail size.",
    slides: [{ layout: "quote", headline: "I stopped chasing my flatmates.", body: "Jo, London" }],
  },
  wayfarerSeat: {
    brand: "wayfarer",
    hook: "The new business seat, before and after.",
    objective: "Feature announcement",
    format: "Photo-led",
    structure: "Before–after",
    styles: ["Photography-led", "Minimal"],
    mediaType: "Carousel",
    reason: "Before–after makes a cabin refit tangible.",
    slides: [{ layout: "headline", headline: "Before.", eyebrow: "Business, 2019" }],
  },
  staybrightOffer: {
    brand: "staybright",
    hook: "Stay four nights, pay for three.",
    objective: "Promotion",
    format: "Graphic",
    structure: "Single image",
    styles: ["Minimal", "Editorial"],
    mediaType: "Static",
    reason: "Calm, premium offer layout.",
    slides: [{ layout: "headline", headline: "Stay four nights, pay for three.", eyebrow: "Autumn offer" }],
  },
} satisfies Record<string, Post>;

export type PostId = keyof typeof posts;


// Example briefs for the search demo, with the terms Curatit reads from each brief and what it returns
export const briefs = [
  {
    label: "Bold launch for a drink",
    query: "bold type launch for a new drink",
    readAs: ["Product launch", "Bold typography", "Food & Drink"],
    results: [
      { post: "fizzwellYuzu", matched: ["Product launch", "Bold typography", "Food & Drink"] },
      { post: "stridewiseLighter", matched: ["Product launch", "Bold typography"] },
      { post: "fizzwellMultipack", matched: ["Bold typography", "Food & Drink"] },
    ],
  },
  {
    label: "Saveable how-to",
    query: "saveable how-to carousel",
    readAs: ["Educational", "Listicle", "Carousel"],
    results: [
      { post: "oatEmberSourdough", matched: ["Educational", "Listicle", "Carousel"] },
      { post: "stridewise10k", matched: ["Educational", "Listicle", "Carousel"] },
      { post: "staybrightPacking", matched: ["Educational", "Listicle", "Carousel"] },
    ],
  },
  {
    label: "Customer story with proof",
    query: "customer story that proves it",
    readAs: ["Testimonial", "Claim–proof"],
    results: [
      { post: "staybrightStay", matched: ["Testimonial", "Claim–proof"] },
      { post: "parcelTestimonial", matched: ["Testimonial", "Claim–proof"] },
      { post: "lumenReview", matched: ["Claim–proof"] },
    ],
  },
] satisfies { label: string; query: string; readAs: string[]; results: { post: PostId; matched: string[] }[] }[];

// A research board as the board demo shows it
export const board = {
  name: "Spring drinks launch",
  references: [
    { post: "fizzwellYuzu", note: "Open on one word. Product on slide two." },
    { post: "stridewiseLighter", note: "One number does the proof. Find ours." },
    { post: "oatEmberAutumn", note: "Seasonal urgency without sale language." },
  ],
} satisfies { name: string; references: { post: PostId; note: string }[] };

// The six launch categories, with five posts each (one folder per category).
// `hue` is the OKLCH hue of the category's folder colour.
export const categories = [
  {
    name: "Food & Drink",
    hue: 35,
    posts: ["oatEmberSourdough", "fizzwellPoll", "fizzwellYuzu", "oatEmberAutumn", "fizzwellMultipack"],
  },
  {
    name: "Sports",
    hue: 135,
    posts: ["stridewiseRunClub", "kinetik5k", "kinetikJersey", "stridewise10k", "stridewiseLighter"],
  },
  {
    name: "Entertainment",
    hue: 300,
    posts: ["lumenCinemas", "pixelforgeSale", "lumenReview", "lumenPremiere", "pixelforgeCoop"],
  },
  {
    name: "Shopping",
    hue: 80,
    posts: ["maisonArchive", "parcelDelivery", "parcelGifts", "parcelTestimonial", "maisonSalt"],
  },
  {
    name: "Finance",
    hue: 175,
    posts: ["tallypayFlatmates", "northbankRoundups", "northbankCredit", "tallypayCoffee", "tallypaySplit"],
  },
  {
    name: "Travel & Transportation",
    hue: 240,
    posts: ["wayfarerSeat", "staybrightOffer", "wayfarerCities", "staybrightStay", "staybrightPacking"],
  },
] satisfies { name: string; hue: number; posts: PostId[] }[];
