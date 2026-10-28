import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The stylesheet is small; inlining it removes the render-blocking request.
  experimental: { inlineCss: true },
};

export default nextConfig;
