import type { Metadata } from "next";
// Components
import Faq from "@/components/global/Faq";
import ClosingCta from "@/components/home/ClosingCta";
import HomeHero from "@/components/home/HomeHero";
import { HomePostsProvider } from "@/components/home/HomePosts";
import HowItWorks from "@/components/home/HowItWorks";
import HydrateOnView from "@/components/home/HydrateOnView";
import McpSection from "@/components/home/McpSection";
import { detail, featuredPosts } from "@/components/home/demo";
import { Categories, ProblemSolution } from "@/components/home/islands";
import { faqs } from "@/components/home/faqs";
import { categoriesWithPosts } from "@/lib/categories";
import { categoryPosts, getPublishedPosts, withCoverOnly } from "@/lib/posts";

export const metadata: Metadata = {
  title: { absolute: "Curatit: find ideas for your next social media post" },
  description:
    "Real organic brand posts, reviewed by editors. Search by brief, save the best references to private boards, and share them with your client.",
};

// Posts come from Supabase at build time; pick up newly published ones hourly
export const revalidate = 3600;

export default async function HomePage() {
  const posts = await getPublishedPosts();
  // Client components get only the posts they show, and only the cover unless they need
  // every slide; the rest stays on the server, out of the page's data
  const featured = posts
    .filter((post) => featuredPosts.includes(post.shortCode))
    .map((post) => (post.shortCode === detail.post ? post : withCoverOnly(post)));
  // The tabs: the brands' main categories that can fill the ten-slot gallery
  const tabs = categoriesWithPosts(posts, { main: true, min: 10 });
  const gallery = [...new Map(tabs.flatMap((category) => categoryPosts(posts, category.slug, 10)).map((post) => [post.id, withCoverOnly(post)])).values()];

  // Below the hero, each section keeps its server HTML and only comes alive as it scrolls
  // into view (the ones after the first, half a screen ahead), so a phone's first seconds go to
  // the hero alone (see HydrateOnView). The FAQ
  // is server-only, so it has nothing to hydrate.
  return (
    <HomePostsProvider posts={featured}>
      <HomeHero posts={posts} />
      <HydrateOnView>
        <ProblemSolution />
      </HydrateOnView>
      <HydrateOnView ahead>
        <HowItWorks />
      </HydrateOnView>
      <HydrateOnView ahead>
        <Categories categories={tabs} posts={gallery} />
      </HydrateOnView>
      <HydrateOnView ahead>
        <McpSection />
      </HydrateOnView>
      <Faq faqs={faqs} />
      <HydrateOnView ahead>
        <ClosingCta posts={posts} />
      </HydrateOnView>
    </HomePostsProvider>
  );
}
