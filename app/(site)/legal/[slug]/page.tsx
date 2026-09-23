import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Wrapper from "@/components/fundations/containers/Wrapper";
import PageHeader from "@/components/fundations/containers/PageHeader";
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
  const updated = formatDate(page.data.pubDate);

  return (
    <Wrapper variant="standard" className="pb-24">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title={page.data.page}
          description={
            <>
              Last updated on{" "}
              <time dateTime={updated} className="tabular-nums">
                {updated}
              </time>
            </>
          }
        />
        <Wrapper variant="prose">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </Wrapper>
      </div>
    </Wrapper>
  );
}
