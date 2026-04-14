"use client";

import React from "react";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-white">{title}</h1>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function ChartCard({
  title, subtitle, children, className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-[#1F2937] rounded-xl p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-4 border-blue-900 border-t-blue-400 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">데이터 로딩 중...</p>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center bg-[#1F2937] rounded-xl p-8 max-w-md">
        <p className="text-red-400 text-lg font-semibold mb-2">오류 발생</p>
        <p className="text-gray-400 text-sm mb-4">{message}</p>
        <button onClick={onRetry} className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
          다시 시도
        </button>
      </div>
    </div>
  );
}

export const CHART_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#84CC16", "#6B7280",
];

export const TOOLTIP_STYLE = {
  background: "#1F2937",
  border: "1px solid #374151",
  borderRadius: 8,
  fontSize: 12,
  color: "#e5e7eb",
} as const;
