import type { SVGProps } from "react";
import { cx } from "@/lib/cx";

// Search with a sparkle on its shoulder, for searches an AI assistant runs (after Mobbin's AI search
// mark). Drawn to match the Phosphor bold set: a 22-unit stroke on the 256 grid, round caps, the
// glass to the bottom left and a four-point sparkle filling the space above its handle.
export default function SearchSparkle({ className, ...rest }: Omit<SVGProps<SVGSVGElement>, "children">) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" className={cx("icon", className)} {...rest}>
      <circle cx="104" cy="140" r="66" stroke="currentColor" strokeWidth="22" />
      <path d="M152 188 L220 236" stroke="currentColor" strokeWidth="22" strokeLinecap="round" />
      <path d="M200 12 C206 42 214 50 244 56 C214 62 206 70 200 100 C194 70 186 62 156 56 C186 50 194 42 200 12 Z" fill="currentColor" />
    </svg>
  );
}
