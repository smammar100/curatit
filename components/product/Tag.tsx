import type { ReactNode } from "react";

export default function Tag({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" | "warning" }) {
  const tones = {
    muted: "bg-base-50 text-base-600 ring-base-200",
    accent: "bg-accent-50 text-accent-700 ring-accent-100",
    warning: "bg-amber-50 text-amber-800 ring-amber-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}
