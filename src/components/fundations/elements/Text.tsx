import Link from "next/link";
import type { HTMLAttributes } from "react";

type TextTag =
  | "a"
  | "p"
  | "em"
  | "span"
  | "small"
  | "strong"
  | "blockquote"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";

// The type scale, Interfere's since 2026-10-15 (design.interfere.com/heading, /text, /caption):
// six heading sizes with -0.01em tracking (56/56, 44/56, 36/44, 28/36, 24/32, 20/24), three body
// sizes (18/24, 15/24, 13/20) and four captions (12, 11, 10 on a 16 leading, 8/12). The sizes,
// leadings and tracking come from the `--text-*` tokens in global.css. Headings keep Curatit's
// serif (Hedvig Letters Serif, one regular weight; the owner asked for it back the same day), so
// the serif and its weight ride on every heading variant, and they step down on smaller screens.
//
// The older variant names (displayLG, textBase, …) map onto the same scale, so every page keeps
// working; new code should use the new names.
const textStyles = {
  // Headings
  h1: "font-display font-normal text-h3 sm:text-h2 lg:text-h1",
  h2: "font-display font-normal text-h4 md:text-h3 lg:text-h2",
  h3: "font-display font-normal text-h5 md:text-h4 lg:text-h3",
  h4: "font-display font-normal text-h5 lg:text-h4",
  h5: "font-display font-normal text-h6 lg:text-h5",
  h6: "font-display font-normal text-h6",
  // Body
  bodyLG: "text-body-lg",
  body: "text-body-base",
  bodySM: "text-body-sm",
  // Captions
  captionLG: "text-caption-lg",
  caption: "text-caption-base",
  captionSM: "text-caption-sm",
  captionXS: "text-caption-xs",
  // Older names, kept so existing pages render on the new scale
  display6XL: "font-display font-normal text-h3 sm:text-h2 lg:text-h1",
  display5XL: "font-display font-normal text-h3 sm:text-h2 lg:text-h1",
  display4XL: "font-display font-normal text-h3 sm:text-h2 lg:text-h1",
  display3XL: "font-display font-normal text-h3 sm:text-h2 lg:text-h1",
  display2XL: "font-display font-normal text-h3 sm:text-h2 lg:text-h1",
  displayXL: "font-display font-normal text-h3 sm:text-h2 lg:text-h1",
  displayLG: "font-display font-normal text-h3 sm:text-h2 lg:text-h1",
  displayMD: "font-display font-normal text-h4 md:text-h3 lg:text-h2",
  displaySM: "font-display font-normal text-h5 md:text-h4 lg:text-h3",
  displayXS: "font-display font-normal text-h6 lg:text-h5",
  textXL: "text-body-lg",
  textLG: "text-body-lg",
  textBase: "text-body-base",
  textSM: "text-body-sm",
  textXS: "text-caption-lg",
};

export type TextVariant = keyof typeof textStyles;

type TextProps = HTMLAttributes<HTMLElement> & {
  tag?: TextTag; // Defaults to a paragraph
  variant?: TextVariant; // Defaults to body (15/24)
  href?: string; // Only used when tag is "a"
  target?: string;
  rel?: string;
};

export default function Text({
  tag: Tag = "p",
  variant = "body",
  className = "",
  href,
  target,
  rel,
  ...rest
}: TextProps) {
  // Combine the variant classes with any additional custom classes
  const classes = `${textStyles[variant]} ${className}`.trim();

  if (Tag === "a" && href) {
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        className={classes}
        {...rest}
      />
    );
  }
  return <Tag className={classes} {...rest} />;
}
