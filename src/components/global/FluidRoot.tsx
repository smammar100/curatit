"use client";

// Fluid Functionalism's settings for the whole site (2026-10-23, the owner's choice on
// fluidfunctionalism.com's "Make them yours": pill corners, the compact size step, Phosphor icons,
// Radix): every component in src/components/ui reads its shape and size from these providers, so
// one control, menu or dialog can't drift from the rest. The icon set needs no provider, since
// src/lib/icon-context.tsx defaults to the site's own Phosphor icons.
//
// Not here: the library's MotionConfig. It imports motion/react, which the homepage keeps out of
// the hero's path (AGENTS.md, Performance); each molecule that animates wraps its own instead.
import type { ReactNode } from "react";
import { ShapeProvider } from "@/lib/shape-context";
import { SizeProvider } from "@/lib/size-context";

export default function FluidRoot({ children }: { children: ReactNode }) {
  return (
    <ShapeProvider defaultShape="pill">
      <SizeProvider defaultSize="compact">{children}</SizeProvider>
    </ShapeProvider>
  );
}
