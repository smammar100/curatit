import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

// A Curatit product window, treated like the screenshots elsewhere on the site: a card lifted off
// its grey mat on Fluid Functionalism's surface ladder (bg-surface-3 with its shadow; surfaces stay
// FF's under Glaze), with the card's shell corner. The title bar is one faint hairline with the
// title centred in the caption role (since 2026-10-24 on Glaze, which has no traffic-light dots).
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
    <div className={cx("@container overflow-hidden rounded-shell bg-surface-3 shadow-surface-2", className)}>
      <div className="flex h-9 items-center justify-center border-b border-line-faint px-4" aria-hidden="true">
        <p className="truncate type-caption text-text-2">{title}</p>
      </div>
      {children}
    </div>
  );
}
