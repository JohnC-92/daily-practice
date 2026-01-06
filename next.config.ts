import type { NextConfig } from "next";

const repoName = "daily-practice";

const nextConfig: NextConfig = {
  output: "export",
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}/`,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
