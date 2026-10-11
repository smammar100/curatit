import type { Metadata } from "next";
import ReviewPost from "@/components/dashboard/review/ReviewPost";

export const metadata: Metadata = { title: "Review analysis · Curatit" };

// One post's analysis under review. The same shell for every post, built on first visit: what's
// in it loads in the browser, and only for editors.
export function generateStaticParams() {
  return [];
}

export default async function ReviewPostPage({ params }: { params: Promise<{ id: string }> }) {
  return <ReviewPost postId={decodeURIComponent((await params).id)} />;
}
