import type { NextConfig } from "next";

const repoName = "hlm_run_app";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/hlm_run_app",
  assetPrefix: "/hlm_run_app/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
