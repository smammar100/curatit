// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import BlogCard from "@/components/blog/BlogCard";
// Content
import { getCollection, sortByPubDate } from "@/lib/content";

export default function BlogPage() {
  // Newest to oldest
  const allPosts = sortByPubDate(getCollection("posts"));
  // Collect all unique tags
  const allTags = [...new Set(allPosts.flatMap((post) => post.data.tags || []))];
  const sortedTags = allTags.sort((a, b) => a.localeCompare(b));
  return (
    <section>
      <Wrapper variant="standard" className="page-start">
        <div className="text-balance max-w-xl">
          <Text tag="h1" variant="displayLG" className="font-display font-light text-base-900">
            Magazine
          </Text>
          <Text tag="p" variant="textBase" className="text-base-600 mt-4">
            You will find here the latest trends in the world of web development, design, and
            technology.
          </Text>
        </div>
        <div className="relative flex snap-x snap-proximity gap-1 py-2 px-2 overflow-x-scroll scrollbar-hide mt-12">
          {sortedTags.map((tag) => (
            <Button
              key={tag}
              isLink
              size="xs"
              title={tag}
              variant="muted"
              aria-label={tag}
              href={`/blog/tags/${tag}`}
              className="capitalize"
            >
              {tag}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {allPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
