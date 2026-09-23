"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { ShapeProvider } from "@/lib/shape-context";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * App root for the design system: reduced motion follows the OS (transforms
 * drop, fades stay), rounded shape, and one tooltip delay group.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ShapeProvider defaultShape="rounded">
        <TooltipProvider>{children}</TooltipProvider>
      </ShapeProvider>
    </MotionConfig>
  );
}
