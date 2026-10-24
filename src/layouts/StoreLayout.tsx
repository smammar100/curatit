import Link from "next/link";
// Assets
import Image from "next/image";
// Fundation
import Text from "@/components/fundations/elements/Text";
// Glaze
import { Button } from "@/components/glaze/ui/button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Icons
import { Checkout, Icon } from "@/components/glaze/icon";
import { DataList, DataListItem, DataListLabel, DataListValue } from "@/components/glaze/ui/data-list";
// Components
import StoreCard from "@/components/store/StoreCard";
// Content
import { getCollection, type CollectionEntry } from "@/lib/content";

export default function StoreLayout({
  frontmatter,
}: {
  frontmatter: CollectionEntry<"store">["data"];
}) {
  const allstore = getCollection("store");
  return (
    <>
      <section>
        <Wrapper variant="standard" className="page-start">
          <div>
            <div className="flex flex-wrap justify-between gap-4">
              <div className="max-w-xl text-balance">
                <Text tag="h1" variant="h1" className="text-text-1">
                  {frontmatter.title}
                </Text>
                <Text tag="p" variant="body" className="mt-4 text-text-2">
                  {frontmatter.description}
                </Text>
              </div>
              <Button size="icon" aria-label={`Buy ${frontmatter.title}`} title={`Buy ${frontmatter.title}`} render={<a href={frontmatter.checkout} />} nativeButton={false}>
                <Icon icon={Checkout} />
              </Button>
            </div>
            <div className="mt-12 rounded-(--radius-float) bg-shell p-8">
              <Image
                width={1400}
                height={1400}
                loading="eager"
                src={frontmatter.image.url}
                alt={frontmatter.image.alt}
                sizes="100vw"
                className="aspect-8/5 size-full rounded-panel object-cover object-top outline-1 -outline-offset-1 outline-line-faint"
              />
            </div>
            <DataList className="mt-4">
              {frontmatter.features.map((feature) => (
                <DataListItem key={feature.title}>
                  <DataListLabel>{feature.title}</DataListLabel>
                  <DataListValue>{feature.description}</DataListValue>
                </DataListItem>
              ))}
              <DataListItem>
                <DataListLabel>Details</DataListLabel>
                <DataListValue>
                  <ul role="list">
                    {frontmatter.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                </DataListValue>
              </DataListItem>
            </DataList>
            <Text tag="p" variant="bodySM" className="mt-4 text-text-2">
              {frontmatter.license}
            </Text>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {frontmatter.gallery?.map((img) => (
              <div key={img.url} className="mt-12 rounded-(--radius-float) bg-shell p-8">
                <Image
                  width={1400}
                  height={1400}
                  src={img.url}
                  alt={img.alt}
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="aspect-8/5 size-full rounded-panel object-cover object-top outline-1 -outline-offset-1 outline-line-faint"
                />
              </div>
            ))}
          </div>
        </Wrapper>
      </section>
      <section>
        <Wrapper variant="standard" className="section-y">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <Text tag="h2" variant="h3" className="text-text-1">
              More products
            </Text>
            <Button size="sm" variant="secondary" render={<Link href="/store" />} nativeButton={false}>
              See all products
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {allstore.slice(0, 3).map((post) => (
              <StoreCard key={post.id} post={post} />
            ))}
          </div>
        </Wrapper>
      </section>
    </>
  );
}
