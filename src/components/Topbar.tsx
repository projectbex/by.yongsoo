"use client";

import { useData, Filters } from "@/lib/dataContext";

export default function Topbar() {
  const { filters, setFilters, staffList, teamList, categoryList } = useData();

  const set = (key: keyof Filters, value: string) =>
    setFilters({ ...filters, [key]: value });

  return (
    <div className="bg-[#1F2937] border-b border-white/5 px-5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* 팀 */}
        <select
          value={filters.team}
          onChange={(e) => set("team", e.target.value)}
          className="bg-[#111827] border border-white/10 text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">전체 팀</option>
          {teamList.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* 담당자 */}
        <select
          value={filters.staff}
          onChange={(e) => set("staff", e.target.value)}
          className="bg-[#111827] border border-white/10 text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">전체 담당자</option>
          {staffList.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* 유종 */}
        <select
          value={filters.category}
          onChange={(e) => set("category", e.target.value)}
          className="bg-[#111827] border border-white/10 text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">전체 유종</option>
          {categoryList.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* 품목 검색 */}
        <input
          type="text"
          placeholder="품목 검색"
          value={filters.product}
          onChange={(e) => set("product", e.target.value)}
          className="bg-[#111827] border border-white/10 text-gray-300 text-xs rounded-lg px-3 py-1.5 w-32 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-600"
        />

        {/* 거래처 검색 */}
        <input
          type="text"
          placeholder="거래처 검색"
          value={filters.customer}
          onChange={(e) => set("customer", e.target.value)}
          className="bg-[#111827] border border-white/10 text-gray-300 text-xs rounded-lg px-3 py-1.5 w-32 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-600"
        />

        {/* 초기화 */}
        {(filters.staff || filters.team || filters.category || filters.product || filters.customer) && (
          <button
            onClick={() => setFilters({ staff: "", team: "", category: "", product: "", customer: "" })}
            className="text-[11px] text-gray-500 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition"
          >
            ✕ 초기화
          </button>
        )}
      </div>
    </div>
  );
}
