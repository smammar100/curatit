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
  async rewrites() {
    if (!supabaseUrl) return [];
    // /lib/<path> is the `library` bucket. A short local path keeps every image URL
    // (and every srcset entry, repeated up to ten times per image) half the length.
    return [{ source: "/lib/:path*", destination: `${supabaseUrl}/storage/v1/object/public/library/:path*` }];
  },
};

export default nextConfig;
