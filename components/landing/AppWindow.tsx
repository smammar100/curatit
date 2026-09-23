import type { ReactNode } from "react";
import { Elevated } from "@/lib/elevated";
import { cn } from "@/lib/utils";

/**
 * A Curatit app window: real, working UI in quiet chrome. Two levels above
 * its substrate with a pinned shadow-6, so anything opened inside lifts on.
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
    <Elevated offset={2} shadowLevel={6} className={cn("overflow-hidden rounded-xl", className)}>
      <div className="flex h-10 items-center border-b border-border px-4">
        <p className="truncate text-[12px] text-muted-foreground">{title}</p>
      </div>
      {children}
    </Elevated>
  );
}
