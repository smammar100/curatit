// Assets
import Image from "next/image";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Icons
import Checkout from "@/components/fundations/icons/Checkout";
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
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div>
            <div className="flex flex-wrap justify-between gap-4">
              <div className="max-w-xl text-balance">
                <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-thin">
                  {frontmatter.title}
                </Text>
                <Text tag="p" variant="textBase" className="text-base-600 mt-4">
                  {frontmatter.description}
                </Text>
              </div>
              <Button
                isLink
                iconOnly
                size="xs"
                variant="default"
                href={frontmatter.checkout}
                title={frontmatter.title}
              >
                <Checkout className="size-4" />
              </Button>
            </div>
            <div className="p-8 bg-base-50 rounded-lg mt-12">
              <Image
                width={1400}
                height={1400}
                loading="eager"
                src={frontmatter.image.url}
                alt={frontmatter.image.alt}
                sizes="100vw"
                className="size-full aspect-8/5 object-top rounded shadow"
              />
            </div>
            <dl className="mt-4 divide-y divide-base-100">
              {frontmatter.features.map((feature) => (
                <div key={feature.title} className="flex itmes-center gap-2 justify-between py-2">
                  <dt>
                    <Text tag="h3" variant="textSM" className="text-base-900 font-medium">
                      {feature.title}
                    </Text>
                  </dt>
                  <dd className="mt-1">
                    <Text tag="p" variant="textSM" className="text-base-600">
                      {feature.description}
                    </Text>
                  </dd>
                </div>
              ))}
              <div className="divide-y divide-base-100">
                <div className="flex itmes-center gap-2 justify-between py-2">
                  <dt>
                    <Text tag="h3" variant="textSM" className="text-base-900 font-medium">
                      <span>Details</span>
                    </Text>
                  </dt>
                  <dd>
                    <ul role="list">
                      {frontmatter.highlights.map((highlight) => (
                        <li key={highlight}>
                          <Text tag="p" variant="textSM" className="text-base-600">
                            {highlight}
                          </Text>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </div>
              <Text tag="p" variant="textSM" className="text-base-600 mt-4">
                {frontmatter.license}
              </Text>
            </dl>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {frontmatter.gallery?.map((img) => (
              <div key={img.url} className="p-8 bg-base-50 rounded-lg mt-12">
                <Image
                  width={1400}
                  height={1400}
                  src={img.url}
                  alt={img.alt}
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="size-full aspect-8/5 object-top rounded shadow"
                />
              </div>
            ))}
          </div>
        </Wrapper>
      </section>
      <section>
        <Wrapper variant="standard" className="py-24">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <Text tag="h2" variant="displaySM" className="text-base-900 font-display font-thin">
              More products
            </Text>
            <Button isLink size="sm" variant="muted" href="/store">
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
