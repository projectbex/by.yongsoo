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
    if (!isLogin && typeof window !== "undefined") {
      if (localStorage.getItem("bex-auth") !== "authenticated") {
        router.push("/login");
        return;
      }
    }
    setOk(true);
  }, [pathname, isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (!ok) return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-900 border-t-blue-400 rounded-full animate-spin" />
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
        <div className="flex min-h-screen bg-[#111827]">
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
