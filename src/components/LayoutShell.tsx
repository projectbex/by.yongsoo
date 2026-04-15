"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { DataProvider } from "@/lib/dataContext";

function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const isLogin = pathname === "/login";

  useEffect(() => {
    const handleAuth = async () => {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams(window.location.search);
      const u = params.get('u');
      const v = params.get('v');

      // SSO 토큰이 있는 경우 검증 시도
      if (u && v) {
        try {
          const secretKey = "buhmwoo2026!@#";
          const now = new Date();
          // KST(한국 시간) 강제 적용 보정
          const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
          const todayStr = kst.toISOString().slice(0, 10).replace(/-/g, '');

          const text = secretKey + u + todayStr;
          const enc = new TextEncoder().encode(text);
          const buffer = await window.crypto.subtle.digest('SHA-256', enc);
          const hash = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');

          if (hash === v) {
            localStorage.setItem("bex-auth", "authenticated");
            // URL 파라미터 제거 (지저분하지 않게)
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            if (isLogin) {
              router.push("/");
              return;
            }
          }
        } catch (e) {
          console.error("SSO verification failed:", e);
        }
      }

      if (!isLogin) {
        if (localStorage.getItem("bex-auth") !== "authenticated") {
          router.push("/login");
          return;
        }
      }
      setOk(true);
    };

    handleAuth();
  }, [pathname, isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (!ok) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
  return <>{children}</>;
}

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) return <AuthGate>{children}</AuthGate>;

  return (
    <AuthGate>
      <DataProvider>
        <div className="flex min-h-screen bg-[#F8FAFC]">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar />
            <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
          </div>
        </div>
      </DataProvider>
    </AuthGate>
  );
}
