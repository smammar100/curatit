import type { ReactNode } from "react";

/**
 * A Curatit app window: quiet chrome, layered shadow, real-size UI inside.
 * Border and shadow are the only depth cues (no gradient, no glow).
 */
export default function AppWindow({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-xl bg-surface shadow-window ring-1 ring-line ${className}`}>
      <div className="relative flex h-9 items-center border-b border-line px-3.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-base-200" />
          <span className="size-2.5 rounded-full bg-base-200" />
          <span className="size-2.5 rounded-full bg-base-200" />
        </div>
        <p className="absolute inset-x-16 truncate text-center text-[11px] font-medium text-ink-subtle">{title}</p>
      </div>
      {children}
    </div>
  );
}
