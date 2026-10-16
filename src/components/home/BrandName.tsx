"use client";

import Image from "next/image";
import type { LibraryPost } from "@/lib/posts";
import { cx } from "@/lib/cx";
import { useMounted } from "@/lib/useMounted";

const logoClass =
  "size-4 shrink-0 rounded-sm outline-1 -outline-offset-1 outline-edge";

// A brand's name with its logo in front, for post captions. The logo is decorative
// (the name is right beside it), so it has no alt text.
//
// The logo is requested only after mount (useMounted), like PostCover's covers: in the server
// HTML it's an empty square of the same size. On the homepage the demos' logos sit in sections
// near the fold, and the browser was fetching them during the first layout, before the headline
// had painted (2026-10-16). Where BrandName renders only in the browser (the dashboard), it's
// mounted from the start and nothing changes.
export default function BrandName({
  brand,
  className,
}: {
  brand: Pick<LibraryPost["brand"], "name" | "logo">;
  className?: string;
}) {
  const mounted = useMounted();
  return (
    <p
      className={cx(
        "flex min-w-0 items-center gap-1.5 text-caption-lg font-medium text-primary-foreground",
        className,
      )}
    >
      {brand.logo &&
        (mounted ? (
          <Image
            src={brand.logo}
            alt=""
            width={16}
            height={16}
            className={logoClass}
          />
        ) : (
          <span aria-hidden="true" className={logoClass} />
        ))}
      <span className="truncate">{brand.name}</span>
    </p>
  );
}
