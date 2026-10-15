import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

// A Curatit product window, treated like the screenshots elsewhere on the site:
// white, rounded, with a shadow, sitting on a bg-base-50 mat.
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
        "@container overflow-hidden rounded bg-white shadow",
        className,
      )}
    >
      <div
        className="relative flex h-9 items-center gap-1.5 border-b border-base-100 px-4"
        aria-hidden="true"
      >
        <span className="size-2 rounded-full bg-base-200" />
        <span className="size-2 rounded-full bg-base-200" />
        <span className="size-2 rounded-full bg-base-200" />
        <p className="absolute inset-x-16 truncate text-center text-xs text-base-500">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}
