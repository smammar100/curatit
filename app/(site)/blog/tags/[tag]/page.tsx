import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Wrapper from "@/components/fundations/containers/Wrapper";
import PageHeader from "@/components/fundations/containers/PageHeader";
import { BlogGrid } from "@/components/blog/BlogCard";
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
    <Wrapper variant="standard" className="pb-24">
      <PageHeader
        eyebrow={
          <Link
            href="/blog/tags"
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors duration-80 hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" size={14} strokeWidth={1.5} />
            All tags
          </Link>
        }
        title={`All journal posts about ${tag}`}
        description={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
      />
      <BlogGrid posts={posts.map(({ id, data }) => ({ id, data }))} />
    </Wrapper>
  );
}
