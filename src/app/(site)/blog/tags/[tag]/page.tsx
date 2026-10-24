// Fundation
import BlogCard from "@/components/blog/BlogCard";
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Content
import { getCollection } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  const allPosts = getCollection("posts");
  const uniqueTags = [...new Set(allPosts.map((post) => post.data.tags).flat())];
  return uniqueTags.map((tag) => ({ tag }));
}

export default async function BlogTagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const posts = getCollection("posts").filter((post) => post.data.tags.includes(tag));
  return (
    <section className="relative overflow-hidden">
      <Wrapper variant="standard" className="page-start">
        <Text tag="h1" variant="h1" className="text-text-1">
          All blog posts about {tag}
        </Text>
        <div className="grid grid-cols-1 gap-px gap-y-12 md:grid-cols-2 lg:grid-cols-3 group mt-8">
          {posts.slice(0, 3).map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
