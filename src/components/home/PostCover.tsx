"use client";

import Image from "next/image";
import type { LibraryPost } from "@/lib/posts";
import { cx } from "@/lib/cx";
import { useMounted } from "@/lib/useMounted";

// One image of a library post, cropped to Instagram's 4:5 portrait frame.
// `sizes` is the width the cover renders at, so Next serves a small file to a thumbnail.
//
// The file is requested only after the cover has mounted in the browser (useMounted): on the
// server it renders as the blank frame alone. Every cover on the homepage sits below the hero,
// inside a section that hydrates when it scrolls into view, so this keeps the dozens of covers
// in the demos out of the bytes the first paint waits for (2026-10-16, Lighthouse mobile).
//
// The frame is the muted tile with the one stroke inside it (2026-10-23); its corner is the
// caller's, so a cover takes the radius of whatever it sits in.
export default function PostCover({
  post,
  slide = 0,
  sizes = "200px",
  priority,
  className,
}: {
  post: Pick<LibraryPost, "images">;
  slide?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const mounted = useMounted();
  return (
    <div
      aria-hidden="true"
      className={cx(
        "relative aspect-4/5 overflow-hidden bg-muted ring-1 ring-border select-none",
        className,
      )}
    >
      {mounted && (
        <Image
          src={post.images[slide] ?? post.images[0]}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          draggable={false}
          className="object-cover"
        />
      )}
    </div>
  );
}
