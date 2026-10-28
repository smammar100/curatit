import type { Metadata } from "next";
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

// The page's own name in the tab ("Terms of use | Curatit"), not the bare site name
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = getEntry("legal", (await params).slug);
  return page ? { title: page.data.page } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getEntry("legal", slug);
  if (!page) notFound();
  const html = await renderMarkdown(page.body);
  return <LegalLayout frontmatter={page.data} html={html} />;
}
