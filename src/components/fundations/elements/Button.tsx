import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
  Ref,
} from "react";
import CircleNotch from "@/components/fundations/icons/CircleNotch";
import { cx } from "@/lib/cx";

// The button, Interfere's since 2026-10-15 (design.interfere.com/button): 13px medium text,
// heights 24 / 28 / 32 / 40, radius 6 up to the medium size and 8 from large, no borders (the
// secondary one carries the default shadow instead), hover and active a step each. Since
// 2026-10-18 two larger sizes carry the dashboard's own controls (44 and 48px, usually with
// shape="pill", their label in the dashboard's subtitle role, 14px). Variants keep the older
// names where the role matched (default = primary, muted = tertiary, accent = brand) and add
// Interfere's others.
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
// Sizes: Interfere's small, medium, large and extra large (xxs 24, xs 28, sm 32, base 40; md is
// another name for base), then the dashboard's lg 44 and xl 48
const sizes = {
  xxs: "h-6 px-2 gap-1",
  xs: "h-7 px-2.5 gap-1.5",
  sm: "h-8 px-3 gap-1.5",
  base: "h-10 px-3.5 gap-2",
  md: "h-10 px-3.5 gap-2",
  lg: "h-11 px-4 gap-2",
  xl: "h-12 px-6 gap-2",
};
// Icon-only: a square of the same height
const iconSizes = {
  xxs: "size-6",
  xs: "size-7",
  sm: "size-8",
  base: "size-10",
  md: "size-10",
  lg: "size-11",
  xl: "size-12",
};
// Label size: Interfere's 13px, and the dashboard's subtitle role (14/20) on its two sizes
const textSizes = {
  xxs: "text-body-sm",
  xs: "text-body-sm",
  sm: "text-body-sm",
  base: "text-body-sm",
  md: "text-body-sm",
  lg: "text-subtitle",
  xl: "text-subtitle",
};
// Radius by size; `shape="pill"` takes its place (kept apart so the two never both land)
const radius = {
  xxs: "rounded-md",
  xs: "rounded-md",
  sm: "rounded-lg",
  base: "rounded-lg",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-xl",
};
// On touch screens the two small sizes reach 44px tall through an invisible ::after, so nothing
// moves; an icon-only one grows 4px each side as well (a row's gap-2 still keeps them apart)
const touchSizes: Partial<Record<keyof typeof sizes, string>> = {
  xxs: "pointer-coarse:after:absolute pointer-coarse:after:-inset-y-2.5",
  xs: "pointer-coarse:after:absolute pointer-coarse:after:-inset-y-2",
};
// Gaps between the icon slots and the label, when a wider one is wanted
const gaps = {
  xs: "gap-2",
  sm: "gap-4",
  base: "gap-8",
  md: "gap-10",
  lg: "gap-12",
};
// Presses in to 0.97 (2026-10-18; the homepage's category tabs and the dashboard's pills press to
// 0.96, a step deeper for their smaller size) only while it can act and only with motion allowed;
// colours and the press share one 150ms ease-out
const baseClass =
  "relative inline-flex shrink-0 items-center justify-center text-center font-medium whitespace-nowrap transition-[color,background-color,box-shadow,scale] duration-150 ease-out-quint select-none touch-manipulation motion-safe:not-disabled:not-aria-disabled:active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus disabled:pointer-events-none disabled:bg-disabled disabled:text-disabled-foreground disabled:shadow-none";

type CommonProps = {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizes;
  /** `pill` rounds the ends fully */
  shape?: "rounded" | "pill";
  gap?: keyof typeof gaps;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Busy: a spinner over the label, which keeps its width. The button stays focusable
   * (aria-disabled, not disabled) and ignores clicks until it's done.
   * Client components only: the click guard is a function, which a server component can't hand
   * to a <button> or a Link (React refuses at render). Being busy is client state anyway */
  loading?: boolean;
  className?: string;
  children?: ReactNode;
};

// An icon-only button has no words of its own, so whenever `iconOnly` can be true the button
// must be named for screen readers
type Naming =
  | { iconOnly?: false }
  | { iconOnly?: boolean; "aria-label": string }
  | { iconOnly?: boolean; "aria-labelledby": string };

type ButtonAsLink = CommonProps & {
  isLink: true;
  href: string;
  ref?: Ref<HTMLAnchorElement>;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href">;

type ButtonAsButton = CommonProps & {
  isLink?: false;
  ref?: Ref<HTMLButtonElement>;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps>;

export type ButtonProps = (ButtonAsLink | ButtonAsButton) & Naming;

const ignore = (event: MouseEvent) => event.preventDefault();

// Renders a <button> (type="button" unless told otherwise), or a link when `isLink` is set.
// With `iconOnly`, children are the icon.
export default function Button({
  variant = "default",
  size = "base",
  shape,
  iconOnly = false,
  gap,
  leftIcon,
  rightIcon,
  loading = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cx(
    baseClass,
    loading ? "cursor-progress" : "cursor-pointer",
    variantClasses[variant],
    iconOnly ? iconSizes[size] : sizes[size],
    textSizes[size],
    shape === "pill" ? "rounded-full" : radius[size],
    touchSizes[size],
    touchSizes[size] &&
      (iconOnly ? "pointer-coarse:after:-inset-x-1" : "pointer-coarse:after:inset-x-0"),
    !iconOnly && gap && gaps[gap],
    className,
  );
  const label = iconOnly ? (
    children
  ) : (
    <>
      {leftIcon}
      {children}
      {rightIcon}
    </>
  );
  // While loading the label stays in place (and in the accessibility tree, so the button keeps
  // its name) at opacity 0, with the spinner centred over it in the variant's own colour
  const content = loading ? (
    <>
      <span className="inline-flex items-center justify-center gap-[inherit] opacity-0">
        {label}
      </span>
      <span className="absolute inset-0 grid place-items-center">
        <CircleNotch className="size-4 animate-spin motion-reduce:animate-none" />
      </span>
    </>
  ) : (
    label
  );
  const busy = loading
    ? { "aria-busy": true, "aria-disabled": true, onClick: ignore }
    : {};

  if (rest.isLink) {
    const { isLink, ...linkProps } = rest;
    return (
      <Link className={classes} {...linkProps} {...busy}>
        {content}
      </Link>
    );
  }
  const { isLink, type = "button", ...buttonProps } = rest;
  return (
    <button className={classes} type={type} {...buttonProps} {...busy}>
      {content}
    </button>
  );
}
