import type { Metadata } from "next";
// Components
import Faq from "@/components/global/Faq";
import Categories from "@/components/home/Categories";
import ClosingCta from "@/components/home/ClosingCta";
import HomeHero from "@/components/home/HomeHero";
import HowItWorks from "@/components/home/HowItWorks";
import SafeToShare from "@/components/home/SafeToShare";
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
      <HowItWorks />
      <Categories />
      <SafeToShare />
      <Faq faqs={faqs} />
      <ClosingCta />
    </>
  );
}
