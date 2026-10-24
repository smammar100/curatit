import Link from "next/link";
// Assets
import Image from "next/image";
// Fundation
import Text from "@/components/fundations/elements/Text";
// Glaze
import { Button } from "@/components/glaze/ui/button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Icons
import { ArrowUpRight, Icon } from "@/components/glaze/icon";
import { DataList, DataListItem, DataListLabel, DataListValue } from "@/components/glaze/ui/data-list";
// Components
import BigCard from "@/components/sites/SiteCard";
import Search from "@/components/sites/Search";
// Content
import { getCollection, type CollectionEntry } from "@/lib/content";

export default function SitesLayout({
  frontmatter,
}: {
  frontmatter: CollectionEntry<"sites">["data"];
}) {
  const alltools = getCollection("sites");
  return (
    <>
      <Search />
      <section>
        <Wrapper variant="standard" className="page-start">
          <div className="flex flex-wrap justify-between gap-4">
            <div className="max-w-xl text-balance">
              <Text tag="h1" variant="h1" className="text-text-1">
                {frontmatter.title}
              </Text>
              <Text tag="p" variant="bodySM" className="mt-4 text-text-2">
                {frontmatter.description}
              </Text>
            </div>
            <Button size="icon" aria-label={`Visit ${frontmatter.title}`} title={`Visit ${frontmatter.title}`} render={<a href={frontmatter.live} />} nativeButton={false}>
              <Icon icon={ArrowUpRight} />
            </Button>
          </div>
          <div className="mt-12 rounded-(--radius-float) bg-shell p-8">
            <Image
              width={1400}
              height={1400}
              loading="eager"
              src={frontmatter.thumbnail.url}
              alt={frontmatter.thumbnail.alt}
              sizes="100vw"
              className="aspect-8/5 size-full rounded-panel object-cover object-top outline-1 -outline-offset-1 outline-line-faint"
            />
          </div>
          <DataList className="mt-4">
            {frontmatter.details?.map((details) => (
              <DataListItem key={details.label}>
                <DataListLabel>{details.label}</DataListLabel>
                <DataListValue>{details.value}</DataListValue>
              </DataListItem>
            ))}
          </DataList>
        </Wrapper>
      </section>
      <section>
        <Wrapper variant="standard" className="section-y">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <Text tag="h2" variant="h3" className="text-text-1">
              Latest additions
            </Text>
            <Button size="sm" variant="secondary" render={<Link href="/sites" />} nativeButton={false}>
              See all tools
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mt-8">
            {alltools.slice(0, 4).map((post) => (
              <BigCard key={post.id} post={post} />
            ))}
          </div>
        </Wrapper>
      </section>
    </>
  );
}
