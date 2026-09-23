"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { useFluidHover } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
import type { NavLink } from "./links";

const NavContext = createContext<{
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
} | null>(null);

/** True when `pathname` is `href` or a page under it. */
export function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The header's link strip: one highlight glides along the x axis to the link
 * nearest the cursor, and the current page's label is semibold without
 * shifting its neighbours.
 */
export default function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname() ?? "/";
  const navRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(navRef, { axis: "x" });
  const shape = useShape();
  const { handlers, registerItem, activeIndex } = hover;

  return (
    <NavContext.Provider value={{ registerItem, activeIndex }}>
      <div
        ref={navRef}
        className="relative flex items-center"
        onMouseEnter={handlers.onMouseEnter}
        onMouseMove={handlers.onMouseMove}
        onMouseLeave={handlers.onMouseLeave}
        onClick={handlers.onClick}
      >
        <FluidHoverHighlight hover={hover} className={shape.bg} />
        {links.map((link, index) => (
          <NavItem key={link.href} index={index} link={link} current={isCurrent(pathname, link.href)} />
        ))}
      </div>
    </NavContext.Provider>
  );
}

function NavItem({ link, index, current }: { link: NavLink; index: number; current: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const ctx = useContext(NavContext);
  const shape = useShape();
  const register = ctx?.registerItem;

  useEffect(() => {
    register?.(index, ref.current);
    return () => register?.(index, null);
  }, [register, index]);

  const lit = current || ctx?.activeIndex === index;

  return (
    <Link
      ref={ref}
      href={link.href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "relative z-10 flex h-8 items-center px-3 text-[13px] outline-none",
        "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
        shape.item
      )}
    >
      <span className="inline-grid">
        <span
          aria-hidden="true"
          className="invisible col-start-1 row-start-1"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          {link.text}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80",
            lit ? "text-foreground" : "text-muted-foreground"
          )}
          style={{ fontVariationSettings: current ? fontWeights.semibold : fontWeights.normal }}
        >
          {link.text}
        </span>
      </span>
    </Link>
  );
}
