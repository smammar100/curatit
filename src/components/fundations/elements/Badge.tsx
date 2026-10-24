import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { Badge as FluidBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// A badge, since 2026-10-23 Fluid Functionalism's (src/components/ui/badge.tsx) behind the site's
// own names: a short label for status, category or metadata, 24px tall on the default step (the
// site's setting since 2026-10-24; 20px on the compact step before), a pill, its text always the ink. The library's tinted look mixes 15% of a colour into
// the page, so one colour works in both themes; the brand and danger badges do that with
// Curatit's terracotta and red, and the rest are neutral: a tint of the ground, nothing, the ink
// inverted, or a hairline ring.
const variants: Record<string, { className?: string; style?: CSSProperties }> = {
  default: {},
  transparent: { style: { backgroundColor: "transparent" } },
  inverted: { style: { backgroundColor: "var(--foreground)", color: "var(--background)" } },
  outline: {
    className: "ring-1 ring-inset ring-border",
    style: { backgroundColor: "transparent" },
  },
  brand: {
    style: { backgroundColor: "color-mix(in srgb, var(--color-brand-solid) 15%, var(--background))" },
  },
  danger: {
    style: { backgroundColor: "color-mix(in srgb, var(--color-danger-solid) 15%, var(--background))" },
  },
};
// The site's three sizes on the library's two steps
const sizes = { sm: "default", md: "default", lg: "default" } as const;

export default function Badge({
  variant = "default",
  size = "md",
  shape: _shape,
  className,
  style,
  children,
  ...rest
}: Omit<HTMLAttributes<HTMLSpanElement>, "color"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** Accepted for older call sites; every badge is a pill (the site's shape setting) */
  shape?: "rounded" | "pill";
  children: ReactNode;
}) {
  const look = variants[variant];
  return (
    <FluidBadge
      size={sizes[size]}
      className={cn(look.className, className)}
      style={{ ...look.style, ...style }}
      {...rest}
    >
      {children}
    </FluidBadge>
  );
}
