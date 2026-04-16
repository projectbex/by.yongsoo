import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/by.yongsoo",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
