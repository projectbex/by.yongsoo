import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/bex-scm",
  images: { unoptimized: true },
};

export default nextConfig;
