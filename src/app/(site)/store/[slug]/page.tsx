import { notFound } from "next/navigation";
// Layout
import StoreLayout from "@/layouts/StoreLayout";
// Content
import { getCollection, getEntry } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCollection("store").map((page) => ({ slug: page.id }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getEntry("store", slug);
  if (!page) notFound();
  return <StoreLayout frontmatter={page.data} />;
}
