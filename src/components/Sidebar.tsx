"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "전체 개요", icon: "📊" },
  { href: "/staff", label: "담당자별 매출", icon: "👤" },
  { href: "/inbound", label: "입고", icon: "📥" },
  { href: "/sales", label: "출고", icon: "📦" },
  { href: "/revenue", label: "매출", icon: "💰" },
  { href: "/analysis", label: "데이터 분석", icon: "📈" },
  { href: "/products", label: "상품관리", icon: "🏷️" },
  { href: "/upload", label: "엑셀 업로드", icon: "📤" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold text-white">B</div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">BEX SCM</h1>
            <p className="text-[10px] text-gray-400">유통영업본부</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2 mt-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-[13px] transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100 text-[11px] text-gray-400">
        벡스인터코퍼레이션
      </div>
    </aside>
  );
}
