import type { Metadata } from "next";
// Components
import Faq from "@/components/global/Faq";
import Categories from "@/components/home/Categories";
import ClosingCta from "@/components/home/ClosingCta";
import HomeHero from "@/components/home/HomeHero";
import { HomePostsProvider } from "@/components/home/HomePosts";
import HowItWorks from "@/components/home/HowItWorks";
import McpSection from "@/components/home/McpSection";
import ProblemSolution from "@/components/home/ProblemSolution";
import { featuredPosts } from "@/components/home/demo";
import { faqs } from "@/components/home/faqs";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: { absolute: "Curatit: find the brand posts worth studying" },
  description:
    "Real organic brand posts, reviewed by editors. Search by brief, save the best references to private boards, and share them with your client.",
};

// Posts come from Supabase at build time; pick up newly published ones hourly
export const revalidate = 3600;

export default async function HomePage() {
  const posts = await getPublishedPosts();
  // The client demos only need the posts they show
  const featured = posts.filter((post) => featuredPosts.includes(post.shortCode));

  return (
    <HomePostsProvider posts={featured}>
      <HomeHero posts={posts} />
      <ProblemSolution />
      <HowItWorks />
      <Categories posts={posts} />
      <McpSection />
      <Faq faqs={faqs} />
      <ClosingCta posts={posts} />
    </HomePostsProvider>
  );
}
