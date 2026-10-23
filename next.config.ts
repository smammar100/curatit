import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  images: {
    // Widths the optimizer may produce. Nothing on the site renders wider than ~600px
    // (1200px at 2x), so the defaults up to 3840 only made every srcset longer.
    deviceSizes: [640, 828, 1080, 1200],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    // Qualities the optimizer accepts (Next 16 rejects any other with a 400). 60 is for the
    // hero corridor's moving cards (HomeHero), 75 is next/image's default for everything else.
    qualities: [60, 75],
    // Library post images in the public `library` Storage bucket
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/library/**" },
    ],
  },
  // Security headers on every response (2026-10-18). frame-ancestors keeps Curatit out of other
  // sites' frames (clickjacking); nosniff stops a file being run as a type it isn't; the
  // referrer policy sends only the origin to other sites. A full Content-Security-Policy is left
  // for later: the page's inline scripts (ThemeScript, DeferredImages) would need nonces first.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  // The About page became Vision (2026-10-12); old links still land
  async redirects() {
    return [
      { source: "/about", destination: "/vision", permanent: true },
      // The template's styleguide pages, replaced by the design system (2026-10-18)
      { source: "/system/overview", destination: "/system", permanent: true },
      { source: "/system/colors", destination: "/system/colour", permanent: true },
      { source: "/system/typography", destination: "/system/type", permanent: true },
      { source: "/system/buttons", destination: "/system/button", permanent: true },
      { source: "/system/links", destination: "/system/button", permanent: true },
    ];
  },
  async rewrites() {
    if (!supabaseUrl) return [];
    // /lib/<path> is the `library` bucket. A short local path keeps every image URL
    // (and every srcset entry, repeated up to ten times per image) half the length.
    return [{ source: "/lib/:path*", destination: `${supabaseUrl}/storage/v1/object/public/library/:path*` }];
  },
};

export default nextConfig;
