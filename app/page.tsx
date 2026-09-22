import Hero from "@/components/landing/Hero";
import SitesPreview from "@/components/landing/SitesPreview";
import BlogPreview from "@/components/landing/BlogPreview";
import StorePreview from "@/components/landing/StorePreview";
import Search from "@/components/sites/Search";

export default function HomePage() {
  return (
    <>
      <Search />
      <Hero />
      <SitesPreview />
      <BlogPreview />
      <StorePreview />
    </>
  );
}
