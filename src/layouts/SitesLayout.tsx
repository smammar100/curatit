// Assets
import Image from "next/image";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Icons
import ArrowUpRight from "@/components/fundations/icons/ArrowUpRight";
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
              <Text tag="h1" variant="displayLG" className="font-display font-light text-base-900 capitalize">
                {frontmatter.title}
              </Text>
              <Text tag="p" variant="textSM" className="text-base-600 mt-4">
                {frontmatter.description}
              </Text>
            </div>
            <Button
              isLink
              iconOnly
              size="xs"
              variant="default"
              href={frontmatter.live}
              title={frontmatter.title}
            >
              <ArrowUpRight className="size-4" />
            </Button>
          </div>
          <div className="p-8 bg-base-50 rounded-lg mt-12">
            <Image
              width={1400}
              height={1400}
              loading="eager"
              src={frontmatter.thumbnail.url}
              alt={frontmatter.thumbnail.alt}
              sizes="100vw"
              className="size-full aspect-8/5 object-top rounded shadow"
            />
          </div>
          <dl className="mt-4 divide-y divide-base-100">
            {frontmatter.details?.map((details) => (
              <div key={details.label} className="flex itmes-center gap-2 justify-between py-2">
                <dt>
                  <Text tag="h3" variant="textSM" className="text-base-900 font-medium">
                    {details.label}
                  </Text>
                </dt>
                <dd>
                  <Text tag="p" variant="textSM" className="text-base-600">
                    {details.value}
                  </Text>
                </dd>
              </div>
            ))}
          </dl>
        </Wrapper>
      </section>
      <section>
        <Wrapper variant="standard" className="section-y">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <Text tag="h2" variant="displaySM" className="text-base-900 font-display font-thin">
              Latest additions
            </Text>
            <Button isLink size="sm" variant="muted" href="/sites">
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
