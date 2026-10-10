import Image from "next/image";
import type { LibraryPost } from "@/lib/posts";
import { cx } from "@/lib/cx";

// One image of a library post, cropped to Instagram's 4:5 portrait frame.
// `sizes` is the width the cover renders at, so Next serves a small file to a thumbnail.
export default function PostCover({
  post,
  slide = 0,
  sizes = "200px",
  priority,
  className,
}: {
  post: LibraryPost;
  slide?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cx("relative aspect-4/5 overflow-hidden bg-base-100 ring-1 ring-base-900/5 select-none", className)}>
      <Image
        src={post.images[slide] ?? post.images[0]}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        draggable={false}
        className="object-cover"
      />
    </div>
  );
}
