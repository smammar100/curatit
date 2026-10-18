// Assets
import Image from "next/image";
// Fundations
import Card, { CardMedia, CardTitle } from "@/components/fundations/molecules/Card";
// Content
import type { CollectionEntry } from "@/lib/content";

// The words sit under the mat, so the wrapper holds the title's stretched link
export default function SiteCard({ post }: { post: CollectionEntry<"sites"> }) {
  const url = "/sites/site/" + post.id;
  const { title, thumbnail } = post.data;
  return (
    <div className="relative isolate group-hover:opacity-60 hover:opacity-100 peer hover:peer-hover:opacity-60 transition-opacity duration-150 ease-out-quint group">
      <Card>
        <CardMedia>
          <Image
            width={900}
            height={900}
            src={thumbnail.url}
            alt={thumbnail.alt}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-top"
          />
        </CardMedia>
      </Card>
      <CardTitle href={url} className="mt-2 capitalize">
        {title}
      </CardTitle>
    </div>
  );
}
