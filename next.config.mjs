/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Local screenshots are large PNGs; keep the optimizer on but cap the sizes we emit.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
};

export default nextConfig;
