import type { Metadata } from "next";
import { notFound } from "next/navigation";
// Components
import PostView from "@/components/dashboard/PostView";
import { getPostDetail, getPublishedPosts } from "@/lib/posts";

// Built for every published post; one published after the build renders on its first visit
export async function generateStaticParams() {
  return (await getPublishedPosts()).map((post) => ({ shortCode: post.shortCode }));
}

export async function generateMetadata({ params }: { params: Promise<{ shortCode: string }> }): Promise<Metadata> {
  const post = await getPostDetail((await params).shortCode);
  return { title: post ? `${post.brand.name}: ${post.hook || "post"} | Curatit` : "Curatit" };
}

export default async function PostPage({ params }: { params: Promise<{ shortCode: string }> }) {
  const post = await getPostDetail((await params).shortCode);
  if (!post) notFound();
  return <PostView post={post} />;
}
