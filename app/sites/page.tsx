import type { Metadata } from "next";
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
import SiteCard from "@/components/sites/SiteCard";
import Search from "@/components/sites/Search";
import Button from "@/components/fundations/elements/Button";
import { getCollection, uniqueTags } from "@/lib/content";

export const metadata: Metadata = {
  title: "All sites",
  description: "Every production website in the Curatit directory.",
};

export default async function SitesIndexPage() {
  const sites = await getCollection("sites");
  const tags = uniqueTags(sites);

  return (
    <>
      <Search />
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div className="text-balance max-w-xl">
            <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-thin">
              All sites
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4">
              The full directory — production websites worth studying, end to end.
            </Text>
          </div>
          <div className="relative flex snap-x snap-proximity gap-1 py-2 overflow-x-scroll scrollbar-hide mt-12">
            {tags.map((tag) => (
              <Button
                key={tag}
                isLink
                size="xs"
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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mt-8">
            {sites.map((site) => (
              <SiteCard key={site.id} post={site} />
            ))}
          </div>
        </Wrapper>
      </section>
    </>
  );
}
