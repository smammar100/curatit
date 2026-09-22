import type { ReactNode } from "react";

export type WrapperVariant = "narrow" | "standard" | "prose";

const variantClasses: Record<WrapperVariant, string> = {
  // Wrappers for standard sections
  standard: "mx-auto px-8 max-w-7xl 2xl:max-w-[110rem]",
  // Wrapper for narrow sections
  narrow: "mx-auto px-8 max-w-xl",
  // Wrappers for prose sections
  prose:
    "prose text-base-600 prose-headings:text-base-900 prose-pre:border-0 prose-blockquote:text-accent-600 prose-a:text-accent-600 prose-a:hover:text-accent-500 prose-a:duration-200 max-w-none prose-pre:text-sm prose-strong:text-base-900 prose-pre:rounded-2xl",
};

export default function Wrapper({
  variant = "standard",
  className = "",
  children,
}: {
  variant?: WrapperVariant;
  className?: string;
  children?: ReactNode;
}) {
  return <div className={`${variantClasses[variant]} ${className}`.trim()}>{children}</div>;
}
