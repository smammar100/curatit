import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// What hybrid search needs at run time beyond what the tracer finds (see outputFileTracingIncludes)
const SEARCH_RUNTIME = [
  "./models/**/*",
  "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/**/*",
  "./node_modules/@huggingface/transformers/node_modules/@img/sharp-*/**/*",
];

const nextConfig: NextConfig = {
  // Hybrid search's models (2026-10-25): the two routes that search ship the int8 models fetched
  // into ./models at build (scripts/fetch-search-models.mjs); transformers.js and onnxruntime-node
  // are external server packages by default in Next 16. Every route leaves out what Vercel's Linux
  // x64 never loads: the browser runtime (onnxruntime-web, 91 MB), the other platforms' binaries
  // and the browser WebAssembly builds. The tracer follows require calls, not native linking, so two
  // things are named here: onnxruntime-node's Linux x64 binary and libraries (loaded through a
  // computed path, bin/napi-v3/<platform>/<arch>/, 43 MB), and the platform packages of the sharp
  // that transformers.js imports on start (its own copy, nested under it, whose native module links
  // to libvips in a separate package; without it the import fails and search fell back to keyword,
  // 2026-10-25). Only the current platform's packages are installed, so on Vercel these are Linux
  // x64's. scripts/check-search-bundle.mjs loads the models from the traced files in CI
  outputFileTracingIncludes: {
    "/mcp": SEARCH_RUNTIME,
    "/api/v1/posts/search": SEARCH_RUNTIME,
  },
  outputFileTracingExcludes: {
    "/**": [
      "node_modules/onnxruntime-web/**/*",
      "node_modules/onnxruntime-node/bin/napi-v3/darwin/**/*",
      "node_modules/onnxruntime-node/bin/napi-v3/win32/**/*",
      "node_modules/onnxruntime-node/bin/napi-v3/linux/arm64/**/*",
      "node_modules/@huggingface/transformers/dist/*.wasm",
    ],
  },
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
