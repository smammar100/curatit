// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Content
import type { CollectionEntry } from "@/lib/content";

// pubDate is a bare date, read as midnight UTC, so it's formatted in UTC: "28 October 2026"
const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function LegalLayout({
  frontmatter,
  html,
}: {
  frontmatter: CollectionEntry<"legal">["data"];
  html: string;
}) {
  return (
    <section>
      <Wrapper variant="standard" className="page-start">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="text-balance lg:w-1/3">
            <Text tag="h1" variant="h1" className="text-text-1">
              {frontmatter.page}
            </Text>
            <Text tag="p" variant="body" className="text-text-2 mt-4">
              Last updated{" "}
              <time dateTime={frontmatter.pubDate.toISOString().slice(0, 10)}>
                {longDate.format(frontmatter.pubDate)}
              </time>
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
