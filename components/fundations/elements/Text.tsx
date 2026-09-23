import type { ElementType, ReactNode } from "react";
import Link from "next/link";

export type TextVariant =
  | "display6XL"
  | "display5XL"
  | "display4XL"
  | "display3XL"
  | "display2XL"
  | "displayXL"
  | "displayLG"
  | "displayMD"
  | "displaySM"
  | "displayXS"
  | "textXL"
  | "textLG"
  | "textBase"
  | "textSM"
  | "textXS";

export type TextTag =
  | "a"
  | "p"
  | "em"
  | "span"
  | "small"
  | "strong"
  | "blockquote"
  | "div"
  | "time"
  | "dt"
  | "dd"
  | "li"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";

// Variants map onto the design system's roles: display variants are serif
// headings (see globals.css), text variants are Inter on the FF type scale.
const textStyles: Record<TextVariant, string> = {
  display6XL: "heading-hero",
  display5XL: "heading-hero",
  display4XL: "heading-hero",
  display3XL: "heading-hero",
  display2XL: "heading-hero",
  displayXL: "heading-display",
  displayLG: "heading-display",
  displayMD: "heading-section",
  displaySM: "heading-section",
  displayXS: "heading-section",
  textXL: "text-[16px] leading-6",
  textLG: "text-[14px] leading-5",
  textBase: "text-[14px] leading-6",
  textSM: "text-[13px] leading-5",
  textXS: "text-[12px] leading-4",
};

type TextProps = {
  tag?: TextTag;
  variant?: TextVariant;
  className?: string;
  children?: ReactNode;
  href?: string;
} & Record<string, unknown>;

export default function Text({
  tag = "p",
  variant = "textBase",
  className = "",
  children,
  href,
  ...rest
}: TextProps) {
  const classes = `${textStyles[variant] ?? textStyles.textBase} ${className}`.trim();

  // Internal links get Next's client-side navigation; external ones stay plain.
  if (tag === "a" && href) {
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={classes} {...rest}>
          {children}
        </Link>
      );
    }

    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  const Tag = tag as ElementType;

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
