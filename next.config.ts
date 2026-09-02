import type { NextConfig } from "next";

const repoName = "hlm_run_app";
const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isProduction ? "/hlm_run_app" : "",
  assetPrefix: isProduction ? "/hlm_run_app/" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
