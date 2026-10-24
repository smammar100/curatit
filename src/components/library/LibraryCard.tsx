// Assets
import Image from "next/image";
// Glaze
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardLink, CardMeta, CardTitle } from "@/components/glaze/ui/card";
// Content
import type { LibraryPost } from "@/lib/library";

const formats = { static: "Static", carousel: "Carousel" };

// One post on the /library page, as Glaze's Card (2026-10-24): the cover run to the panel's edge,
// then the brand with its handle and the caption, and the date, format and counts in the footer on
// the shell (the date and format were a label above the brand; Glaze puts none above a title). The
// whole card opens the post on Instagram through CardLink in the title: one tab stop, the ring
// round the shell.
export default function LibraryCard({ post }: { post: LibraryPost }) {
  const date = post.postedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const firstLine = post.caption.split("\n")[0];

  return (
    <Card>
      <CardContent flush>
        {post.hasImage ? (
          <Image
            src={post.image}
            width={post.width}
            height={post.height}
            alt={`${post.brand} ${formats[post.format].toLowerCase()} post: ${firstLine}`}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="aspect-4/5 w-full bg-field object-cover object-top"
          />
        ) : (
          <div className="flex aspect-4/5 w-full flex-col items-center justify-center bg-field p-6 text-center">
            <p className="type-label text-text-1">{post.brand}</p>
            <p className="mt-1 type-caption text-text-2">Image not available</p>
          </div>
        )}
      </CardContent>
      <CardHeader>
        <CardTitle>
          <h3>
            <CardLink href={post.url} target="_blank" rel="noopener noreferrer">
              {post.brand}
              <span className="sr-only">: open this post on Instagram (opens in a new tab)</span>
            </CardLink>{" "}
            <span className="font-normal text-text-2">@{post.handle}</span>
          </h3>
        </CardTitle>
        <CardDescription className="line-clamp-2">{post.caption}</CardDescription>
      </CardHeader>
      <CardFooter>
        <CardMeta>
          <time dateTime={post.postedAt.toISOString()}>{date}</time> · {formats[post.format]} · {post.likes.toLocaleString("en-US")} likes ·{" "}
          {post.comments.toLocaleString("en-US")} comments
        </CardMeta>
      </CardFooter>
    </Card>
  );
}
