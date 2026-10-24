import type { Metadata, Viewport } from "next";
import { Hedvig_Letters_Serif, Inter } from "next/font/google";
import ThemeScript from "@/components/global/ThemeScript";
import type { ReactNode } from "react";
import { GlazePortalProvider } from "@/lib/glaze/portal";
// Import global styles, then Glaze (scoped to .glaze, as its own stylesheet) and the bridge that gives Glaze
// Fluid Functionalism's type, motion and surfaces
import "@/styles/global.css";
import "@/components/glaze/styles.css";
import "@/styles/glaze-bridge.css";
import { SITE_URL } from "@/lib/site";

// Inter: https://rsms.me/inter/
// Without the optical-size axis: the site sets Inter at text sizes only, where it makes no
// difference, and the axis doubles the font file
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Hedvig Letters Serif: https://fonts.google.com
const hedvig = Hedvig_Letters_Serif({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-hedvig",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Curatit", template: "%s | Curatit" },
  description:
    "A searchable library of real brand social media posts, reviewed by editors, with breakdowns of their copy and design. Find examples, save them to boards, share them with your team.",
  authors: [{ name: "Curatit" }],
  // "./" is each page's own path on SITE_URL, so a page read on curatit.vercel.app names its
  // www.curatit.app address (docs/domain.md)
  alternates: { canonical: "./" },
  openGraph: {
    url: "./",
    title: "Curatit",
    description:
      "A searchable library of real brand social media posts, reviewed by editors. Find examples, save them to boards, share them with your team.",
    siteName: "Curatit",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  // Browser chrome colour: paper, or the dark canvas (the values of --color-white in global.css)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      // ThemeScript sets data-theme before React runs; the server never knows it
      suppressHydrationWarning
      // Smooth anchor scrolling only with motion allowed. Text selection is Glaze's (ink at 15%, base.css)
      className={`${inter.variable} ${hedvig.variable} motion-safe:scroll-smooth`}
    >
      {/* glaze: the design system's scope (2026-10-24); its overlays portal inside it through GlazePortalProvider */}
      <body className="glaze bg-page flex flex-col lg:min-h-svh">
        <ThemeScript />
        <GlazePortalProvider>
          {children}
        </GlazePortalProvider>
      </body>
    </html>
  );
}
