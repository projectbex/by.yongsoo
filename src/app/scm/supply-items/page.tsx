"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui";
import ScmFilterBar from "@/components/scm/ScmFilterBar";
import ScmBadge from "@/components/scm/ScmBadge";
import { mockSupplyItems } from "@/lib/scm-mock-data";
import { fmt } from "@/lib/format";

export default function SupplyItemsPage() {
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const filtered = useMemo(() => {
    return mockSupplyItems.filter((s) => {
      if (!showInactive && !s.active) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, showInactive]);

  return (
    <div className="space-y-6">
      <PageHeader title="소모품" subtitle="택배박스·포장재 등 BOM 외 직접 발주 품목" />

      <ScmFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="품목명 검색"
        filters={
          <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded border-slate-300" />
            비활성 포함
          </label>
        }
        actions={
          <>
            <button onClick={() => console.log("추가")} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">+ 추가</button>
            <button onClick={() => console.log("엑셀 다운로드")} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">엑셀↓</button>
          </>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 font-medium">품목명</th>
              <th className="text-left px-4 py-2.5 font-medium">카테고리</th>
              <th className="text-left px-4 py-2.5 font-medium">업체</th>
              <th className="text-center px-4 py-2.5 font-medium">단위</th>
              <th className="text-right px-4 py-2.5 font-medium">단가</th>
              <th className="text-left px-4 py-2.5 font-medium">메모</th>
              <th className="text-center px-4 py-2.5 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-2.5 text-slate-600">{s.category}</td>
                <td className="px-4 py-2.5 text-slate-600">{s.vendorName}</td>
                <td className="px-4 py-2.5 text-center text-slate-500">{s.unit}</td>
                <td className="px-4 py-2.5 text-right text-slate-700">₩{fmt(s.unitPrice)}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs max-w-[200px] truncate">{s.memo}</td>
                <td className="px-4 py-2.5 text-center"><ScmBadge label={s.active ? "활성" : "비활성"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center">결과 없음</p>
        )}
      </div>
    </div>
  );
}
