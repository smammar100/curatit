import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

const variantClasses = {
  default: "text-white bg-base-800 hover:bg-base-700 focus:outline-base-700",
  accent: "text-white bg-accent-600 hover:bg-accent-500 focus:outline-accent-500",
  muted: "text-base-900 bg-base-50 hover:bg-base-100 focus:outline-base-300",
  none: "",
};
// Size
const sizes = {
  xxs: "h-7.5 px-4 py-2 text-xs rounded-lg",
  xs: "h-8 px-4 py-3 text-xs rounded-lg",
  sm: "h-9 px-4 py-3 text-sm rounded-lg",
  base: "h-10 px-5 py-4 text-sm rounded-lg",
  md: "h-11 px-5 py-4 text-base rounded-lg",
  lg: "h-12 px-5 py-4 text-lg rounded-lg",
  xl: "h-13 px-5 py-4 text-lg rounded-xl",
};
// Icon size
const iconSizes = {
  xxs: "size-7.5 py-2 text-xs rounded-lg",
  xs: "size-8 text-xs rounded-lg",
  sm: "size-9 text-sm rounded-lg",
  base: "size-10 text-sm rounded-lg",
  md: "size-11 text-base rounded-lg",
  lg: "size-12 text-lg rounded-lg",
  xl: "size-13 text-lg rounded-xl",
};
// Gaps
const gaps = {
  xs: "gap-2",
  sm: "gap-4",
  base: "gap-8",
  md: "gap-10",
  lg: "gap-12",
};
const baseClass =
  "flex justify-center text-center font-medium items-center duration-500 ease-in-out transition-colors focus:outline-2 focus:outline-inset";

type CommonProps = {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizes;
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
    !iconOnly && gap && gaps[gap],
    className
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
