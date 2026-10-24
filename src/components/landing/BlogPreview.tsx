import Link from "next/link";
// Fundation
import Text from "@/components/fundations/elements/Text";
import { Button } from "@/components/glaze/ui/button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import BlogCard from "@/components/blog/BlogCard";
// Content
import { getCollection } from "@/lib/content";

export default function BlogPreview() {
  const allPosts = getCollection("posts");
  return (
    <section>
      <Wrapper variant="standard" className="section-y">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <Text tag="h2" variant="h3" className="text-text-1">
            Latest articles
          </Text>
          <Button size="sm" variant="secondary" render={<Link href="/blog" />} nativeButton={false}>
            See all articles
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {allPosts.slice(0, 3).map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
