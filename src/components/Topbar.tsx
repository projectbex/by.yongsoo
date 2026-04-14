"use client";

import { useData, Filters } from "@/lib/dataContext";

// YYYYMMDD <-> YYYY-MM-DD 변환 (date input 호환)
function toDateInput(ymd: string): string {
  if (!ymd || ymd.length < 8) return "";
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}
function fromDateInput(v: string): string {
  return v.replace(/-/g, "");
}

function todayYmd(): string {
  const d = new Date();
  return (
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0")
  );
}

export default function Topbar() {
  const { filters, setFilters, staffList, teamList, categoryList } = useData();

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters({ ...filters, [key]: value });

  const hasNonDateFilter =
    filters.staff || filters.team || filters.category || filters.product || filters.customer;

  const inputCls =
    "bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none";

  return (
    <div className="bg-white border-b border-slate-200 px-5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* 기간 */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-medium">기간</span>
          <input
            type="date"
            value={toDateInput(filters.from)}
            onChange={(e) => set("from", fromDateInput(e.target.value))}
            className={inputCls}
          />
          <span className="text-slate-400 text-xs">~</span>
          <input
            type="date"
            value={toDateInput(filters.to)}
            onChange={(e) => set("to", fromDateInput(e.target.value))}
            className={inputCls}
          />
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* 팀 */}
        <select value={filters.team} onChange={(e) => set("team", e.target.value)} className={inputCls}>
          <option value="">전체 팀</option>
          {teamList.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* 담당자 */}
        <select value={filters.staff} onChange={(e) => set("staff", e.target.value)} className={inputCls}>
          <option value="">전체 담당자</option>
          {staffList.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* 유종 (대분류) */}
        <select
          value={filters.category}
          onChange={(e) => set("category", e.target.value as Filters["category"])}
          className={inputCls}
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
          className={`${inputCls} w-32 placeholder-slate-400`}
        />

        {/* 거래처 검색 */}
        <input
          type="text"
          placeholder="거래처 검색"
          value={filters.customer}
          onChange={(e) => set("customer", e.target.value)}
          className={`${inputCls} w-32 placeholder-slate-400`}
        />

        {/* 초기화 */}
        {hasNonDateFilter && (
          <button
            onClick={() =>
              setFilters({
                from: filters.from,
                to: filters.to,
                staff: "",
                team: "",
                category: "",
                product: "",
                customer: "",
              })
            }
            className="text-[11px] text-slate-500 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            ✕ 필터 초기화
          </button>
        )}

        {/* 기간 초기화 */}
        <button
          onClick={() => setFilters({ ...filters, from: "20230101", to: todayYmd() })}
          className="text-[11px] text-slate-500 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition ml-auto"
        >
          기간 전체
        </button>
      </div>
    </div>
  );
}
