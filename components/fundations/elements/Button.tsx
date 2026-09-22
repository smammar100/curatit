import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

export type ButtonVariant = "default" | "accent" | "muted" | "none";
export type ButtonSize = "xxs" | "xs" | "sm" | "base" | "md" | "lg" | "xl";
export type ButtonGap = "xs" | "sm" | "base" | "md" | "lg";

const variantClass: Record<ButtonVariant, string[]> = {
  default: ["text-white", "bg-base-800", "hover:bg-base-700", "focus:outline-base-700"],
  accent: ["text-white", "bg-accent-600", "hover:bg-accent-500", "focus:outline-accent-500"],
  muted: ["text-base-900", "bg-base-50", "hover:bg-base-100", "focus:outline-base-300"],
  none: [],
};

const sizes: Record<ButtonSize, string[]> = {
  xxs: ["h-7.5", "px-4", "py-2", "text-xs", "rounded-lg"],
  xs: ["h-8", "px-4", "py-3", "text-xs", "rounded-lg"],
  sm: ["h-9", "px-4", "py-3", "text-sm", "rounded-lg"],
  base: ["h-10", "px-5", "py-4", "text-sm", "rounded-lg"],
  md: ["h-11", "px-5", "py-4", "text-base", "rounded-lg"],
  lg: ["h-12", "px-5", "py-4", "text-lg", "rounded-lg"],
  xl: ["h-13", "px-5", "py-4", "text-lg", "rounded-xl"],
};

const iconSizes: Record<ButtonSize, string[]> = {
  xxs: ["size-7.5", "py-2", "text-xs", "rounded-lg"],
  xs: ["size-8", "text-xs", "rounded-lg"],
  sm: ["size-9", "text-sm", "rounded-lg"],
  base: ["size-10", "text-sm", "rounded-lg"],
  md: ["size-11", "text-base", "rounded-lg"],
  lg: ["size-12", "text-lg", "rounded-lg"],
  xl: ["size-13", "text-lg", "rounded-xl"],
};

const gapMap: Record<ButtonGap, string[]> = {
  xs: ["gap-2"],
  sm: ["gap-4"],
  base: ["gap-8"],
  md: ["gap-10"],
  lg: ["gap-12"],
};

const baseClass = [
  "flex",
  "justify-center",
  "text-center",
  "font-medium",
  "items-center",
  "duration-500",
  "ease-in-out",
  "transition-colors",
  "focus:outline-2",
  "focus:outline-offset-2",
];

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  gap?: ButtonGap;
  /** Renders only the `icon` slot, with square sizing. */
  iconOnly?: boolean;
  icon?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

type ButtonAsLink = CommonProps & {
  isLink: true;
  href: string;
  title?: string;
  target?: string;
  rel?: string;
  "aria-label"?: string;
};

type ButtonAsButton = CommonProps & {
  isLink?: false;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export type ButtonProps = ButtonAsLink | ButtonAsButton;

function classesFor({
  variant = "default",
  size = "base",
  gap,
  iconOnly = false,
  className = "",
}: CommonProps) {
  return [
    ...baseClass,
    ...(variantClass[variant] ?? []),
    ...(iconOnly ? iconSizes[size] : sizes[size]),
    ...(!iconOnly && gap ? gapMap[gap] : []),
    ...(className ? className.split(" ") : []),
  ]
    .filter(Boolean)
    .join(" ");
}

export default function Button(props: ButtonProps) {
  const {
    variant = "default",
    size = "base",
    gap,
    iconOnly = false,
    icon,
    leftIcon,
    rightIcon,
    className = "",
    children,
  } = props;

  const classes = classesFor({ variant, size, gap, iconOnly, className });

  const content = iconOnly ? (
    icon
  ) : (
    <>
      {leftIcon}
      {children}
      {rightIcon}
    </>
  );

  if (props.isLink) {
    const { isLink: _isLink, href, ...rest } = props as ButtonAsLink;
    void _isLink;
    const linkProps = strip(rest);

    if (href.startsWith("/") || href.startsWith("#")) {
      return (
        <Link href={href} className={classes} {...linkProps}>
          {content}
        </Link>
      );
    }

    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer" {...linkProps}>
        {content}
      </a>
    );
  }

  const buttonProps = strip(props as ButtonAsButton);

  return (
    <button className={classes} {...buttonProps}>
      {content}
    </button>
  );
}

/** Drop the styling props so they never leak onto the DOM node. */
function strip<T extends Record<string, unknown>>(props: T) {
  const {
    variant,
    size,
    gap,
    iconOnly,
    icon,
    leftIcon,
    rightIcon,
    className,
    children,
    isLink,
    ...rest
  } = props;
  void [variant, size, gap, iconOnly, icon, leftIcon, rightIcon, className, children, isLink];
  return rest;
}
