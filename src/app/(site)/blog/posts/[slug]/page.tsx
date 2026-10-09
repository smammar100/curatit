import { notFound } from "next/navigation";
// Layout
import BlogLayout from "@/layouts/BlogLayout";
// Content
import { getCollection, getEntry } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCollection("posts").map((entry) => ({ slug: entry.id }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getEntry("posts", slug);
  if (!entry) notFound();
  const html = await renderMarkdown(entry.body);
  return <BlogLayout frontmatter={entry.data} html={html} />;
}
