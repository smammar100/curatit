import Image from "next/image";
import type { LibraryPost } from "@/lib/posts";
import { cx } from "@/lib/cx";

// A brand's name with its logo in front, for post captions. The logo is decorative
// (the name is right beside it), so it has no alt text.
export default function BrandName({ brand, className }: { brand: LibraryPost["brand"]; className?: string }) {
  return (
    <p className={cx("flex min-w-0 items-center gap-1.5 text-xs font-medium text-base-900", className)}>
      {brand.logo && (
        <Image
          src={brand.logo}
          alt=""
          width={16}
          height={16}
          className="size-4 shrink-0 rounded-sm outline-1 -outline-offset-1 outline-edge"
        />
      )}
      <span className="truncate">{brand.name}</span>
    </p>
  );
}
