import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { formatDate, getCollection, getEntry, renderMarkdown } from "@/lib/content";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const pages = await getCollection("legal");
  return pages.map((page) => ({ slug: page.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getEntry("legal", slug);
  return page ? { title: page.data.page } : {};
}

export default async function LegalPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = await getEntry("legal", slug);
  if (!page) notFound();

  const html = await renderMarkdown(page.body);

  return (
    <section>
      <Wrapper variant="standard" className="py-24 lg:pt-48">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="text-balance lg:w-1/3">
            <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-thin">
              {page.data.page}
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4">
              Last updated on {formatDate(page.data.pubDate)}
            </Text>
          </div>
          <div className="lg:w-1/2">
            <Wrapper variant="prose">
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </Wrapper>
          </div>
        </div>
      </Wrapper>
    </section>
  );
}
