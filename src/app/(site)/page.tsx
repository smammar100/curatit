import type { Metadata } from "next";
// Components
import Faq from "@/components/global/Faq";
import ClosingCta from "@/components/home/ClosingCta";
import HomeHero from "@/components/home/HomeHero";
import { HomePostsProvider } from "@/components/home/HomePosts";
import HowItWorks from "@/components/home/HowItWorks";
import HydrateOnView from "@/components/home/HydrateOnView";
import CreativeDnaSection from "@/components/home/CreativeDnaSection";
import McpSection from "@/components/home/McpSection";
import { detail, featuredPosts } from "@/components/home/demo";
import { Categories, ProblemSolution } from "@/components/home/islands";
import { faqs } from "@/components/home/faqs";
import { categoriesWithPosts } from "@/lib/categories";
import { categoryPosts, getPublishedPosts, toPostCard, type LibraryPost, type PostCard } from "@/lib/posts";

export const metadata: Metadata = {
  title: { absolute: "Curatit: find ideas for your next social media post" },
  description:
    "Real brand posts, each with a breakdown approved by an editor. Describe the post you need, save the best references to private boards, and share them with your client.",
};

// Posts come from Supabase at build time; pick up newly published ones hourly
export const revalidate = 3600;

export default async function HomePage() {
  const posts = await getPublishedPosts();
  // Client components get only the posts they show, and of each only what they draw (PostCard:
  // the cover unless they need every slide); the rest stays on the server, out of the page's data
  const featured = posts
    .filter((post) => featuredPosts.includes(post.shortCode))
    .map((post) => ({
      ...toPostCard(post, post.shortCode === detail.post ? post.images : undefined),
      width: post.width,
      height: post.height,
      hook: post.hook,
    }));
  // The tabs: the brands' main categories that can fill the ten-slot gallery, each with its ten
  // posts. One card per post, so a post in two tabs is written into the page's data once (React
  // refers back to an object it has already sent)
  const tabs = categoriesWithPosts(posts, { main: true, min: 10 });
  const cards = new Map<string, PostCard>();
  const card = (post: LibraryPost) => {
    if (!cards.has(post.id)) cards.set(post.id, toPostCard(post));
    return cards.get(post.id)!;
  };
  const galleries = Object.fromEntries(tabs.map((category) => [category.slug, categoryPosts(posts, category.slug, 10).map(card)]));

  // Below the hero, each section keeps its server HTML and only comes alive as it scrolls
  // into view (the ones after the first, half a screen ahead), and not before the visitor has
  // scrolled, tapped or pressed a key, so a phone's first seconds go to the hero alone (see
  // HydrateOnView). The FAQ
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
        <Categories categories={tabs} galleries={galleries} />
      </HydrateOnView>
      <HydrateOnView ahead>
        <CreativeDnaSection />
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
