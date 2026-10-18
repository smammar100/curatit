// Assets
import Image from "next/image";
import Link from "next/link";
// Fundation
import Text from "@/components/fundations/elements/Text";
// Content
import type { CollectionEntry } from "@/lib/content";

export default function StoreCard({ post }: { post: CollectionEntry<"store"> }) {
  const url = "/store/" + post.id;
  const { title, price, image } = post.data;
  return (
    <article className="group-hover:opacity-60 hover:opacity-100 peer hover:peer-hover:opacity-60 transition-opacity duration-150 ease-out-quint relative">
      <Link href={url} title={title} className="absolute inset-0 z-10"></Link>
      <div className="p-8 bg-base-50 rounded-lg">
        <Image
          width={500}
          height={500}
          src={image.url}
          alt={image.alt}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover aspect-8/5 w-full object-top rounded shadow"
        />
      </div>
      <div className="pt-2">
        <Text tag="h3" variant="textSM" className="text-base-600">
          <span>${price}</span>
          —
          <span>{title}</span>
        </Text>
      </div>
    </article>
  );
}
