import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

// A Curatit product window, treated like the screenshots elsewhere on the site: the page's
// colour (what the app inside is drawn on), rounded, with the default shadow, sitting on a
// bg-card mat.
export default function AppWindow({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "@container overflow-hidden rounded bg-page shadow",
        className,
      )}
    >
      <div
        className="relative flex h-9 items-center gap-1.5 border-b border-border-default px-4"
        aria-hidden="true"
      >
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="size-2 rounded-full bg-border-strong" />
        <p className="absolute inset-x-16 truncate text-center text-caption text-secondary-foreground">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}
