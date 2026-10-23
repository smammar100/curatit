// Assets
import Image from "next/image";
// Fundation
import Text from "@/components/fundations/elements/Text";
// Content
import type { LibraryPost } from "@/lib/library";

const formats = { static: "Static", carousel: "Carousel" };

export default function LibraryCard({ post }: { post: LibraryPost }) {
  const date = post.postedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const firstLine = post.caption.split("\n")[0];

  return (
    <article className="relative">
      <div className="p-8 bg-card rounded-lg">
        {post.hasImage ? (
          <Image
            src={post.image}
            width={post.width}
            height={post.height}
            alt={`${post.brand} ${formats[post.format].toLowerCase()} post: ${firstLine}`}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="aspect-4/5 w-full object-cover object-top rounded shadow"
          />
        ) : (
          <div className="flex aspect-4/5 w-full flex-col items-center justify-center rounded bg-component p-6 text-center">
            <Text variant="bodySM" className="font-medium text-primary-foreground">
              {post.brand}
            </Text>
            <Text variant="captionLG" className="mt-1 text-secondary-foreground">
              Image not available
            </Text>
          </div>
        )}
      </div>
      <div className="mt-4">
        <Text tag="p" variant="captionLG" className="text-secondary-foreground uppercase tracking-wider font-medium flex items-center gap-2">
          <time dateTime={post.postedAt.toISOString()}>{date}</time>
          <span aria-hidden="true">·</span>
          <span>{formats[post.format]}</span>
        </Text>
        <Text tag="h3" variant="bodySM" className="text-primary-foreground font-medium mt-2">
          {post.brand} <span className="font-normal text-secondary-foreground">@{post.handle}</span>
        </Text>
        <Text tag="p" variant="bodySM" className="text-secondary-foreground mt-1 line-clamp-2">
          {post.caption}
        </Text>
        <Text tag="p" variant="captionLG" className="text-secondary-foreground mt-2">
          {post.likes.toLocaleString("en-US")} likes · {post.comments.toLocaleString("en-US")} comments
        </Text>
      </div>
      {/* Stretched link to the original post */}
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-border-focus"
      >
        <span className="sr-only">
          Open this {post.brand} post on Instagram (opens in a new tab)
        </span>
      </a>
    </article>
  );
}
