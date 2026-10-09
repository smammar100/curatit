import type { Metadata } from "next";
// Components
import Faq from "@/components/global/Faq";
import Categories from "@/components/home/Categories";
import ClosingCta from "@/components/home/ClosingCta";
import HomeHero from "@/components/home/HomeHero";
import HowItWorks from "@/components/home/HowItWorks";
import McpSection from "@/components/home/McpSection";
import ProblemSolution from "@/components/home/ProblemSolution";
import { faqs } from "@/components/home/faqs";

export const metadata: Metadata = {
  title: { absolute: "Curatit: find the brand posts worth studying" },
  description:
    "Real organic brand posts, reviewed by editors. Search by brief, save the best references to private boards, and share them with your client.",
};

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <ProblemSolution />
      <HowItWorks />
      <Categories />
      <McpSection />
      <Faq faqs={faqs} />
      <ClosingCta />
    </>
  );
}
