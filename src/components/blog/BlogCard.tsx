// Assets
import Image from "next/image";
// Glaze
import { Card, CardContent, CardDescription, CardHeader, CardLink, CardTitle } from "@/components/glaze/ui/card";
// Content
import type { CollectionEntry } from "@/lib/content";

// Glaze's Card (2026-10-24): the image run to the panel's edge, the title under it opening the post
// through CardLink (one tab stop, the ring round the shell), the date and tags under the title.
// The cards beside the one under the pointer dim, as before
export default function BlogCard({ post }: { post: CollectionEntry<"posts"> }) {
  const url = "/blog/posts/" + post.id;
  const { title, tags, image } = post.data;
  const pubDate = post.data.pubDate.toString().slice(0, 10);
  return (
    <article className="peer transition-opacity duration-(--dur-state) ease-out group-hover:opacity-60 hover:opacity-100 hover:peer-hover:opacity-60">
      <Card>
        <CardContent flush>
          <Image
            width={500}
            height={500}
            src={image.url}
            alt={title}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="aspect-8/5 w-full bg-field object-cover object-top"
          />
        </CardContent>
        <CardHeader>
          <CardTitle className="text-balance">
            <h3>
              <CardLink href={url}>{title}</CardLink>
            </h3>
          </CardTitle>
          <CardDescription>
            <time dateTime={pubDate}>{pubDate}</time> · {tags.join(", ")}
          </CardDescription>
        </CardHeader>
      </Card>
    </article>
  );
}
