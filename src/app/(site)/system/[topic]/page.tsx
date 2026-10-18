import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TOPICS, topicBySlug } from "@/components/system/topics";
import { SHEETS } from "@/components/system/sheets";

export const dynamicParams = false;

export function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const topic = topicBySlug((await params).topic);
  return topic ? { title: `${topic.title} · Design system`, description: topic.blurb } : {};
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const topic = topicBySlug((await params).topic);
  if (!topic) notFound();
  const SheetFor = SHEETS[topic.slug];
  return <SheetFor />;
}
