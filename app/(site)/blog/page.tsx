import type { Metadata } from "next";
import Link from "next/link";
import Wrapper from "@/components/fundations/containers/Wrapper";
import PageHeader from "@/components/fundations/containers/PageHeader";
import { Button } from "@/components/ui/button";
import { BlogGrid } from "@/components/blog/BlogCard";
import { getSortedPosts, uniqueTags } from "@/lib/content";

export const metadata: Metadata = {
  title: "Journal",
  description: "The latest trends in web development, design, and technology.",
};

export default async function BlogIndexPage() {
  const posts = await getSortedPosts();
  const sortedTags = uniqueTags(posts);

  return (
    <Wrapper variant="standard" className="pb-24">
      <PageHeader title="Journal" description="The latest trends in web development, design, and technology." />
      <nav aria-label="Tags" className="-mx-1 flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1">
        {sortedTags.map((tag) => (
          <Button key={tag} asChild size="compact" variant="tertiary" className="shrink-0 capitalize">
            <Link title={tag} aria-label={tag} href={`/blog/tags/${tag}`}>
              {tag}
            </Link>
          </Button>
        ))}
      </nav>
      <BlogGrid posts={posts.map(({ id, data }) => ({ id, data }))} className="mt-6" />
    </Wrapper>
  );
}
