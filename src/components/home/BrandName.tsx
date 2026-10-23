"use client";

import Image from "next/image";
import type { LibraryPost } from "@/lib/posts";
import { cx } from "@/lib/cx";
import { fontWeights } from "@/lib/font-weight";
import { useMounted } from "@/lib/useMounted";

// The mark: a 4px corner (the small corner the system keeps for images inside text) and the
// one stroke drawn inside it (2026-10-23)
const logoClass =
  "size-4 shrink-0 rounded-[4px] outline-1 -outline-offset-1 outline-border";

// A brand's name with its logo in front, for post captions. The logo is decorative
// (the name is right beside it), so it has no alt text. The name is set in the library's
// semibold through fontVariationSettings (2026-10-23), never a font-* class.
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
        "flex min-w-0 items-center gap-1.5 text-caption-lg text-foreground",
        className,
      )}
      style={{ fontVariationSettings: fontWeights.semibold }}
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
