import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

// A Curatit product window, treated like the screenshots elsewhere on the site: a white card
// from the surface ladder (bg-surface-3 with its shadow, the system's raised card since
// 2026-10-23) with the container corners, sitting on a bg-card mat. The title bar is one
// hairline (--border) and three dots of the same stroke.
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
        "@container overflow-hidden rounded-[24px] bg-surface-3 shadow-surface-2",
        className,
      )}
    >
      <div
        className="relative flex h-9 items-center gap-1.5 border-b border-border px-4"
        aria-hidden="true"
      >
        <span className="size-2 rounded-full bg-border" />
        <span className="size-2 rounded-full bg-border" />
        <span className="size-2 rounded-full bg-border" />
        <p className="absolute inset-x-16 truncate text-center text-caption text-muted-foreground">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}
