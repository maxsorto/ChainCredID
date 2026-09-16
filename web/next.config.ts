import type { NextConfig } from "next";

// Static export: the app has no server routes. Cloudflare Pages publishes `web/out`.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
