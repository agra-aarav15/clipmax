import type { NextConfig } from "next";

/**
 * Static GitHub Pages build of the marketing site.
 *
 * This app intentionally contains no API routes, auth callback, dashboard, or
 * worker. GitHub Pages can only serve static files; the working product runs on
 * the full Next.js app. The preview keeps the landing page and its motion layer
 * so the design can be reviewed and shared without exposing any credentials.
 */
const basePath = process.env.PAGES_BASE_PATH?.trim() || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@clipmax/shared"],
};

export default nextConfig;
