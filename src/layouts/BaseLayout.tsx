import type { ReactNode } from "react";
// Components
import Footer from "@/components/global/Footer";
import Navigation from "@/components/navigation/Navigation";

// Page shell inside <body>. Hide the navigation or footer on selected screens by passing props:
// <BaseLayout hideNavigation hideFooter>
// Pages that want the floating site search render <Search /> first in their content.
export default function BaseLayout({
  hideNavigation = false,
  hideFooter = false,
  children,
}: {
  hideNavigation?: boolean;
  hideFooter?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      {!hideNavigation && <Navigation />}
      <main className="grow">{children}</main>
      {!hideFooter && <Footer />}
    </>
  );
}
