// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import BigCard from "@/components/sites/SiteCard";
import Search from "@/components/sites/Search";
// Content
import { getCollection } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  const allTools = getCollection("sites");
  const uniqueTags = [...new Set(allTools.flatMap((post) => post.data.tags || []))];
  return uniqueTags.map((tag) => ({ tag }));
}

export default async function SitesTagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const alltools = getCollection("sites");
  // Collect all unique tags
  const allTags = [...new Set(alltools.flatMap((post) => post.data.tags || []))];
  const sortedTags = allTags.sort((a, b) => a.localeCompare(b));
  return (
    <>
      <Search />
      <section>
        <Wrapper variant="standard" className="page-start">
          <Text tag="h1" variant="h1" className="text-primary-foreground text-center max-w-xl mx-auto text-balance"
          >
            Explore all sites related to {tag}
          </Text>
          <div className="flex items-center gap-1 mt-24">
            <div className="relative flex snap-x snap-proximity gap-1 py-2 px-2 overflow-x-scroll scrollbar-hide">
              {sortedTags.map((tag) => (
                <Button
                  key={tag}
                  isLink
                  size="sm"
                  variant="muted"
                  title={tag}
                  aria-label={tag}
                  href={`/sites/tags/${tag}`}
                  className="capitalize"
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mt-2">
            {alltools
              .filter((post) => post.data.tags?.includes(tag)) // Filter by the selected tag
              .map((filteredPost) => (
                <BigCard key={filteredPost.id} post={filteredPost} />
              ))}
          </div>
        </Wrapper>
      </section>
    </>
  );
}
