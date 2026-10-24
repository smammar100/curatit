// Assets
import Image from "next/image";
// Glaze
import { Card, CardContent, CardDescription, CardHeader, CardLink, CardTitle } from "@/components/glaze/ui/card";
// Content
import type { CollectionEntry } from "@/lib/content";

// Glaze's Card (2026-10-24): the image run to the panel's edge, the title under it opening the
// product through CardLink (one tab stop, the ring round the shell), the price under the title
// (it was joined to the title with an em dash, which Glaze keeps out of copy)
export default function StoreCard({ post }: { post: CollectionEntry<"store"> }) {
  const url = "/store/" + post.id;
  const { title, price, image } = post.data;
  return (
    <article className="peer transition-opacity duration-(--dur-state) ease-out group-hover:opacity-60 hover:opacity-100 hover:peer-hover:opacity-60">
      <Card>
        <CardContent flush>
          <Image
            width={500}
            height={500}
            src={image.url}
            alt={image.alt}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="aspect-8/5 w-full bg-field object-cover object-top"
          />
        </CardContent>
        <CardHeader>
          <CardTitle>
            <h3>
              <CardLink href={url}>{title}</CardLink>
            </h3>
          </CardTitle>
          <CardDescription className="data">${price}</CardDescription>
        </CardHeader>
      </Card>
    </article>
  );
}
