import type { Metadata, Viewport } from "next";
import { Hedvig_Letters_Serif, Inter } from "next/font/google";
import type { ReactNode } from "react";
// Import global styles
import "@/styles/global.css";
import { SITE_URL } from "@/lib/site";

// Inter: https://rsms.me/inter/
const inter = Inter({ subsets: ["latin"], axes: ["opsz"], variable: "--font-inter" });
// Hedvig Letters Serif: https://fonts.google.com
const hedvig = Hedvig_Letters_Serif({ subsets: ["latin"], axes: ["opsz"], variable: "--font-hedvig" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Your Page Title",
  description: "A detailed description of your page content.",
  keywords: ["keyword1", "keyword2", "keyword3"],
  authors: [{ name: "Your Name or Company Name" }],
  alternates: { canonical: "https://yoursite.com/current-page" },
  openGraph: {
    url: "https://yoursite.com/current-page",
    title: "Your Page Title",
    description: "A detailed description of your page content.",
    images: [
      {
        url: "https://yoursite.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Open Graph Image Alt",
        type: "image/jpeg",
      },
    ],
    siteName: "Your Site Name",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@yourhandle",
    site: "@yoursite",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  // Theme color for mobile browsers
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${hedvig.variable} scroll-smooth selection:bg-accent-50 selection:text-accent-500`}
    >
      <body className="bg-white flex flex-col lg:min-h-svh">{children}</body>
    </html>
  );
}
