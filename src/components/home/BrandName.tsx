"use client";

import Image from "next/image";
import type { LibraryPost } from "@/lib/posts";
import { cx } from "@/lib/cx";
import { useMounted } from "@/lib/useMounted";

// The mark: Glaze's tag corner and the faint hairline drawn inside it (2026-10-24)
const logoClass = "size-4 shrink-0 rounded-tag outline-1 -outline-offset-1 outline-line-faint";

// A brand's name with its logo in front, for post captions. The logo is decorative
// (the name is right beside it), so it has no alt text. The name is Glaze's small label role
// (12/16 at 550) in text-1 since 2026-10-24.
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
    <p className={cx("flex min-w-0 items-center gap-1.5 type-label-sm text-text-1", className)}>
      {brand.logo &&
        (mounted ? (
          <Image src={brand.logo} alt="" width={16} height={16} className={logoClass} />
        ) : (
          <span aria-hidden="true" className={logoClass} />
        ))}
      <span className="truncate">{brand.name}</span>
    </p>
  );
}
