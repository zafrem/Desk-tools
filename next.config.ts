import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // If deploying to GitHub Pages with a repo name, uncomment and set basePath
  // basePath: '/Desk-tools',
  // assetPrefix: '/Desk-tools/',
};

export default nextConfig;
