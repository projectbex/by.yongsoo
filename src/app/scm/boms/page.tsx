"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui";
import ScmFilterBar from "@/components/scm/ScmFilterBar";
import ScmBadge from "@/components/scm/ScmBadge";
import { mockBoms } from "@/lib/scm-mock-data";
import { fmt } from "@/lib/format";

export default function BomsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return mockBoms;
    const q = search.toLowerCase();
    return mockBoms.filter((b) => b.productName.toLowerCase().includes(q) || b.productCode.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="space-y-6">
      <PageHeader title="BOM 관리" subtitle="제품 × 부자재 구성 관리 + MOQ별 단가" />

      <ScmFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="상품 검색"
        actions={
          <>
            <button onClick={() => console.log("신규 BOM")} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">+ 신규 BOM</button>
            <button onClick={() => console.log("엑셀 다운로드")} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">엑셀↓</button>
          </>
        }
      />

      <div className="space-y-4">
        {filtered.map((bom) => (
          <div key={bom.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">{bom.productName}</h3>
              <span className="text-xs text-slate-400 font-mono">{bom.productCode}</span>
            </div>

            {bom.versions.map((ver) => (
              <div key={ver.id} className={`mb-3 rounded-xl border ${ver.active ? "border-blue-200 bg-blue-50/30" : "border-slate-200 bg-slate-50/50"} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-slate-900">{ver.version}</span>
                  {ver.active ? (
                    <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">★ 활성</span>
                  ) : (
                    <ScmBadge label="비활성" />
                  )}
                  <span className="text-[11px] text-slate-400 ml-2">
                    MOQ: {ver.moqLevels.map((m) => fmt(m)).join(" / ")}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] text-slate-500 border-b border-slate-200">
                        <th className="text-left px-3 py-1.5 font-medium">부자재명</th>
                        <th className="text-left px-3 py-1.5 font-medium">업체</th>
                        <th className="text-left px-3 py-1.5 font-medium">사양</th>
                        <th className="text-right px-3 py-1.5 font-medium">소요량</th>
                        {ver.moqLevels.map((m) => (
                          <th key={m} className="text-right px-3 py-1.5 font-medium">{fmt(m)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ver.items.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="px-3 py-2 text-slate-900">{item.materialName}</td>
                          <td className="px-3 py-2 text-slate-600">{item.vendorName}</td>
                          <td className="px-3 py-2 text-slate-500 text-xs">{item.spec}</td>
                          <td className="px-3 py-2 text-right text-slate-600">{item.quantity}</td>
                          {ver.moqLevels.map((m) => (
                            <td key={m} className="px-3 py-2 text-right text-slate-700">₩{fmt(item.moqPrices[String(m)] || 0)}</td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-semibold">
                        <td className="px-3 py-2 text-slate-900" colSpan={3}>합계</td>
                        <td className="px-3 py-2" />
                        {ver.moqLevels.map((m) => {
                          const total = ver.items.reduce((s, item) => s + (item.moqPrices[String(m)] || 0) * item.quantity, 0);
                          return <td key={m} className="px-3 py-2 text-right text-slate-900">₩{fmt(total)}</td>;
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center bg-white rounded-2xl border border-slate-200">결과 없음</p>
        )}
      </div>
    </div>
  );
}
