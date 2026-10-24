import Link from "next/link";
// Fundation
import Text from "@/components/fundations/elements/Text";
import { Button } from "@/components/glaze/ui/button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Content
import { getCollection } from "@/lib/content";

export default function BlogTagsPage() {
  const allPosts = getCollection("posts");
  // Collect all unique tags
  const tags = [...new Set(allPosts.map((post) => post.data.tags).flat())];
  return (
    <section>
      <Wrapper variant="narrow" className="page-start">
        <Text tag="h1" variant="h1" className="text-text-1 text-center">
          Explore all tags
        </Text>
        <ul role="list" className="flex flex-col gap-1 mt-12">
          {tags.map((tag) => (
            <Button key={tag} size="sm" variant="secondary" title={tag} aria-label={tag} render={<Link href={`/blog/tags/${tag}`} />} nativeButton={false}>
              {tag}
            </Button>
          ))}
        </ul>
      </Wrapper>
    </section>
  );
}
