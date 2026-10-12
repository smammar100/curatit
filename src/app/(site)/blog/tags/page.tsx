// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Content
import { getCollection } from "@/lib/content";

export default function BlogTagsPage() {
  const allPosts = getCollection("posts");
  // Collect all unique tags
  const tags = [...new Set(allPosts.map((post) => post.data.tags).flat())];
  return (
    <section>
      <Wrapper variant="narrow" className="py-24 lg:pt-48">
        <Text tag="h1" variant="displayLG" className="font-display font-light text-base-900 text-center">
          Explore all tags
        </Text>
        <ul role="list" className="flex flex-col gap-1 mt-12">
          {tags.map((tag) => (
            <Button
              key={tag}
              isLink
              size="sm"
              variant="muted"
              title={tag}
              aria-label={tag}
              href={`/blog/tags/${tag}`}
              className="capitalize"
            >
              {tag}
            </Button>
          ))}
        </ul>
      </Wrapper>
    </section>
  );
}
