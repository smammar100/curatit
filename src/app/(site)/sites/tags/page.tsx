import Link from "next/link";
// Fundation
import Text from "@/components/fundations/elements/Text";
import { Button } from "@/components/glaze/ui/button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import Search from "@/components/sites/Search";
// Content
import { getCollection } from "@/lib/content";

export default function SitesTagsPage() {
  const allTools = getCollection("sites");
  // Collect all unique tags
  const tags = [...new Set(allTools.flatMap((post) => post.data.tags || []))];
  return (
    <>
      <Search />
      <section>
        <Wrapper variant="narrow" className="page-start">
          <Text tag="h1" variant="h1" className="text-text-1 text-center">
            We got tags!
          </Text>

          <ul role="list" className="flex flex-col gap-1 mt-12">
            {tags.map((tag) => (
              <Button key={tag} size="sm" variant="secondary" title={tag} aria-label={tag} render={<Link href={`/sites/tags/${tag}`} />} nativeButton={false}>
                {tag}
              </Button>
            ))}
          </ul>
        </Wrapper>
      </section>
    </>
  );
}
