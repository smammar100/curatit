import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { Checkout } from "@/components/fundations/icons";
import StoreCard from "@/components/store/StoreCard";
import { getCollection, getEntry, renderMarkdown } from "@/lib/content";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const products = await getCollection("store");
  return products.map((product) => ({ slug: product.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getEntry("store", slug);
  if (!product) return {};

  return {
    title: product.data.title,
    description: product.data.description,
    openGraph: {
      title: product.data.title,
      description: product.data.description,
      images: [product.data.image.url],
    },
  };
}

export default async function StoreDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await getEntry("store", slug);
  if (!product) notFound();

  const html = await renderMarkdown(product.body);
  const more = (await getCollection("store")).filter((item) => item.id !== product.id).slice(0, 3);

  return (
    <>
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div>
            <div className="flex flex-wrap justify-between gap-4">
              <div className="max-w-xl text-balance">
                <Text
                  tag="h1"
                  variant="displayLG"
                  className="text-base-900 font-display font-thin"
                >
                  {product.data.title}
                </Text>
                <Text tag="p" variant="textBase" className="text-base-600 mt-4">
                  {product.data.description}
                </Text>
              </div>
              <Button
                isLink
                iconOnly
                size="xs"
                variant="default"
                href={product.data.checkout}
                title={product.data.title}
                aria-label={`Buy ${product.data.title}`}
                icon={<Checkout className="size-4" />}
              />
            </div>
            <div className="p-8 bg-base-50 rounded-lg mt-12">
              <Image
                width={1400}
                height={1400}
                loading="lazy"
                decoding="async"
                src={product.data.image.url}
                alt={product.data.image.alt ?? product.data.title}
                className="size-full aspect-8/5 object-top rounded shadow"
              />
            </div>
            <dl className="mt-4 divide-y divide-base-100">
              {product.data.features.map((feature) => (
                <div key={feature.title} className="flex items-center gap-2 justify-between py-2">
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
              <div className="flex items-center gap-2 justify-between py-2">
                <dt>
                  <Text tag="h3" variant="textSM" className="text-base-900 font-medium">
                    <span>Details</span>
                  </Text>
                </dt>
                <dd>
                  <ul>
                    {product.data.highlights.map((highlight) => (
                      <li key={highlight}>
                        <Text tag="p" variant="textSM" className="text-base-600">
                          {highlight}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <Text tag="p" variant="textSM" className="text-base-600 mt-4">
                {product.data.license}
              </Text>
            </dl>
          </div>

          {product.data.gallery && product.data.gallery.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {product.data.gallery.map((img) => (
                <div key={img.url} className="p-8 bg-base-50 rounded-lg mt-12">
                  <Image
                    width={1400}
                    height={1400}
                    loading="lazy"
                    decoding="async"
                    src={img.url}
                    alt={img.alt ?? product.data.title}
                    className="size-full aspect-8/5 object-top rounded shadow"
                  />
                </div>
              ))}
            </div>
          )}

          <Wrapper variant="prose" className="mt-12">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </Wrapper>
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
            {more.map((item) => (
              <StoreCard key={item.id} post={item} />
            ))}
          </div>
        </Wrapper>
      </section>
    </>
  );
}
