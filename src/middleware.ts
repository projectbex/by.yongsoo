import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 로그인 페이지, API auth, 정적 파일은 통과
  if (
    pathname === "/login" ||
    pathname === "/api/auth" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 인증 쿠키 확인
  const authCookie = request.cookies.get("bex-auth");
  if (authCookie?.value === "authenticated") {
    return NextResponse.next();
  }

  // 미인증 → 로그인 페이지로
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
