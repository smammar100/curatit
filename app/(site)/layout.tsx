import type { ReactNode } from "react";
import Navigation from "@/components/navigation/Navigation";
import Footer from "@/components/global/Footer";

/** Shared chrome for every page except the landing, which has its own navbar. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col lg:min-h-svh">
      <Navigation />
      <main className="grow">{children}</main>
      <Footer />
    </div>
  );
}
