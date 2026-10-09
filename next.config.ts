import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Library post images in the public `library` Storage bucket
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/library/**" },
    ],
  },
};

export default nextConfig;
