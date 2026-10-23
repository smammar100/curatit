// Assets
import Image from "next/image";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Card, { CardDescription, CardMedia, CardMeta, CardTitle } from "@/components/fundations/molecules/Card";
// Content
import type { LibraryPost } from "@/lib/library";
import { fontWeights } from "@/lib/font-weight";

const formats = { static: "Static", carousel: "Carousel" };

// One post on the /library page: the cover on the system's grey Card (the container corner,
// the media cut to the corner the padding implies), then the date and format, the brand with
// its handle, the caption and the counts in the Card's own parts (2026-10-23). The whole card
// opens the post on Instagram through one stretched link with the one focus ring; CardTitle's
// own link is for internal pages, so the external one stays an <a>.
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
      <Card variant="mat" padding="lg">
        {post.hasImage ? (
          <CardMedia aspect="4/5">
            <Image
              src={post.image}
              width={post.width}
              height={post.height}
              alt={`${post.brand} ${formats[post.format].toLowerCase()} post: ${firstLine}`}
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-top"
            />
          </CardMedia>
        ) : (
          <div className="flex aspect-4/5 w-full flex-col items-center justify-center rounded-[var(--card-media-radius,4px)] bg-muted p-6 text-center shadow-surface-1">
            <Text variant="bodySM" className="text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
              {post.brand}
            </Text>
            <Text variant="captionLG" className="mt-1 text-muted-foreground">
              Image not available
            </Text>
          </div>
        )}
      </Card>
      <div className="mt-4">
        <CardMeta className="flex items-center gap-2">
          <time dateTime={post.postedAt.toISOString()}>{date}</time>
          <span aria-hidden="true">·</span>
          <span>{formats[post.format]}</span>
        </CardMeta>
        <CardTitle className="mt-2">
          {post.brand}{" "}
          <span className="text-muted-foreground" style={{ fontVariationSettings: fontWeights.normal }}>
            @{post.handle}
          </span>
        </CardTitle>
        <CardDescription className="mt-1 line-clamp-2">{post.caption}</CardDescription>
        <CardMeta className="mt-2">
          {post.likes.toLocaleString("en-US")} likes · {post.comments.toLocaleString("en-US")} comments
        </CardMeta>
      </div>
      {/* Stretched link to the original post */}
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-30 rounded-[24px] focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--focus-ring)]"
      >
        <span className="sr-only">
          Open this {post.brand} post on Instagram (opens in a new tab)
        </span>
      </a>
    </article>
  );
}
