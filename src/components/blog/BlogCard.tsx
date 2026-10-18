// Assets
import Image from "next/image";
// Fundation
import Card, { CardMedia, CardMeta, CardTitle } from "@/components/fundations/molecules/Card";
// Content
import type { CollectionEntry } from "@/lib/content";

// The words sit under the mat, so the article holds the title's stretched link
export default function BlogCard({ post }: { post: CollectionEntry<"posts"> }) {
  const url = "/blog/posts/" + post.id;
  const { title, tags, image } = post.data;
  const pubDate = post.data.pubDate.toString().slice(0, 10);
  return (
    <article className="relative isolate group-hover:opacity-60 hover:opacity-100 peer hover:peer-hover:opacity-60 transition-opacity duration-150 ease-out-quint">
      <Card>
        <CardMedia>
          <Image
            width={500}
            height={500}
            src={image.url}
            alt={title}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-top"
          />
        </CardMedia>
      </Card>
      <CardMeta uppercase className="mt-4 font-medium flex items-center gap-2">
        <time dateTime={pubDate}>{pubDate}</time>
        <span aria-hidden="true" className="pointer-events-none">
          ·
        </span>
        <span>{tags}</span>
      </CardMeta>
      <CardTitle href={url} className="text-balance mt-2">
        {title}
      </CardTitle>
    </article>
  );
}
