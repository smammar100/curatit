import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cx } from "@/lib/cx";

// The button, Interfere's since 2026-10-15 (design.interfere.com/button): 13px medium text at
// every size, heights 24 / 28 / 32 / 40, radius 6 up to the medium size and 8 from large, no
// borders (the secondary one carries the default shadow instead), hover and active a step each.
// Variants keep the older names where the role matched (default = primary, muted = tertiary,
// accent = brand) and add Interfere's others.
const variantClasses = {
  // Primary: solid near-black (near-white on the dark site)
  default:
    "bg-inverted-solid text-on-inverted-foreground hover:bg-inverted-solid-hover active:bg-inverted-solid-active",
  // Secondary: a white surface lifted by the default shadow
  secondary:
    "bg-component-on-container-subtle text-primary-foreground shadow-sm hover:bg-component-on-container-subtle-hover",
  // Tertiary: a tint of the ground
  muted:
    "bg-component text-secondary-foreground hover:bg-component-hover hover:text-primary-foreground active:bg-component-active",
  // Brand: Curatit's terracotta
  accent:
    "bg-brand-solid text-on-brand-solid-foreground hover:bg-brand-solid-hover active:bg-brand-solid-active",
  danger:
    "bg-danger-solid text-on-danger-solid-foreground hover:bg-danger-solid-hover active:bg-danger-solid-active",
  dangerSubtle:
    "bg-danger-subtle text-danger-foreground hover:bg-danger-subtle-hover",
  transparent:
    "bg-transparent text-secondary-foreground hover:bg-transparent-hover hover:text-primary-foreground active:bg-transparent-active",
  none: "",
};
// Sizes: Interfere's small, medium, large and extra large. The older keys map onto them
// (xxs → small, xs → medium, sm → large, base and up → extra large)
const sizes = {
  xxs: "h-6 px-2 gap-1 rounded-md",
  xs: "h-7 px-2.5 gap-1.5 rounded-md",
  sm: "h-8 px-3 gap-1.5 rounded-lg",
  base: "h-10 px-3.5 gap-2 rounded-lg",
  md: "h-10 px-3.5 gap-2 rounded-lg",
  lg: "h-10 px-3.5 gap-2 rounded-lg",
  xl: "h-10 px-3.5 gap-2 rounded-lg",
};
// Icon-only: a square of the same height
const iconSizes = {
  xxs: "size-6 rounded-md",
  xs: "size-7 rounded-md",
  sm: "size-8 rounded-lg",
  base: "size-10 rounded-lg",
  md: "size-10 rounded-lg",
  lg: "size-10 rounded-lg",
  xl: "size-10 rounded-lg",
};
// Gaps between the icon slots and the label, when a wider one is wanted
const gaps = {
  xs: "gap-2",
  sm: "gap-4",
  base: "gap-8",
  md: "gap-10",
  lg: "gap-12",
};
const baseClass =
  "inline-flex shrink-0 cursor-pointer items-center justify-center text-center text-body-sm font-medium whitespace-nowrap transition-colors duration-150 ease-out select-none touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus disabled:pointer-events-none disabled:bg-disabled disabled:text-disabled-foreground disabled:shadow-none";

type CommonProps = {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizes;
  /** `pill` rounds the ends fully */
  shape?: "rounded" | "pill";
  iconOnly?: boolean;
  gap?: keyof typeof gaps;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

type ButtonAsLink = CommonProps & { isLink: true; href: string } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof CommonProps | "href"
  >;

type ButtonAsButton = CommonProps & { isLink?: false } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof CommonProps
  >;

export type ButtonProps = ButtonAsLink | ButtonAsButton;

// Renders a <button>, or a link when `isLink` is set. With `iconOnly`, children are the icon.
export default function Button({
  variant,
  size,
  shape,
  iconOnly = false,
  gap,
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cx(
    baseClass,
    variant && variantClasses[variant],
    size && (iconOnly ? iconSizes[size] : sizes[size]),
    shape === "pill" && "rounded-full",
    !iconOnly && gap && gaps[gap],
    className,
  );
  const content = iconOnly ? (
    children
  ) : (
    <>
      {leftIcon}
      {children}
      {rightIcon}
    </>
  );

  if (rest.isLink) {
    const { isLink, ...linkProps } = rest;
    return (
      <Link className={classes} {...linkProps}>
        {content}
      </Link>
    );
  }
  const { isLink, ...buttonProps } = rest;
  return (
    <button className={classes} {...buttonProps}>
      {content}
    </button>
  );
}
