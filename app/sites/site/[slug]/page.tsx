import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { ArrowUpRight } from "@/components/fundations/icons";
import SiteCard from "@/components/sites/SiteCard";
import Search from "@/components/sites/Search";
import { getCollection, getEntry, renderMarkdown } from "@/lib/content";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const sites = await getCollection("sites");
  return sites.map((site) => ({ slug: site.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getEntry("sites", slug);
  if (!site) return {};

  return {
    title: site.data.title,
    description: site.data.description,
    openGraph: {
      title: site.data.title,
      description: site.data.description,
      images: [site.data.thumbnail.url],
    },
  };
}

export default async function SiteDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const site = await getEntry("sites", slug);
  if (!site) notFound();

  const html = await renderMarkdown(site.body);
  const latest = (await getCollection("sites")).slice(0, 4);

  return (
    <>
      <Search />
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div className="flex flex-wrap justify-between gap-4">
            <div className="max-w-xl text-balance">
              <Text
                tag="h1"
                variant="displayMD"
                className="text-base-900 font-display font-thin capitalize"
              >
                {site.data.title}
              </Text>
              <Text tag="p" variant="textSM" className="text-base-600 mt-4">
                {site.data.description}
              </Text>
            </div>
            <Button
              isLink
              iconOnly
              size="xs"
              variant="default"
              href={site.data.live}
              title={site.data.title}
              aria-label={`Visit ${site.data.title}`}
              icon={<ArrowUpRight className="size-4" />}
            />
          </div>
          <div className="p-8 bg-base-50 rounded-lg mt-12">
            <Image
              width={1400}
              height={1400}
              loading="lazy"
              decoding="async"
              src={site.data.thumbnail.url}
              alt={site.data.thumbnail.alt}
              className="size-full aspect-8/5 object-top rounded shadow"
            />
          </div>
          <dl className="mt-4 divide-y divide-base-100">
            {(site.data.details ?? []).map((detail) => (
              <div key={detail.label} className="flex items-center gap-2 justify-between py-2">
                <dt>
                  <Text tag="h3" variant="textSM" className="text-base-900 font-medium">
                    {detail.label}
                  </Text>
                </dt>
                <dd>
                  <Text tag="p" variant="textSM" className="text-base-600">
                    {detail.value}
                  </Text>
                </dd>
              </div>
            ))}
          </dl>
          <Wrapper variant="prose" className="mt-12">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </Wrapper>
        </Wrapper>
      </section>
      <section>
        <Wrapper variant="standard" className="py-24">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <Text tag="h2" variant="displaySM" className="text-base-900 font-display font-thin">
              Latest additions
            </Text>
            <Button isLink size="sm" variant="muted" href="/sites">
              See all tools
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mt-8">
            {latest.map((item) => (
              <SiteCard key={item.id} post={item} />
            ))}
          </div>
        </Wrapper>
      </section>
    </>
  );
}
