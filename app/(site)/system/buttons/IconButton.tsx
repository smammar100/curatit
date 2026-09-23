"use client";

import { ArrowRight, ArrowUpRight, Bookmark, Download, Plus, Share } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

// Icon components can't cross the server/client boundary as props, so the
// styleguide names them and this client shim resolves the component.
const icons = { arrowRight: ArrowRight, arrowUpRight: ArrowUpRight, bookmark: Bookmark, download: Download, plus: Plus, share: Share };

export type IconName = keyof typeof icons;

export default function IconButton({
  leading,
  trailing,
  ...props
}: Omit<ButtonProps, "leadingIcon" | "trailingIcon"> & { leading?: IconName; trailing?: IconName }) {
  return (
    <Button
      {...props}
      leadingIcon={leading ? icons[leading] : undefined}
      trailingIcon={trailing ? icons[trailing] : undefined}
    />
  );
}
