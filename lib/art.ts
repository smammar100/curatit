/**
 * Spec for generated demo slide artwork. Real ingested posts reference stored
 * media assets instead; demo posts are drawn as SVG so the library contains no
 * third-party imagery.
 */
export type SlideLayout = "headline" | "split" | "stat" | "list" | "quote" | "product" | "photo";

export type SlideArt = {
  layout: SlideLayout;
  bg: string;
  fg: string;
  accent: string;
  brand: string;
  eyebrow?: string;
  headline: string;
  body?: string;
  items?: string[];
  stat?: string;
  /** Serif display type instead of heavy sans. */
  serif?: boolean;
};

/** All visible words on a slide — stands in for OCR text on demo content. */
export function slideText(art: SlideArt) {
  return [art.eyebrow, art.headline, art.body, art.stat, ...(art.items ?? [])]
    .filter(Boolean)
    .join(" ");
}
