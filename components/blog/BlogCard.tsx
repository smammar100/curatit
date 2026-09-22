import Image from "next/image";
import Link from "next/link";
import Text from "@/components/fundations/elements/Text";
import { formatDate, type Entry } from "@/lib/content";

export default function BlogCard({ post }: { post: Entry<"posts"> }) {
  const url = `/blog/posts/${post.id}`;
  const pubDate = formatDate(post.data.pubDate);

  return (
    <article className="relative group-hover:opacity-30 hover:opacity-100 peer hover:peer-hover:opacity-30 duration-300">
      <Link href={url} title={post.data.title} className="absolute inset-0 z-10" />
      <div className="p-8 bg-base-50 rounded-lg">
        <Image
          width={500}
          height={500}
          src={post.data.image.url}
          alt={post.data.image.alt || post.data.title}
          loading="lazy"
          decoding="async"
          className="object-cover aspect-8/5 w-full object-top rounded shadow"
        />
      </div>
      <div className="mt-4">
        <Text
          tag="p"
          variant="textXS"
          className="text-base-600 uppercase font-medium flex items-center gap-2"
        >
          <time dateTime={pubDate}>{pubDate}</time>
          <span aria-hidden="true" className="pointer-events-none">
            ·
          </span>
          <span>{post.data.tags.join(", ")}</span>
        </Text>
        <Text tag="h3" variant="textSM" className="text-base-900 font-medium text-balance mt-2">
          {post.data.title}
        </Text>
      </div>
    </article>
  );
}
