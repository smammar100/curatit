// Assets
import Image from "next/image";
import Link from "next/link";
// Fundation
import Text from "@/components/fundations/elements/Text";
// Content
import type { CollectionEntry } from "@/lib/content";

export default function BlogCard({ post }: { post: CollectionEntry<"posts"> }) {
  const url = "/blog/posts/" + post.id;
  const { title, tags, image } = post.data;
  const pubDate = post.data.pubDate.toString().slice(0, 10);
  return (
    <article className="relative group-hover:opacity-60 hover:opacity-100 peer hover:peer-hover:opacity-60 transition-opacity duration-150 ease-out-quint">
      <Link href={url} title={title} className="absolute inset-0 z-10"></Link>
      <div className="p-8 bg-base-50 rounded-lg">
        <Image
          width={500}
          height={500}
          src={image.url}
          alt={title}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover aspect-8/5 w-full object-top rounded shadow"
        />
      </div>
      <div className="mt-4">
        <Text tag="p" variant="textXS" className="text-base-600 uppercase font-medium flex items-center gap-2">
          <time dateTime={pubDate}>{pubDate}</time>
          <span aria-hidden="true" className="pointer-events-none">
            ·
          </span>
          <span>{tags}</span>
        </Text>
        <Text tag="h3" variant="textSM" className="text-base-900 font-medium text-balance mt-2">
          {title}
        </Text>
      </div>
    </article>
  );
}
