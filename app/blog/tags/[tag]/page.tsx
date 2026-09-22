import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
import BlogCard from "@/components/blog/BlogCard";
import { getSortedPosts, uniqueTags } from "@/lib/content";

type Params = { tag: string };

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await getSortedPosts();
  return uniqueTags(posts).map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `Posts about ${decodeURIComponent(tag)}`,
  };
}

export default async function BlogTagPage({ params }: { params: Promise<Params> }) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);
  const posts = (await getSortedPosts()).filter((post) => post.data.tags.includes(tag));

  if (posts.length === 0) notFound();

  return (
    <section className="relative overflow-hidden">
      <Wrapper variant="standard" className="py-24 lg:pt-48">
        <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-thin">
          All blog posts about {tag}
        </Text>
        <div className="grid grid-cols-1 gap-px gap-y-12 md:grid-cols-2 lg:grid-cols-3 group mt-8">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
