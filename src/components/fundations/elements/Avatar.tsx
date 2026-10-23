"use client";

import { useEffect, useRef, useState, type HTMLAttributes, type Ref } from "react";
import { fontWeights } from "@/lib/font-weight";
import { cn } from "@/lib/utils";

// A person: their picture, or their initials when there's no picture or it fails to load.
// Use it wherever a person is shown (the account menu, a board's owner, a comment). A brand or
// a client app is not a person: its mark goes in a plain image with the edge line (BrandName,
// the consent screen's tiles). A placeholder while the session loads is a Skeleton circle.
//
// Client only for the fallback: an image that fails swaps to the initials, including one that
// failed before React hydrated (checked once mounted, since onError never fires for it). The
// picture is a plain <img>, not next/image, because avatar hosts (Google's, Supabase's) aren't
// in next.config's image list. `decorative` hides it from screen readers when the name is
// already written beside it, so it isn't read twice.

// Sizes: xs 20, sm 24, md 32 (the default: the dashboard's header), lg 44. The initials are a
// step of the type scale that leaves room for two letters in the circle
const sizes = {
  xs: "size-5 text-caption-sm",
  sm: "size-6 text-caption-base",
  md: "size-8 text-caption-lg",
  lg: "size-11 text-body-base",
} as const;
// The same sizes in pixels, for the image's width and height (no layout shift while it loads)
const pixels = { xs: 20, sm: 24, md: 32, lg: 44 } as const;

/** Up to two letters: the first of the first two words (an email's parts count as words) */
function initials(name: string) {
  return name
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]!.toLocaleUpperCase())
    .join("");
}

export type AvatarProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children" | "role" | "aria-label" | "aria-hidden"
> & {
  /** The picture. Missing, null or broken shows the initials */
  src?: string | null;
  /** The person's name: the image's alt text and the source of the initials */
  name: string;
  size?: keyof typeof sizes;
  /** Hidden from screen readers: only when the name is written right beside it */
  decorative?: boolean;
  ref?: Ref<HTMLSpanElement>;
};

export default function Avatar({
  src,
  name,
  size = "md",
  decorative = false,
  className,
  ref,
  ...rest
}: AvatarProps) {
  // The src that failed, so a new src gets its own try
  const [failed, setFailed] = useState<string | null>(null);
  const image = useRef<HTMLImageElement>(null);
  const showImage = Boolean(src) && failed !== src;

  // A server-rendered image that failed before hydration is complete with no pixels, and its
  // error event has already gone
  useEffect(() => {
    const img = image.current;
    if (src && img && img.complete && img.naturalWidth === 0) setFailed(src);
  }, [src]);

  return (
    <span
      {...rest}
      ref={ref}
      role={showImage || decorative ? undefined : "img"}
      aria-label={showImage || decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full select-none",
        sizes[size],
        showImage ? "bg-muted" : "bg-brand-subtle text-on-brand-subtle-foreground",
        className,
      )}
      style={showImage ? undefined : { fontVariationSettings: fontWeights.semibold }}
    >
      {showImage ? (
        <img
          ref={image}
          src={src!}
          alt={decorative ? "" : name}
          width={pixels[size]}
          height={pixels[size]}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(src!)}
          className="size-full rounded-full object-cover outline-1 -outline-offset-1 outline-border"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
