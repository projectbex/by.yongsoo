"use client";

import { ReactNode } from "react";

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}

export default function ScmFilterBar({ searchValue, onSearchChange, searchPlaceholder = "검색...", filters, actions }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
      />
      {filters}
      <div className="flex-1" />
      {actions}
    </div>
  );
}
