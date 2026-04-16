import type { NextConfig } from "next";

// dev (NODE_ENV !== "production") 에서는 output:"export" 를 끈다.
// 이유: dev 서버에서는 RSC payload 가 실제 정적 파일로 생성되지 않아
//       router.push() 가 "Failed to fetch RSC payload" 로 실패한다.
//       production 빌드(`next build`)에서만 정적 export 를 활성화한다.
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  ...(isProd ? { output: "export" as const } : {}),
  basePath: "/by.yongsoo",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
