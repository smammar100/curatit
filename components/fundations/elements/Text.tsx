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

// Define text styles for each variant
const textStyles: Record<TextVariant, string> = {
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
