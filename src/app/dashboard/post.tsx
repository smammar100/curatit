import { notFound } from "next/navigation";
// Components
import PostView from "@/components/dashboard/PostView";
import { getPublishedAnalysis } from "@/lib/creative/display";
import { getPostDetail, getPublishedPosts } from "@/lib/posts";

// Shared by the routes that show a post. /dashboard/p/<shortCode> fills two slots: the page
// (the feed, underneath) and @modal (the post). Opened from the feed, the @modal slot's
// intercepting route (.)p renders the same post over the feed that's already there.

// Built for every published post; one published after the build renders on its first visit
export async function postParams() {
  return (await getPublishedPosts()).map((post) => ({ shortCode: post.shortCode }));
}

export async function PostModal({ params }: { params: Promise<{ shortCode: string }> }) {
  const post = await getPostDetail((await params).shortCode);
  if (!post) notFound();
  const analysis = await getPublishedAnalysis(post.id, post.images.length);
  return <PostView key={post.shortCode} post={post} analysis={analysis} />;
}
