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

// Define text styles for each variant
const textStyles = {
  display6XL: "text-4xl  sm:text-7xl md:text-9xl lg:text-[12rem]",
  display5XL: "text-4xl  sm:text-7xl md:text-8xl lg:text-[10rem]",
  display4XL: "text-4xl  sm:text-7xl md:text-8xl lg:text-9xl",
  display3XL: "text-5xl  sm:text-6xl md:text-7xl lg:text-8xl",
  display2XL: "text-5xl  sm:text-5xl md:text-6xl lg:text-7xl",
  displayXL: "text-4xl  sm:text-4xl md:text-5xl lg:text-6xl",
  displayLG: "text-3xl  sm:text-3xl md:text-4xl lg:text-5xl",
  displayMD: "text-2xl  sm:text-2xl md:text-3xl lg:text-4xl",
  displaySM: "text-lg  sm:text-xl md:text-2xl lg:text-3xl",
  displayXS: "text-base  sm:text-lg md:text-xl lg:text-2xl",
  textXL: "text-lg sm:text-xl md:text-2xl",
  textLG: "text-base sm:text-lg md:text-xl ",
  textBase: "text-base",
  textSM: "text-sm ",
  textXS: "text-xs ",
};

export type TextVariant = keyof typeof textStyles;

type TextProps = HTMLAttributes<HTMLElement> & {
  tag?: TextTag; // Defaults to a paragraph
  variant?: TextVariant; // Defaults to textBase
  href?: string; // Only used when tag is "a"
  target?: string;
  rel?: string;
};

export default function Text({
  tag: Tag = "p",
  variant = "textBase",
  className = "",
  href,
  target,
  rel,
  ...rest
}: TextProps) {
  // Combine the variant classes with any additional custom classes
  const classes = `${textStyles[variant]} ${className}`.trim();

  if (Tag === "a" && href) {
    return <Link href={href} target={target} rel={rel} className={classes} {...rest} />;
  }
  return <Tag className={classes} {...rest} />;
}
