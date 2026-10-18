// Assets
import Image from "next/image";
// Fundation
import Card, { CardMedia, CardTitle } from "@/components/fundations/molecules/Card";
// Content
import type { CollectionEntry } from "@/lib/content";

// The words sit under the mat, so the article holds the title's stretched link
export default function StoreCard({ post }: { post: CollectionEntry<"store"> }) {
  const url = "/store/" + post.id;
  const { title, price, image } = post.data;
  return (
    <article className="relative isolate group-hover:opacity-60 hover:opacity-100 peer hover:peer-hover:opacity-60 transition-opacity duration-150 ease-out-quint">
      <Card>
        <CardMedia>
          <Image
            width={500}
            height={500}
            src={image.url}
            alt={image.alt}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-top"
          />
        </CardMedia>
      </Card>
      <CardTitle href={url} className="mt-2">
        <span>${price}</span>
        —
        <span>{title}</span>
      </CardTitle>
    </article>
  );
}
