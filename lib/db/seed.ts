import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { slideText, type SlideArt, type SlideLayout } from "../art";
import {
  categories,
  ctaTypes,
  formats,
  narratives,
  objectives,
  TAXONOMY_VERSION,
  visualStyles,
  type CategoryId,
  type CtaType,
  type FormatId,
  type NarrativeId,
  type ObjectiveId,
  type TextDensity,
  type VisualStyleId,
} from "../taxonomy";

/**
 * DEMO DATA. Every brand below is fictional and flagged `is_demo`. The plan
 * (§28, §32) forbids ingesting the real candidate brands before identity,
 * quality, and source-rights approval, so the local library is invented and
 * its artwork is generated, not scraped.
 */

type Brand = {
  id: string;
  name: string;
  category: CategoryId;
  market: string;
  palette: { bg: string; fg: string; accent: string; serif?: boolean };
};

const brands: Brand[] = [
  { id: "fizzwell", name: "Fizzwell", category: "food-drink", market: "Global", palette: { bg: "#E8322B", fg: "#FFF6E9", accent: "#FFD23F" } },
  { id: "oat-ember", name: "Oat & Ember", category: "food-drink", market: "UK", palette: { bg: "#F3E6D3", fg: "#3B2A1E", accent: "#C8553D", serif: true } },
  { id: "stridewise", name: "Stridewise", category: "sports", market: "US", palette: { bg: "#111111", fg: "#F4F4F0", accent: "#C6FF3D" } },
  { id: "kinetik", name: "Kinetik", category: "sports", market: "Global", palette: { bg: "#1C3FAA", fg: "#FFFFFF", accent: "#FF6B35" } },
  { id: "lumen-pictures", name: "Lumen Pictures", category: "entertainment", market: "Global", palette: { bg: "#0E0B16", fg: "#F5EFE6", accent: "#E0B04A", serif: true } },
  { id: "pixelforge", name: "Pixelforge", category: "entertainment", market: "Global", palette: { bg: "#2B1055", fg: "#FFFFFF", accent: "#3DF2C2" } },
  { id: "parcel-co", name: "Parcel & Co", category: "shopping", market: "US", palette: { bg: "#FFF4D6", fg: "#1A1A1A", accent: "#FF5A1F" } },
  { id: "maison-vire", name: "Maison Vire", category: "shopping", market: "EU", palette: { bg: "#EDE7DF", fg: "#1E1E1E", accent: "#8C6F56", serif: true } },
  { id: "northbank", name: "Northbank", category: "finance", market: "UK", palette: { bg: "#0B3D2E", fg: "#EAF4EE", accent: "#7FD8A6" } },
  { id: "tallypay", name: "Tallypay", category: "finance", market: "Global", palette: { bg: "#5B3DF5", fg: "#FFFFFF", accent: "#FFD84D" } },
  { id: "wayfarer-air", name: "Wayfarer Air", category: "travel-transportation", market: "Global", palette: { bg: "#0A2540", fg: "#FFFFFF", accent: "#F2A541" } },
  { id: "staybright", name: "Staybright", category: "travel-transportation", market: "Global", palette: { bg: "#FFE9D6", fg: "#2A1A12", accent: "#E4572E", serif: true } },
];

type Slide = { l: SlideLayout; h: string; b?: string; e?: string; i?: string[]; s?: string; invert?: boolean };

type PostSpec = {
  brand: string;
  status?: "published" | "shortlisted" | "candidate" | "removed";
  days: number;
  objective: ObjectiveId;
  format: FormatId;
  narrative: NarrativeId;
  styles: VisualStyleId[];
  density: TextDensity;
  cta: CtaType;
  hook: string;
  summary: string;
  composition: string;
  reason: string;
  caption: string;
  sequence?: string[];
  slides: Slide[];
};

const posts: PostSpec[] = [
  // ── Food & Drink ─────────────────────────────────────────────────────────
  {
    brand: "fizzwell", days: 6, objective: "product-launch", format: "graphic", narrative: "announcement-benefits-cta",
    styles: ["bold-typography", "product-first"], density: "low", cta: "shop-now",
    hook: "One word, one can, zero clutter.",
    summary: "Launch carousel for a yuzu flavour that opens on a single oversized word, then shows the can and three benefit slides.",
    composition: "Full-bleed brand red, oversized condensed type locked to the left edge, can centred on slide two.",
    reason: "Shows how a launch can carry on type alone before revealing the product.",
    caption: "Yuzu is here. Bright, sharp, and cold as it gets. Out this week.",
    sequence: ["Announcement", "Product reveal", "Benefit", "Benefit", "CTA"],
    slides: [
      { l: "headline", h: "YUZU.", e: "New flavour" },
      { l: "product", h: "Fizzwell Yuzu", b: "330ml · zero sugar" },
      { l: "headline", h: "Sharp citrus", b: "Bright, never syrupy." },
      { l: "headline", h: "Zero sugar", b: "All the fizz, none of the crash." },
      { l: "headline", h: "In stores Friday", e: "Find it cold", invert: true },
    ],
  },
  {
    brand: "fizzwell", days: 19, objective: "promotion", format: "graphic", narrative: "not_applicable",
    styles: ["playful", "bold-typography"], density: "low", cta: "shop-now",
    hook: "Summer multipack, priced like a dare.",
    summary: "Single promotional graphic pairing a stacked price callout with a tilted multipack.",
    composition: "Price as the hero element, set larger than the product; accent sticker in the top right.",
    reason: "Clean example of a price-led promo that still feels on-brand.",
    caption: "12 cans. Summer sorted. While it lasts.",
    slides: [{ l: "stat", s: "12", h: "cans for the price of 9", e: "Summer pack" }],
  },
  {
    brand: "fizzwell", days: 33, objective: "community-engagement", format: "graphic", narrative: "hook-explanation-cta",
    styles: ["playful", "minimal"], density: "medium", cta: "none",
    hook: "Pick one: lime or never again?",
    summary: "Two-option poll carousel that invites comments and ends with a teaser for the winning flavour.",
    composition: "Split layout with two colour fields; each option labelled in heavy sans.",
    reason: "Low-effort engagement format that seeds the next launch.",
    caption: "Settle it in the comments. Winner gets made.",
    sequence: ["Hook", "Option A", "Option B", "Teaser"],
    slides: [
      { l: "headline", h: "Settle this.", e: "Flavour vote" },
      { l: "split", h: "Lime", b: "Sharp. Classic." },
      { l: "split", h: "Blood orange", b: "Deep. Bitter-sweet." },
      { l: "headline", h: "Winner gets made.", b: "Vote in the comments.", invert: true },
    ],
  },
  {
    brand: "oat-ember", days: 4, objective: "brand-storytelling", format: "photo-led", narrative: "story-journey",
    styles: ["editorial", "photography-led"], density: "medium", cta: "learn-more",
    hook: "4:10am. The ovens are already warm.",
    summary: "Behind-the-scenes carousel following one loaf from starter to shelf, told with timestamps.",
    composition: "Warm editorial serif captions over full-bleed photography placeholders, timestamp as eyebrow.",
    reason: "Timestamps give a simple, repeatable narrative spine for process stories.",
    caption: "Every loaf starts before sunrise. Here's the whole morning.",
    sequence: ["Hook", "Process", "Process", "Process", "Payoff"],
    slides: [
      { l: "photo", h: "The ovens are already warm.", e: "4:10am" },
      { l: "photo", h: "Starter, fed twice.", e: "4:30am" },
      { l: "photo", h: "Shaped by hand.", e: "5:45am" },
      { l: "photo", h: "Scored and baked.", e: "6:20am" },
      { l: "headline", h: "On the shelf by seven.", e: "7:00am" },
    ],
  },
  {
    brand: "oat-ember", days: 15, objective: "product-launch", format: "photo-led", narrative: "announcement-benefits-cta",
    styles: ["editorial", "minimal"], density: "low", cta: "shop-now",
    hook: "The autumn loaf is back.",
    summary: "Seasonal return announcement using a restrained serif headline and a single ingredient list.",
    composition: "Generous margins, centred serif headline, small caps ingredient line beneath.",
    reason: "Shows seasonal urgency without sale language.",
    caption: "Pumpkin, rye, toasted seeds. Back until the first frost.",
    slides: [{ l: "headline", h: "The autumn loaf is back.", b: "Pumpkin · rye · toasted seeds" }],
  },
  {
    brand: "oat-ember", days: 41, objective: "educational", format: "infographic", narrative: "listicle",
    styles: ["editorial", "illustration"], density: "high", cta: "learn-more",
    hook: "Five ways to keep sourdough fresh.",
    summary: "Educational listicle carousel with one numbered storage tip per slide.",
    composition: "Numbered serif headings, short body copy, small line illustrations per tip.",
    reason: "A useful, saveable carousel format for food brands.",
    caption: "Save this for your next loaf.",
    sequence: ["Hook", "Tip", "Tip", "Tip", "Summary"],
    slides: [
      { l: "headline", h: "Five ways to keep sourdough fresh", e: "Save this" },
      { l: "list", h: "Store it cut-side down", i: ["No bag for day one", "A board is enough"] },
      { l: "list", h: "Freeze it sliced", i: ["Toast from frozen", "Lasts a month"] },
      { l: "list", h: "Revive it in the oven", i: ["Splash of water", "Five minutes, 180°C"] },
      { l: "list", h: "The short version", i: ["Cut-side down", "Slice and freeze", "Revive with steam"] },
    ],
  },

  // ── Sports ───────────────────────────────────────────────────────────────
  {
    brand: "stridewise", days: 3, objective: "product-launch", format: "graphic", narrative: "claim-proof",
    styles: ["bold-typography", "product-first", "minimal"], density: "low", cta: "shop-now",
    hook: "Lighter than your last excuse.",
    summary: "Running shoe launch that leads with a weight claim, then proves it with a single stat slide.",
    composition: "Black field, neon accent reserved for the number; product centred with heavy negative space.",
    reason: "Tight claim–proof structure with one number doing the work.",
    caption: "Stride 4. 198 grams. No more reasons.",
    sequence: ["Claim", "Proof", "Product", "CTA"],
    slides: [
      { l: "headline", h: "Lighter than your last excuse." },
      { l: "stat", s: "198g", h: "Stride 4, men's size 9" },
      { l: "product", h: "Stride 4", b: "Carbon plate · recycled upper" },
      { l: "headline", h: "Run it Saturday.", e: "Available now", invert: true },
    ],
  },
  {
    brand: "stridewise", days: 12, objective: "community-engagement", format: "photo-led", narrative: "story-journey",
    styles: ["photography-led", "editorial"], density: "medium", cta: "sign-up",
    hook: "5:30am run club, every Tuesday.",
    summary: "Community carousel profiling regular members of a morning run club with first-person quotes.",
    composition: "Portrait placeholders with a single short quote each; club logo lockup on the final slide.",
    reason: "Real-member storytelling that sells a community rather than a product.",
    caption: "No pace too slow. See you Tuesday.",
    sequence: ["Hook", "Member", "Member", "Invite"],
    slides: [
      { l: "photo", h: "5:30am. Every Tuesday.", e: "Run club" },
      { l: "quote", h: "I came for the miles. I stay for the people.", b: "Priya, 2 years in" },
      { l: "quote", h: "Nobody cares about your pace.", b: "Marcus, first marathon" },
      { l: "headline", h: "No pace too slow.", b: "Sign up via the link.", invert: true },
    ],
  },
  {
    brand: "stridewise", days: 27, objective: "educational", format: "infographic", narrative: "listicle",
    styles: ["swiss-systematic", "bold-typography"], density: "high", cta: "learn-more",
    hook: "Your first 10K, in four weeks.",
    summary: "Training-plan carousel laid out as a strict weekly grid.",
    composition: "Swiss grid with week numbers as large index labels; one row per session.",
    reason: "Grid layouts make dense training content scannable.",
    caption: "Screenshot this. Start Monday.",
    sequence: ["Hook", "Week", "Week", "Week", "Week"],
    slides: [
      { l: "headline", h: "Your first 10K in four weeks", e: "Training plan" },
      { l: "list", h: "Week 1", i: ["3 × 20 min easy", "1 × strides"] },
      { l: "list", h: "Week 2", i: ["3 × 25 min easy", "1 × hills"] },
      { l: "list", h: "Week 3", i: ["2 × 30 min", "1 × 8K long run"] },
      { l: "list", h: "Week 4", i: ["Taper", "Race day"] },
    ],
  },
  {
    brand: "kinetik", days: 8, objective: "brand-storytelling", format: "photo-led", narrative: "story-journey",
    styles: ["photography-led", "bold-typography"], density: "low", cta: "watch",
    hook: "She trained in a car park for three years.",
    summary: "Athlete campaign carousel telling a short origin story with one line per slide.",
    composition: "Full-bleed photo placeholders, heavy sans headlines anchored bottom-left.",
    reason: "Sparse, sequential copy gives athlete stories momentum.",
    caption: "From car park to podium. Full film on YouTube.",
    sequence: ["Hook", "Struggle", "Turning point", "Payoff"],
    slides: [
      { l: "photo", h: "She trained in a car park for three years." },
      { l: "photo", h: "No track. No coach." },
      { l: "photo", h: "Then the call came." },
      { l: "headline", h: "Podium. Paris.", b: "Watch the film.", invert: true },
    ],
  },
  {
    brand: "kinetik", days: 22, objective: "product-launch", format: "graphic", narrative: "comparison",
    styles: ["3d", "product-first"], density: "medium", cta: "shop-now",
    hook: "Old jersey vs. new jersey.",
    summary: "Side-by-side comparison launching a new training jersey with fabric callouts.",
    composition: "Split frame, 3D render placeholders, callout labels connected by thin lines.",
    reason: "Comparison makes an incremental product update feel meaningful.",
    caption: "Same fit. 40% lighter fabric. Out now.",
    sequence: ["Hook", "Comparison", "Detail", "CTA"],
    slides: [
      { l: "headline", h: "Old vs. new." },
      { l: "split", h: "40% lighter", b: "Same fit you know" },
      { l: "list", h: "What changed", i: ["Laser-cut vents", "Recycled yarn", "Flatlock seams"] },
      { l: "headline", h: "Out now.", invert: true },
    ],
  },
  {
    brand: "kinetik", days: 50, objective: "event", format: "graphic", narrative: "not_applicable",
    styles: ["bold-typography", "swiss-systematic"], density: "medium", cta: "sign-up",
    hook: "City 5K. Register before Friday.",
    summary: "Event poster with date, route distance, and registration deadline in a strict hierarchy.",
    composition: "Poster hierarchy: date largest, event name second, logistics in a three-column footer.",
    reason: "Reference for information-dense event posters that stay legible.",
    caption: "Registration closes Friday. 2,000 places.",
    slides: [{ l: "stat", s: "5K", h: "City run · 14 Oct", e: "Register by Friday" }],
  },

  // ── Entertainment ────────────────────────────────────────────────────────
  {
    brand: "lumen-pictures", days: 5, objective: "product-launch", format: "graphic", narrative: "announcement-benefits-cta",
    styles: ["editorial", "minimal"], density: "low", cta: "watch",
    hook: "In cinemas 14 November.",
    summary: "Release-date announcement using a quiet serif title card and a single date line.",
    composition: "Centred serif title, gold date line, deep black field with no imagery.",
    reason: "Restraint as a signal of prestige; the date is the only call to action.",
    caption: "The Quiet Harbour. In cinemas 14 November.",
    slides: [{ l: "headline", h: "The Quiet Harbour", e: "14 November", b: "Only in cinemas" }],
  },
  {
    brand: "lumen-pictures", days: 18, objective: "brand-storytelling", format: "quote", narrative: "claim-proof",
    styles: ["editorial"], density: "medium", cta: "watch",
    hook: "“A slow-burning masterpiece.”",
    summary: "Critic-quote carousel stacking three review pull-quotes before the trailer CTA.",
    composition: "One pull-quote per slide in large serif italics; publication credit in small caps.",
    reason: "Social proof sequence reusable for any launch with early reviews.",
    caption: "The reviews are in.",
    sequence: ["Claim", "Proof", "Proof", "CTA"],
    slides: [
      { l: "quote", h: "A slow-burning masterpiece.", b: "The Evening Review" },
      { l: "quote", h: "Unforgettable.", b: "Screen Weekly" },
      { l: "quote", h: "The year's most beautiful film.", b: "Frame Magazine" },
      { l: "headline", h: "Watch the trailer.", invert: true },
    ],
  },
  {
    brand: "lumen-pictures", days: 36, objective: "event", format: "photo-led", narrative: "not_applicable",
    styles: ["photography-led", "editorial"], density: "low", cta: "watch",
    hook: "Tonight: the premiere, live.",
    summary: "Premiere-night teaser with a single photo placeholder and live-stream time.",
    composition: "Full-bleed photo, small serif overlay bottom centre.",
    reason: "Minimal live-event format that works for any premiere.",
    caption: "Red carpet goes live at 7pm GMT.",
    slides: [{ l: "photo", h: "Tonight, the premiere.", e: "Live · 7pm GMT" }],
  },
  {
    brand: "pixelforge", days: 2, objective: "feature-announcement", format: "product-ui", narrative: "hook-explanation-cta",
    styles: ["playful", "3d"], density: "medium", cta: "learn-more",
    hook: "Co-op is finally here.",
    summary: "Game update carousel explaining a new co-op mode with UI-style panels.",
    composition: "Neon accent panels mimicking in-game UI, chunky rounded sans.",
    reason: "Shows how to explain a feature in the product's own visual language.",
    caption: "Squad up. Co-op lands in update 2.1.",
    sequence: ["Hook", "Explanation", "Explanation", "CTA"],
    slides: [
      { l: "headline", h: "Co-op is finally here.", e: "Update 2.1" },
      { l: "list", h: "Squad up", i: ["Up to 4 players", "Shared loot", "Cross-play"] },
      { l: "stat", s: "4", h: "players per squad" },
      { l: "headline", h: "Patch notes in bio.", invert: true },
    ],
  },
  {
    brand: "pixelforge", days: 16, objective: "community-engagement", format: "illustration-led", narrative: "not_applicable",
    styles: ["illustration", "playful"], density: "low", cta: "none",
    hook: "Fan art Friday.",
    summary: "Weekly fan-art feature crediting the artist prominently.",
    composition: "Illustration placeholder framed by a thick accent border; artist handle as caption.",
    reason: "Repeatable community format with clear creator credit.",
    caption: "This week's pick. Tag us for next Friday.",
    slides: [{ l: "photo", h: "Fan art Friday", e: "Week 32" }],
  },
  {
    brand: "pixelforge", days: 44, objective: "promotion", format: "graphic", narrative: "not_applicable",
    styles: ["bold-typography", "playful"], density: "low", cta: "shop-now",
    hook: "50% off. This weekend only.",
    summary: "Sale graphic with a single oversized percentage and a countdown line.",
    composition: "Percentage takes 60% of the frame; accent underline on the deadline.",
    reason: "Maximum-clarity sale layout.",
    caption: "Half price until Sunday midnight.",
    slides: [{ l: "stat", s: "50%", h: "off everything", e: "Weekend only" }],
  },

  // ── Shopping ─────────────────────────────────────────────────────────────
  {
    brand: "parcel-co", days: 7, objective: "promotion", format: "graphic", narrative: "listicle",
    styles: ["playful", "swiss-systematic"], density: "medium", cta: "shop-now",
    hook: "Gifts under $25, sorted by person.",
    summary: "Seasonal gifting carousel organised by recipient, one slide per persona.",
    composition: "Modular product grid on cream, orange price tags, consistent header row.",
    reason: "Recipient-led structure is a strong pattern for gifting campaigns.",
    caption: "Gifting, solved. Save for later.",
    sequence: ["Hook", "Persona", "Persona", "Persona", "CTA"],
    slides: [
      { l: "headline", h: "Gifts under $25", e: "Sorted by person" },
      { l: "list", h: "For the cook", i: ["Spice set $18", "Linen apron $24"] },
      { l: "list", h: "For the reader", i: ["Book light $15", "Page marker set $9"] },
      { l: "list", h: "For the plant parent", i: ["Mister $12", "Terracotta trio $22"] },
      { l: "headline", h: "Shop the guide.", invert: true },
    ],
  },
  {
    brand: "parcel-co", days: 24, objective: "feature-announcement", format: "product-ui", narrative: "problem-solution",
    styles: ["minimal", "product-first"], density: "medium", cta: "learn-more",
    hook: "Missed a delivery again?",
    summary: "App feature announcement framing a pickup-locker option as the answer to missed deliveries.",
    composition: "Phone UI placeholder centred, problem on slide one in plain black type.",
    reason: "Problem–solution in three slides with the UI as proof.",
    caption: "Pickup lockers are live in 40 cities.",
    sequence: ["Problem", "Solution", "Proof"],
    slides: [
      { l: "headline", h: "Missed a delivery again?" },
      { l: "product", h: "Send it to a locker.", b: "Choose at checkout" },
      { l: "stat", s: "40", h: "cities live today" },
    ],
  },
  {
    brand: "parcel-co", days: 58, objective: "testimonial", format: "quote", narrative: "claim-proof",
    styles: ["minimal"], density: "medium", cta: "learn-more",
    hook: "“My shop tripled in a year.”",
    summary: "Seller testimonial single post with a large quote and a small revenue stat.",
    composition: "Quote occupies top two-thirds; stat and seller name in the footer.",
    reason: "Simple testimonial layout with one supporting number.",
    caption: "Meet Ana, who sells ceramics from her garage.",
    slides: [{ l: "quote", h: "My shop tripled in a year.", b: "Ana, ceramics seller" }],
  },
  {
    brand: "maison-vire", days: 9, objective: "product-launch", format: "photo-led", narrative: "story-journey",
    styles: ["editorial", "photography-led", "minimal"], density: "low", cta: "shop-now",
    hook: "Collection 07: Salt.",
    summary: "Fashion collection launch presented as a lookbook with one look per slide.",
    composition: "Tall portrait photo placeholders, tiny serif look numbers, wide margins.",
    reason: "Lookbook pacing: minimal copy, strong sequence.",
    caption: "Collection 07. Linen, raw edges, the colour of low tide.",
    sequence: ["Title", "Look", "Look", "Look", "CTA"],
    slides: [
      { l: "headline", h: "Collection 07: Salt" },
      { l: "photo", h: "Look 01", e: "Linen overshirt" },
      { l: "photo", h: "Look 02", e: "Wide trouser" },
      { l: "photo", h: "Look 03", e: "Knit vest" },
      { l: "headline", h: "Available now.", invert: true },
    ],
  },
  {
    brand: "maison-vire", days: 29, objective: "brand-storytelling", format: "mixed-media", narrative: "story-journey",
    styles: ["collage", "editorial"], density: "medium", cta: "learn-more",
    hook: "Where the linen comes from.",
    summary: "Sourcing story mixing archival-style collage and short editorial captions.",
    composition: "Layered collage fragments, handwritten-style annotations, serif captions.",
    reason: "Collage adds provenance texture to supply-chain stories.",
    caption: "From a family mill in Normandy.",
    sequence: ["Hook", "Place", "People", "Product"],
    slides: [
      { l: "photo", h: "Where the linen comes from." },
      { l: "photo", h: "Normandy, since 1911." },
      { l: "quote", h: "We still weave slowly.", b: "The mill" },
      { l: "headline", h: "Made to last decades.", invert: true },
    ],
  },
  {
    brand: "maison-vire", days: 63, objective: "promotion", format: "graphic", narrative: "not_applicable",
    styles: ["minimal", "editorial"], density: "low", cta: "shop-now",
    hook: "Archive sale. Quietly.",
    summary: "Understated sale post that avoids discount numbers entirely.",
    composition: "Two words, centred serif, generous whitespace.",
    reason: "Luxury sale framing without percentages.",
    caption: "Selected pieces from past collections.",
    slides: [{ l: "headline", h: "Archive sale.", b: "Selected pieces" }],
  },

  // ── Finance ──────────────────────────────────────────────────────────────
  {
    brand: "northbank", days: 5, objective: "educational", format: "infographic", narrative: "hook-explanation-cta",
    styles: ["swiss-systematic", "minimal"], density: "high", cta: "learn-more",
    hook: "What actually affects your credit score?",
    summary: "Educational carousel breaking credit score factors into weighted bars.",
    composition: "Horizontal bar chart per factor, green accent for the largest weight.",
    reason: "Turns a complex service topic into a scannable weighted list.",
    caption: "It's not as mysterious as it seems.",
    sequence: ["Hook", "Explanation", "Explanation", "CTA"],
    slides: [
      { l: "headline", h: "What affects your credit score?", e: "Explained" },
      { l: "stat", s: "35%", h: "Payment history" },
      { l: "list", h: "The rest", i: ["Credit used 30%", "History length 15%", "New credit 10%"] },
      { l: "headline", h: "Check yours free in the app.", invert: true },
    ],
  },
  {
    brand: "northbank", days: 20, objective: "employer-branding", format: "photo-led", narrative: "story-journey",
    styles: ["photography-led", "editorial"], density: "medium", cta: "learn-more",
    hook: "Meet the team that answers at 3am.",
    summary: "Employer-branding carousel featuring real support staff on the overnight shift.",
    composition: "Portrait placeholders with name and tenure; muted green overlay.",
    reason: "Humanises a bank through the people behind the service.",
    caption: "24/7 support means real people, all night.",
    sequence: ["Hook", "Employee", "Employee", "Invite"],
    slides: [
      { l: "photo", h: "Meet the night shift." },
      { l: "quote", h: "Someone's always scared at 3am. We help.", b: "Dele, 6 years" },
      { l: "quote", h: "It's the most human job I've had.", b: "Sam, 2 years" },
      { l: "headline", h: "We're hiring.", b: "Careers link in bio", invert: true },
    ],
  },
  {
    brand: "northbank", days: 47, objective: "feature-announcement", format: "product-ui", narrative: "announcement-benefits-cta",
    styles: ["minimal", "product-first"], density: "medium", cta: "learn-more",
    hook: "Round-ups are here.",
    summary: "App feature launch showing savings round-ups with a single UI screen.",
    composition: "Phone UI centred on deep green, benefit list below.",
    reason: "Minimal UI-led feature announcement.",
    caption: "Spare change, saved automatically.",
    sequence: ["Announcement", "Benefits", "CTA"],
    slides: [
      { l: "product", h: "Round-ups are here.", b: "Spare change, saved" },
      { l: "list", h: "How it works", i: ["Spend £3.40", "Save 60p", "Watch it add up"] },
      { l: "headline", h: "Turn it on today.", invert: true },
    ],
  },
  {
    brand: "tallypay", days: 10, objective: "feature-announcement", format: "product-ui", narrative: "claim-proof",
    styles: ["bold-typography", "playful"], density: "low", cta: "sign-up",
    hook: "Split the bill in one tap.",
    summary: "Feature carousel leading with a bold claim and proving it with a three-step flow.",
    composition: "Violet field, yellow accent on tap targets, oversized sans headline.",
    reason: "Claim–proof with UI steps as evidence.",
    caption: "Dinner's done. So is the maths.",
    sequence: ["Claim", "Proof", "Proof", "CTA"],
    slides: [
      { l: "headline", h: "Split the bill in one tap." },
      { l: "product", h: "Tap Split", b: "Pick friends" },
      { l: "stat", s: "1", h: "tap. Everyone's paid." },
      { l: "headline", h: "Get Tallypay.", invert: true },
    ],
  },
  {
    brand: "tallypay", days: 26, objective: "educational", format: "data-visualisation", narrative: "listicle",
    styles: ["playful", "swiss-systematic"], density: "high", cta: "learn-more",
    hook: "Where does a $5 coffee payment go?",
    summary: "Explainer carousel tracing a card payment through each fee in the chain.",
    composition: "Stacked bar that shrinks slide to slide; each segment labelled.",
    reason: "A clear pattern for explaining payment infrastructure to consumers.",
    caption: "Follow the money. It's quicker than you'd think.",
    sequence: ["Hook", "Step", "Step", "Step", "Summary"],
    slides: [
      { l: "headline", h: "Where does $5 go?", e: "Follow the money" },
      { l: "stat", s: "$4.85", h: "to the café" },
      { l: "stat", s: "$0.10", h: "to the card network" },
      { l: "stat", s: "$0.05", h: "to the processor" },
      { l: "list", h: "In under 2 seconds", i: ["Tap", "Authorise", "Settle"] },
    ],
  },
  {
    brand: "tallypay", days: 55, objective: "testimonial", format: "quote", narrative: "not_applicable",
    styles: ["bold-typography"], density: "medium", cta: "sign-up",
    hook: "“I stopped chasing my flatmates.”",
    summary: "Single-quote testimonial set huge on brand violet.",
    composition: "Quote fills the frame edge to edge; attribution in small yellow caps.",
    reason: "Type-only testimonial that reads at thumbnail size.",
    caption: "Flat bills, finally fair.",
    slides: [{ l: "quote", h: "I stopped chasing my flatmates.", b: "Jo, London" }],
  },

  // ── Travel & Transportation ─────────────────────────────────────────────
  {
    brand: "wayfarer-air", days: 4, objective: "promotion", format: "photo-led", narrative: "listicle",
    styles: ["photography-led", "editorial"], density: "medium", cta: "book-now",
    hook: "Five cities under £200 this winter.",
    summary: "Destination carousel with one city per slide and a fare on each.",
    composition: "Full-bleed destination photos, fare in amber, city name in large sans.",
    reason: "Fare-per-destination listicle is a proven travel format.",
    caption: "Winter escapes, return fares from £89.",
    sequence: ["Hook", "Destination", "Destination", "Destination", "CTA"],
    slides: [
      { l: "headline", h: "Five cities under £200", e: "This winter" },
      { l: "photo", h: "Lisbon", e: "From £89" },
      { l: "photo", h: "Marrakech", e: "From £129" },
      { l: "photo", h: "Reykjavík", e: "From £179" },
      { l: "headline", h: "Book by Sunday.", invert: true },
    ],
  },
  {
    brand: "wayfarer-air", days: 17, objective: "feature-announcement", format: "photo-led", narrative: "before-after",
    styles: ["photography-led", "minimal"], density: "low", cta: "learn-more",
    hook: "The new business seat, before and after.",
    summary: "Cabin upgrade announcement using a before/after pair of seat photographs.",
    composition: "Two stacked photo fields with thin amber divider and minimal labels.",
    reason: "Before–after makes a cabin refit tangible.",
    caption: "Fully flat, direct aisle access, from March.",
    sequence: ["Before", "After", "Detail"],
    slides: [
      { l: "photo", h: "Before.", e: "Business, 2019" },
      { l: "photo", h: "After.", e: "Business, 2027" },
      { l: "list", h: "What's new", i: ["Fully flat", "Aisle access", "Sliding door"] },
    ],
  },
  {
    brand: "wayfarer-air", days: 39, objective: "employer-branding", format: "photo-led", narrative: "story-journey",
    styles: ["photography-led", "editorial"], density: "medium", cta: "learn-more",
    hook: "Captain Okafor's first solo flight was 22 years ago.",
    summary: "Pilot profile carousel for a cadet recruitment push.",
    composition: "Cockpit photo placeholders, serif pull-quotes, amber rank detail.",
    reason: "Career-story format for recruitment.",
    caption: "Our cadet programme opens next month.",
    sequence: ["Hook", "Story", "Quote", "Invite"],
    slides: [
      { l: "photo", h: "22 years ago: first solo flight." },
      { l: "photo", h: "Today: 14,000 hours." },
      { l: "quote", h: "Every landing still feels new.", b: "Capt. Okafor" },
      { l: "headline", h: "Cadet programme opens soon.", invert: true },
    ],
  },
  {
    brand: "staybright", days: 6, objective: "educational", format: "infographic", narrative: "listicle",
    styles: ["editorial", "illustration"], density: "high", cta: "learn-more",
    hook: "How to pack for a week in one bag.",
    summary: "Practical packing-guide carousel, one category per slide.",
    composition: "Warm illustrated items with serif headings and short checklists.",
    reason: "Useful guide format that earns saves for a hospitality brand.",
    caption: "Carry-on only. It's easier than you think.",
    sequence: ["Hook", "Tip", "Tip", "Tip"],
    slides: [
      { l: "headline", h: "A week in one bag", e: "Packing guide" },
      { l: "list", h: "Clothes", i: ["3 tops", "2 bottoms", "1 layer"] },
      { l: "list", h: "Toiletries", i: ["Solid bars", "Refill minis"] },
      { l: "list", h: "The rule", i: ["Roll, don't fold", "Wear the bulkiest"] },
    ],
  },
  {
    brand: "staybright", days: 21, objective: "testimonial", format: "photo-led", narrative: "claim-proof",
    styles: ["photography-led", "editorial"], density: "medium", cta: "book-now",
    hook: "“We came for three nights and stayed ten.”",
    summary: "Guest story carousel pairing a quote with photos of the stay.",
    composition: "Serif quote on warm cream, then full-bleed room photos.",
    reason: "Guest voice plus visual proof.",
    caption: "A cliffside stay in the Algarve.",
    sequence: ["Claim", "Proof", "Proof", "CTA"],
    slides: [
      { l: "quote", h: "We came for three nights and stayed ten.", b: "The Harlows" },
      { l: "photo", h: "The terrace at 8am." },
      { l: "photo", h: "The view that did it." },
      { l: "headline", h: "Book the cliff house.", invert: true },
    ],
  },
  {
    brand: "staybright", days: 49, objective: "promotion", format: "graphic", narrative: "not_applicable",
    styles: ["minimal", "editorial"], density: "low", cta: "book-now",
    hook: "Stay four nights, pay for three.",
    summary: "Offer graphic with a single serif line and small terms.",
    composition: "Centred serif line, accent rule, terms in small type at the base.",
    reason: "Calm, premium offer layout.",
    caption: "Autumn stays, one night on us.",
    slides: [{ l: "headline", h: "Stay four nights, pay for three.", e: "Autumn offer" }],
  },

  // ── Review queue (not yet published) ────────────────────────────────────
  {
    brand: "fizzwell", status: "shortlisted", days: 1, objective: "event", format: "graphic", narrative: "not_applicable",
    styles: ["playful", "bold-typography"], density: "low", cta: "sign-up",
    hook: "Free cans at the pier, Saturday.",
    summary: "Sampling-event graphic with date, location, and time.",
    composition: "Heavy type stack with a location pin accent.",
    reason: "Candidate: clear event hierarchy.",
    caption: "Come thirsty. Saturday 12–4.",
    slides: [{ l: "headline", h: "Free cans at the pier.", e: "Saturday 12–4" }],
  },
  {
    brand: "kinetik", status: "shortlisted", days: 1, objective: "product-launch", format: "graphic", narrative: "announcement-benefits-cta",
    styles: ["bold-typography", "product-first"], density: "low", cta: "shop-now",
    hook: "The Tempo short. Built for heat.",
    summary: "Launch graphic for a lightweight running short.",
    composition: "Blue field, orange product callouts.",
    reason: "Candidate: tidy product-first launch.",
    caption: "Tempo shorts land Friday.",
    slides: [{ l: "product", h: "Tempo short", b: "Built for heat" }],
  },
  {
    brand: "pixelforge", status: "candidate", days: 0, objective: "event", format: "graphic", narrative: "not_applicable",
    styles: ["playful"], density: "medium", cta: "watch",
    hook: "Showcase stream, Thursday 6pm.",
    summary: "Stream announcement graphic.",
    composition: "Neon on purple with a countdown.",
    reason: "Candidate awaiting shortlist.",
    caption: "New reveals Thursday.",
    slides: [{ l: "headline", h: "Showcase stream", e: "Thursday 6pm" }],
  },
  {
    brand: "maison-vire", status: "candidate", days: 0, objective: "brand-storytelling", format: "photo-led", narrative: "story-journey",
    styles: ["editorial"], density: "low", cta: "none",
    hook: "The atelier, after hours.",
    summary: "Mood post from the studio.",
    composition: "Dim photo placeholder with small serif caption.",
    reason: "Candidate awaiting shortlist.",
    caption: "Quiet work.",
    slides: [{ l: "photo", h: "After hours.", e: "The atelier" }],
  },
  {
    brand: "tallypay", status: "candidate", days: 0, objective: "promotion", format: "graphic", narrative: "not_applicable",
    styles: ["bold-typography"], density: "low", cta: "sign-up",
    hook: "Refer a friend, both get $10.",
    summary: "Referral promo graphic.",
    composition: "Oversized $10 on violet.",
    reason: "Candidate awaiting shortlist.",
    caption: "Share the love.",
    slides: [{ l: "stat", s: "$10", h: "for you and a friend" }],
  },
  {
    brand: "wayfarer-air", status: "candidate", days: 1, objective: "community-engagement", format: "photo-led", narrative: "not_applicable",
    styles: ["photography-led"], density: "low", cta: "none",
    hook: "Window seat or aisle?",
    summary: "Engagement poll with a cabin photo.",
    composition: "Full-bleed cabin photo with two-option overlay.",
    reason: "Candidate awaiting shortlist.",
    caption: "Tell us below.",
    slides: [{ l: "photo", h: "Window or aisle?" }],
  },

  // ── Removed (suppressed after a takedown) ───────────────────────────────
  {
    brand: "northbank", status: "removed", days: 70, objective: "promotion", format: "graphic", narrative: "not_applicable",
    styles: ["minimal"], density: "low", cta: "sign-up",
    hook: "Switch and get £150.",
    summary: "Switching incentive graphic (removed after a source removal request).",
    composition: "Large figure on green.",
    reason: "Removed.",
    caption: "Offer ended.",
    slides: [{ l: "stat", s: "£150", h: "when you switch" }],
  },
];

const DEMO_PROMPT_VERSION = "demo-seed";
const DEMO_MODEL_VERSION = "hand-authored-demo";

export function seedDemoLibrary(database: DatabaseSync) {
  const nowIso = new Date().toISOString();
  const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

  database.exec("BEGIN");
  try {
    const insertCategory = database.prepare(
      "INSERT INTO categories (id, name, status) VALUES (?, ?, 'active')"
    );
    for (const category of categories) insertCategory.run(category.id, category.name);

    const insertBrand = database.prepare(`
      INSERT INTO brands (id, name, primary_category_id, handle, profile_url, market, language,
        identity_status, audit_status, source_approval_status, ingestion_enabled, is_demo, last_success_at)
      VALUES (?, ?, ?, ?, ?, ?, 'en', 'confirmed', 'passed', 'approved', 0, 1, ?)
    `);
    for (const brand of brands) {
      insertBrand.run(
        brand.id,
        brand.name,
        brand.category,
        brand.id.replace(/-/g, ""),
        `https://example.com/demo/${brand.id}`,
        brand.market,
        daysAgo(1)
      );
    }

    const insertPost = database.prepare(`
      INSERT INTO source_posts (id, platform, platform_post_id, source_url, brand_id, caption, media_type,
        published_at, captured_at, last_checked_at, editorial_status, processing_status, publication_status,
        reference_status, created_at, updated_at)
      VALUES (?, 'instagram', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'owned', ?, ?)
    `);
    const insertSlide = database.prepare(
      "INSERT INTO post_slides (id, post_id, position, alt_text, art, ocr_text) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const insertAnalysis = database.prepare(`
      INSERT INTO creative_analyses (id, post_id, objective_id, format_id, hook, summary, visual_styles,
        narrative_id, narrative_sequence, text_density, dominant_colors, composition, cta_type,
        editorial_reason, confidence, human_reviewed, taxonomy_version, prompt_version, model_version, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertSearch = database.prepare(
      "INSERT INTO post_search (post_id, brand, caption, ocr, analysis) VALUES (?, ?, ?, ?, ?)"
    );

    posts.forEach((spec, index) => {
      const brand = brands.find((item) => item.id === spec.brand)!;
      const status = spec.status ?? "published";
      const id = randomUUID();
      const platformPostId = `demo-${String(index + 1).padStart(4, "0")}`;
      const mediaType = spec.slides.length > 1 ? "carousel" : "static";
      const published = daysAgo(spec.days + 1);
      const captured = daysAgo(spec.days);

      insertPost.run(
        id,
        platformPostId,
        `https://example.com/demo/${brand.id}/p/${platformPostId}`,
        brand.id,
        spec.caption,
        mediaType,
        published,
        captured,
        daysAgo(Math.min(spec.days, 1)),
        status === "candidate" ? "candidate" : "shortlisted",
        status === "candidate" ? "pending" : "ready",
        status === "published" ? "published" : status === "removed" ? "removed" : "unpublished",
        nowIso,
        nowIso
      );

      const ocr: string[] = [];
      spec.slides.forEach((slide, position) => {
        const art: SlideArt = {
          layout: slide.l,
          bg: slide.invert ? brand.palette.accent : brand.palette.bg,
          fg: slide.invert ? brand.palette.bg : brand.palette.fg,
          accent: slide.invert ? brand.palette.fg : brand.palette.accent,
          brand: brand.name,
          headline: slide.h,
          body: slide.b,
          eyebrow: slide.e,
          items: slide.i,
          stat: slide.s,
          serif: brand.palette.serif,
        };
        const text = slideText(art);
        ocr.push(text);
        insertSlide.run(
          randomUUID(),
          id,
          position,
          `${brand.name} ${mediaType === "carousel" ? `slide ${position + 1}` : "post"}: ${text}`,
          JSON.stringify(art),
          text
        );
      });

      insertAnalysis.run(
        randomUUID(),
        id,
        spec.objective,
        spec.format,
        spec.hook,
        spec.summary,
        JSON.stringify(spec.styles),
        spec.narrative,
        JSON.stringify(spec.sequence ?? []),
        spec.density,
        JSON.stringify([brand.palette.bg, brand.palette.accent]),
        spec.composition,
        spec.cta,
        spec.reason,
        0.8,
        status === "published" ? 1 : 0,
        TAXONOMY_VERSION,
        DEMO_PROMPT_VERSION,
        DEMO_MODEL_VERSION,
        nowIso
      );

      const analysisText = [
        spec.hook,
        spec.summary,
        spec.composition,
        spec.reason,
        objectives.find((term) => term.id === spec.objective)?.name,
        formats.find((term) => term.id === spec.format)?.name,
        narratives.find((term) => term.id === spec.narrative)?.name,
        ...spec.styles.map((style) => visualStyles.find((term) => term.id === style)?.name),
        ctaTypes.find((term) => term.id === spec.cta)?.name,
        categories.find((term) => term.id === brand.category)?.name,
        mediaType,
      ]
        .filter(Boolean)
        .join(" ");

      insertSearch.run(id, brand.name, spec.caption, ocr.join(" "), analysisText);
    });

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
