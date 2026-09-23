import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The top of every site screen: a serif title, an optional one-line
 * description, and actions on the right. Sits under the fixed 56px header.
 */
export default function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** A small line above the title, e.g. a back link or a count. */
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pt-24 pb-8 sm:pt-28", className)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <div className="mb-3 text-[13px] text-muted-foreground">{eyebrow}</div>}
        <h1 className="heading-display text-balance break-words text-foreground">{title}</h1>
        {description && <p className="mt-2 text-[14px] leading-5 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
