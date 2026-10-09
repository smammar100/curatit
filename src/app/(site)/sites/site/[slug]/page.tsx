import { notFound } from "next/navigation";
// Layout
import SitesLayout from "@/layouts/SitesLayout";
// Content
import { getCollection, getEntry } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCollection("sites").map((page) => ({ slug: page.id }));
}

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getEntry("sites", slug);
  if (!page) notFound();
  return <SitesLayout frontmatter={page.data} />;
}
