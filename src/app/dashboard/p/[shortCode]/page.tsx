import type { Metadata } from "next";
import { notFound } from "next/navigation";
// Components
import Feed from "@/components/dashboard/Feed";
import { postParams } from "@/app/dashboard/post";
import { getPostDetail } from "@/lib/posts";

// A post opened from a link: the feed underneath, with the post over it in the @modal slot
export const generateStaticParams = postParams;

export async function generateMetadata({ params }: { params: Promise<{ shortCode: string }> }): Promise<Metadata> {
  const post = await getPostDetail((await params).shortCode);
  return { title: post ? `${post.brand.name}: ${post.hook || "post"} | Curatit` : "Curatit" };
}

export default async function PostPage({ params }: { params: Promise<{ shortCode: string }> }) {
  if (!(await getPostDetail((await params).shortCode))) notFound();
  return <Feed />;
}
