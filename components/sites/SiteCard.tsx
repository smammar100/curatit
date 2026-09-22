import Image from "next/image";
import Link from "next/link";
import Text from "@/components/fundations/elements/Text";
import type { Entry } from "@/lib/content";

export default function SiteCard({ post }: { post: Entry<"sites"> }) {
  const url = `/sites/site/${post.id}`;

  return (
    <div className="group-hover:opacity-30 hover:opacity-100 peer hover:peer-hover:opacity-30 duration-300 group">
      <div className="relative p-8 bg-base-50 rounded-lg">
        <Image
          width={900}
          height={900}
          src={post.data.thumbnail.url}
          alt={post.data.thumbnail.alt}
          className="object-cover aspect-8/5 w-full object-top rounded shadow"
        />
        <Link href={url} title={post.data.title}>
          <span className="absolute inset-0" />
        </Link>
      </div>
      <div className="flex items-center mt-2 gap-2">
        <Text tag="h3" variant="textSM" className="text-base-600 capitalize">
          {post.data.title}
        </Text>
      </div>
    </div>
  );
}
