import Image from "next/image";
import Link from "next/link";
import Text from "@/components/fundations/elements/Text";
import type { Entry } from "@/lib/content";

export default function StoreCard({ post }: { post: Entry<"store"> }) {
  const url = `/store/${post.id}`;

  return (
    <article className="group-hover:opacity-30 hover:opacity-100 peer hover:peer-hover:opacity-30 duration-300 relative">
      <Link href={url} title={post.data.title} className="absolute inset-0 z-10" />
      <div className="p-8 bg-base-50 rounded-lg">
        <Image
          width={500}
          height={500}
          src={post.data.image.url}
          alt={post.data.image.alt}
          className="object-cover aspect-8/5 w-full object-top rounded shadow"
        />
      </div>
      <div className="pt-2">
        <Text tag="h3" variant="textSM" className="text-base-600">
          <span>${post.data.price}</span> — <span>{post.data.title}</span>
        </Text>
      </div>
    </article>
  );
}
