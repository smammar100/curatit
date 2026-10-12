// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Content
import type { CollectionEntry } from "@/lib/content";

export default function LegalLayout({
  frontmatter,
  html,
}: {
  frontmatter: CollectionEntry<"legal">["data"];
  html: string;
}) {
  return (
    <section>
      <Wrapper variant="standard" className="py-24 lg:pt-48">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="text-balance lg:w-1/3">
            <Text tag="h1" variant="displayLG" className="font-display font-light text-base-900">
              {frontmatter.page}
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4">
              Last upadated on {frontmatter.pubDate.toString().slice(0, 10)}
            </Text>
          </div>
          <div className="lg:w-1/2">
            <Wrapper variant="prose" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </Wrapper>
    </section>
  );
}
