import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://yourdomain.com"),
  title: {
    default: "Curatit — Creative intelligence for organic social",
    template: "%s — Curatit",
  },
  description:
    "A curated, searchable library of organic brand posts, analysed by editors — for teams researching real campaigns.",
  keywords: ["social media", "creative research", "brand content", "instagram carousels", "reference boards"],
  authors: [{ name: "Curatit" }],
  openGraph: {
    type: "website",
    siteName: "Curatit",
    locale: "en_US",
    title: "Curatit — Creative intelligence for organic social",
    description:
      "A curated, searchable library of organic brand posts, analysed by editors — for teams researching real campaigns.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: { index: true, follow: true },
  // Drop an `icon.svg` / `apple-icon.png` into `app/` and Next wires up the
  // favicons automatically — the Astro theme shipped none.
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="scroll-smooth selection:bg-accent-50 selection:text-accent-500"
    >
      <head>
        {/* Inter: https://rsms.me/inter/ */}
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        {/* Hedvig Letters Serif */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hedvig+Letters+Serif:opsz@12..24&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white">{children}</body>
    </html>
  );
}
