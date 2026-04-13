"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "전체 개요", shortLabel: "개요", icon: "📊" },
  { href: "/staff", label: "담당자별 매출", shortLabel: "담당자", icon: "👤" },
  { href: "/sales", label: "출고 현황", shortLabel: "출고", icon: "📦" },
  { href: "/analysis", label: "데이터 분석", shortLabel: "분석", icon: "📈" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* 데스크톱: 왼쪽 사이드바 */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 min-h-screen flex-col">
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
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-[13px] transition-all ${
                  isActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}>
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

      {/* 모바일: 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
                  isActive ? "text-blue-600" : "text-gray-400"
                }`}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
