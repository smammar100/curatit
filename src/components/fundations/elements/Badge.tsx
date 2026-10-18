import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

// A badge, Interfere's (design.interfere.com/badge, installed 2026-10-15): a small label with
// no border at 16 / 20 / 24px (11 / 12 / 13px regular text), radius 4 up to medium and 6 at
// large, or a pill. Default is a tint of the ground; outline a hairline; inverted solid; brand
// and danger their subtle tints.
const variants = {
  default: "bg-component text-secondary-foreground",
  transparent: "bg-transparent text-secondary-foreground",
  inverted: "bg-inverted-solid text-on-inverted-foreground",
  outline:
    "bg-transparent text-secondary-foreground ring-1 ring-inset ring-border-strong",
  brand: "bg-brand-subtle text-on-brand-subtle-foreground",
  danger: "bg-danger-subtle text-danger-foreground",
};
const sizes = {
  sm: "h-4 px-1.5 text-caption-base",
  md: "h-5 px-1.5 text-caption-lg",
  lg: "h-6 px-2 text-body-sm",
};
// Radius by size; `shape="pill"` takes its place (kept apart so the two never both land)
const radius = {
  sm: "rounded-sm",
  md: "rounded-sm",
  lg: "rounded-md",
};

export default function Badge({
  variant = "default",
  size = "md",
  shape,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  shape?: "rounded" | "pill";
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap",
        variants[variant],
        sizes[size],
        shape === "pill" ? "rounded-full" : radius[size],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
