import type { Metadata } from "next";
import Footer from "@/components/global/Footer";
import Navigation from "@/components/navigation/Navigation";
import Landing from "@/components/landing/Landing";
import { getViewer } from "@/lib/auth";
import { landingLibrary } from "@/lib/services/creatives";

export const metadata: Metadata = {
  title: { absolute: "Curatit: find the brand posts worth studying" },
};

export default async function HomePage() {
  const viewer = await getViewer();

  return (
    <>
      <Landing signedIn={Boolean(viewer)} nav={<Navigation />} library={landingLibrary()} />
      {/* Outside the scroll container, so it doesn't affect the card choreography. */}
      <Footer />
    </>
  );
}
