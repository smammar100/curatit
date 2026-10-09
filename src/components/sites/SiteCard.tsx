// Assets
import Image from "next/image";
import Link from "next/link";
// Fundations
import Text from "@/components/fundations/elements/Text";
// Content
import type { CollectionEntry } from "@/lib/content";

export default function SiteCard({ post }: { post: CollectionEntry<"sites"> }) {
  const url = "/sites/site/" + post.id;
  const { title, thumbnail } = post.data;
  return (
    <div className="group-hover:opacity-30 hover:opacity-100 peer hover:peer-hover:opacity-30 duration-300 group">
      <div className="relative p-8 bg-base-50 rounded-lg">
        <Image
          width={900}
          height={900}
          src={thumbnail.url}
          alt={thumbnail.alt}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover aspect-8/5 w-full object-top rounded shadow"
        />
        <Link href={url} title={title}>
          <span className="absolute inset-0"></span>
        </Link>
      </div>
      <div className="flex items-center mt-2 gap-2">
        <Text tag="h3" variant="textSM" className="text-base-600 capitalize">
          {title}
        </Text>
      </div>
    </div>
  );
}
