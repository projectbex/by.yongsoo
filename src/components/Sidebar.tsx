"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface MenuItem {
  href?: string;
  label: string;
  icon: string;
  children?: { href: string; label: string }[];
}

const MENU: MenuItem[] = [
  {
    label: "대시보드",
    icon: "📊",
    children: [{ href: "/", label: "전체 개요" }],
  },
  {
    label: "매출 분석",
    icon: "📈",
    children: [
      { href: "/analysis/category", label: "유종별 분석" },
      { href: "/analysis/product", label: "품목별 분석" },
      { href: "/analysis/region", label: "팀별 분석" },
    ],
  },
  {
    label: "영업 분석",
    icon: "👤",
    children: [
      { href: "/sales-team/staff", label: "팀별 성과" },
      { href: "/sales-team/customer", label: "거래처 분석" },
    ],
  },
  {
    label: "수익성",
    icon: "💰",
    children: [{ href: "/profit", label: "영업이익 분석" }],
  },
  {
    label: "재무",
    icon: "⚠️",
    children: [{ href: "/receivables", label: "미수 관리" }],
  },
  {
    label: "출고 / 물류",
    icon: "📦",
    children: [{ href: "/shipment", label: "출고 현황" }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(MENU.map((m) => m.label))
  );

  const toggle = (label: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname === "" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-[220px] bg-[#0B0F14] min-h-screen flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold text-white">
              B
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">BEX SCM</h1>
              <p className="text-[10px] text-gray-500">유통영업본부 BI</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {MENU.map((section) => (
            <div key={section.label}>
              <button
                onClick={() => toggle(section.label)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition"
              >
                <span className="text-sm">{section.icon}</span>
                <span className="flex-1 text-left">{section.label}</span>
                <span className={`text-[10px] transition-transform ${openSections.has(section.label) ? "rotate-0" : "-rotate-90"}`}>
                  ▾
                </span>
              </button>
              {openSections.has(section.label) && section.children && (
                <div className="ml-4 pl-3 border-l border-white/5 space-y-0.5">
                  {section.children.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-3 py-1.5 rounded-md text-[13px] transition-all ${
                        isActive(item.href)
                          ? "bg-blue-500/15 text-blue-400 font-medium"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/5">
          <p className="text-[10px] text-gray-600">벡스인터코퍼레이션</p>
          <p className="text-[10px] text-gray-700">v3.0</p>
        </div>
      </aside>

      {/* Mobile bottom tab */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B0F14] border-t border-white/10 z-50">
        <div className="flex justify-around items-center h-14">
          {[
            { href: "/", icon: "📊", label: "개요" },
            { href: "/analysis/category", icon: "📈", label: "분석" },
            { href: "/profit", icon: "💰", label: "이익" },
            { href: "/receivables", icon: "⚠️", label: "미수" },
            { href: "/shipment", icon: "📦", label: "출고" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                isActive(item.href) ? "text-blue-400" : "text-gray-500"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
