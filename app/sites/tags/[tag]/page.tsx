import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import SiteCard from "@/components/sites/SiteCard";
import Search from "@/components/sites/Search";
import { getCollection, uniqueTags } from "@/lib/content";

type Params = { tag: string };

export async function generateStaticParams(): Promise<Params[]> {
  const sites = await getCollection("sites");
  return uniqueTags(sites).map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { tag } = await params;
  return { title: `Sites tagged ${decodeURIComponent(tag)}` };
}

export default async function SitesTagPage({ params }: { params: Promise<Params> }) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);

  const sites = await getCollection("sites");
  const sortedTags = uniqueTags(sites);
  const filtered = sites.filter((site) => site.data.tags?.includes(tag));

  if (filtered.length === 0) notFound();

  return (
    <>
      <Search />
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <Text
            tag="h1"
            variant="displayLG"
            className="text-base-900 font-display font-light text-center max-w-xl mx-auto text-balance"
          >
            Explore all sites related to {tag}
          </Text>
          <div className="flex items-center gap-1 mt-24">
            <div className="relative flex snap-x snap-proximity gap-1 py-2 px-2 overflow-x-scroll scrollbar-hide">
              {sortedTags.map((item) => (
                <Button
                  key={item}
                  isLink
                  size="sm"
                  variant="muted"
                  title={item}
                  aria-label={item}
                  href={`/sites/tags/${item}`}
                  className="capitalize"
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mt-2">
            {filtered.map((site) => (
              <SiteCard key={site.id} post={site} />
            ))}
          </div>
        </Wrapper>
      </section>
    </>
  );
}
