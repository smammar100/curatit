import { notFound } from "next/navigation";
// Layout
import LegalLayout from "@/layouts/LegalLayout";
// Content
import { getCollection, getEntry } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCollection("legal").map((page) => ({ slug: page.id }));
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getEntry("legal", slug);
  if (!page) notFound();
  const html = await renderMarkdown(page.body);
  return <LegalLayout frontmatter={page.data} html={html} />;
}
