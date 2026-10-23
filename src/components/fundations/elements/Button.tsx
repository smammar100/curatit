import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Button as FluidButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The button, since 2026-10-23 Fluid Functionalism's (src/components/ui/button.tsx, installed with
// the shadcn CLI) behind the API the site has used all along. It keeps the library's craft: the
// surface sits 1px inside the button and a same-colour shadow fills it out, so a press shrinks it
// exactly 1px a side at any width; a label never wraps; loading keeps the label mounted at opacity
// 0 under the spinner, so the width never changes; and the corners and size come from the site's
// shape and size providers (pill, compact: 28px tall, 12px text; the two larger sizes take the
// library's default step, 36px and 13px, for the hero's calls and the dashboard header).
//
// A link that looks like an action is `isLink` with an href (the library's asChild over Next's
// Link). Icon-only buttons must be named (`aria-label`); the types insist.

// Curatit's variants on the library's four looks. The brand and danger fills are the primary look
// with its ink swapped for the brand or danger colour (the library's primary reads --foreground
// for its fill and --background for its text, so the two variables are set on the button alone);
// the quiet danger is the tinted secondary with the danger tint
const variants = {
  /** Primary: the ink. One per view */
  default: { variant: "primary", className: "" },
  /** Secondary: a hairline ring, no fill until hovered */
  secondary: { variant: "tertiary", className: "" },
  /** Tertiary: a see-through tint of whatever it sits on */
  muted: { variant: "secondary", className: "" },
  /** Brand: Curatit's terracotta */
  accent: {
    variant: "primary",
    className: "[--foreground:var(--color-brand-solid)] [--background:var(--color-paper)]",
  },
  danger: {
    variant: "primary",
    className: "[--foreground:var(--color-danger-solid)] [--background:var(--color-paper)]",
  },
  dangerSubtle: {
    variant: "secondary",
    className:
      "[--tint:var(--color-danger-subtle)] [--tint-hover:var(--color-danger-subtle-hover)] text-danger-foreground",
  },
  /** Ghost: words alone until hovered */
  transparent: { variant: "ghost", className: "" },
  none: { variant: "ghost", className: "" },
} as const;

// The site's seven size names, every one on the library's compact step (28px, 12px text: the
// site's setting, the dashboard's header and the hero's calls included; the names are kept for
// the call sites)
const sizes = {
  xxs: "compact",
  xs: "compact",
  sm: "compact",
  base: "compact",
  md: "compact",
  lg: "compact",
  xl: "compact",
} as const;
// On touch screens a compact button reaches 44px tall through an invisible ::after, so nothing
// moves (the library's root is relative, so the box is placed against it)
const touch = "pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2";
// An icon sits 4px closer to its edge than the label does, as the library sets its own icon slots
const iconInset = {
  compact: { left: "pl-2", right: "pr-2" },
  default: { left: "pl-3", right: "pr-3" },
} as const;
// Gaps between the icon slots and the label, when a wider one is wanted
const gaps = {
  xs: "gap-2",
  sm: "gap-4",
  base: "gap-8",
  md: "gap-10",
  lg: "gap-12",
};

type CommonProps = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** Accepted for older call sites; every button is a pill (the site's shape setting) */
  shape?: "rounded" | "pill";
  gap?: keyof typeof gaps;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Busy: the spinner over the label, which keeps its width; the button is disabled meanwhile */
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

// Renders a <button> (type="button" unless told otherwise), or a link when `isLink` is set.
// With `iconOnly`, children are the icon.
export default function Button({
  variant = "default",
  size = "base",
  shape: _shape,
  iconOnly = false,
  gap,
  leftIcon,
  rightIcon,
  loading = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const look = variants[variant];
  const step = sizes[size];
  const classes = cn(
    look.className,
    step === "compact" && touch,
    !iconOnly && leftIcon && iconInset[step].left,
    !iconOnly && rightIcon && iconInset[step].right,
    className,
  );
  // The label is one flex row inside the library's trimmed label span, with the library's own
  // icon gap for its step (6px compact, 8px default; the span can't inherit it through the
  // trimmed span, which isn't a flex container)
  const label = iconOnly ? (
    children
  ) : (
    <span className={cn("inline-flex items-center", gap ? gaps[gap] : step === "compact" ? "gap-1.5" : "gap-2")}>
      {leftIcon}
      {children}
      {rightIcon}
    </span>
  );
  const fluid = {
    variant: look.variant,
    size: iconOnly ? (step === "compact" ? "icon-compact" : "icon") : step,
    loading,
    className: classes,
  } as const;

  if (rest.isLink) {
    const { isLink: _isLink, ref, ...linkProps } = rest;
    return (
      <FluidButton asChild {...fluid}>
        <Link ref={ref} {...linkProps}>
          {label}
        </Link>
      </FluidButton>
    );
  }
  const { isLink: _isLink, type = "button", ...buttonProps } = rest;
  return (
    <FluidButton type={type} {...fluid} {...buttonProps}>
      {label}
    </FluidButton>
  );
}
