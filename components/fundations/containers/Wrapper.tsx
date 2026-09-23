import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type WrapperVariant = "narrow" | "standard" | "prose";

const variantClasses: Record<WrapperVariant, string> = {
  // Page width: one column of content, 24px gutters.
  standard: "mx-auto w-full max-w-6xl px-6",
  // Forms and auth.
  narrow: "mx-auto w-full max-w-sm px-6",
  // Long-form markdown (journal posts, legal). Headings in the serif, 14px body.
  prose: cn(
    "prose max-w-none text-[14px] leading-6 text-muted-foreground",
    "prose-headings:font-serif prose-headings:font-normal prose-headings:tracking-[-0.01em] prose-headings:text-foreground",
    "prose-strong:text-foreground prose-strong:font-[550]",
    "prose-a:text-foreground prose-a:decoration-border prose-a:underline-offset-[3px] hover:prose-a:decoration-foreground",
    "prose-blockquote:border-border prose-blockquote:text-foreground prose-blockquote:font-normal",
    "prose-code:before:content-none prose-code:after:content-none",
    "prose-pre:rounded-xl prose-pre:bg-muted prose-pre:text-foreground prose-pre:text-[13px]",
    "prose-hr:border-border prose-th:text-foreground prose-td:border-border prose-li:marker:text-muted-foreground"
  ),
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
  return <div className={cn(variantClasses[variant], className)}>{children}</div>;
}
