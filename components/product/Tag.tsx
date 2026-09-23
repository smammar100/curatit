import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

/**
 * A state label, always in words. `accent` is the saved/brand state,
 * `warning` is waiting on review, `muted` is neutral.
 */
export default function Tag({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" | "warning" }) {
  if (tone === "accent") {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-soft px-2.5 text-[12px] text-brand-text">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
        {children}
      </span>
    );
  }
  return (
    <Badge variant="dot" color={tone === "warning" ? "amber" : "gray"}>
      {children}
    </Badge>
  );
}
