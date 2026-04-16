import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/projectBex",
  images: { unoptimized: true },
};

export default nextConfig;
