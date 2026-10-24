// Assets
import Image from "next/image";
// Glaze
import { Card, CardContent, CardHeader, CardLink, CardTitle } from "@/components/glaze/ui/card";
// Content
import type { CollectionEntry } from "@/lib/content";

// Glaze's Card (2026-10-24): the thumbnail run to the panel's edge, the title under it opening the
// site's page through CardLink (one tab stop, the ring round the shell)
export default function SiteCard({ post }: { post: CollectionEntry<"sites"> }) {
  const url = "/sites/site/" + post.id;
  const { title, thumbnail } = post.data;
  return (
    <div className="peer transition-opacity duration-(--dur-state) ease-out group-hover:opacity-60 hover:opacity-100 hover:peer-hover:opacity-60">
      <Card>
        <CardContent flush>
          <Image
            width={900}
            height={900}
            src={thumbnail.url}
            alt={thumbnail.alt}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="aspect-8/5 w-full bg-field object-cover object-top"
          />
        </CardContent>
        <CardHeader>
          <CardTitle className="capitalize">
            <h3>
              <CardLink href={url}>{title}</CardLink>
            </h3>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
