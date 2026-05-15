"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui";
import ScmFilterBar from "@/components/scm/ScmFilterBar";
import ScmBadge from "@/components/scm/ScmBadge";
import { mockProducts } from "@/lib/scm-mock-data";
import { fmt } from "@/lib/format";
import type { Product } from "@/lib/scm-types";

type DetailTab = "기본정보" | "사양" | "문서" | "원가이력";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Product | null>(mockProducts[0]);
  const [detailTab, setDetailTab] = useState<DetailTab>("기본정보");

  const filtered = useMemo(() => {
    return mockProducts.filter((p) => {
      if (search && !`${p.name}${p.code}${p.barcode}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      return true;
    });
  }, [search, categoryFilter, statusFilter]);

  const categories = [...new Set(mockProducts.map((p) => p.category))];
  const statuses = [...new Set(mockProducts.map((p) => p.status))];

  return (
    <div className="space-y-6">
      <PageHeader title="상품마스터" subtitle="완제품 마스터 — 호수/색상별 단위 관리" />

      <ScmFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="상품명/품번/바코드 검색"
        filters={
          <>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700">
              <option value="">전체 카테고리</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700">
              <option value="">전체 상태</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </>
        }
        actions={
          <>
            <button onClick={() => console.log("추가")} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">+ 추가</button>
            <button onClick={() => console.log("엑셀 다운로드")} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">엑셀↓</button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측 테이블 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 font-medium">통합품번</th>
                  <th className="text-left px-4 py-2.5 font-medium">상품명</th>
                  <th className="text-left px-4 py-2.5 font-medium">상태</th>
                  <th className="text-right px-4 py-2.5 font-medium">원가</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => { setSelected(p); setDetailTab("기본정보"); }}
                    className={`border-b border-slate-100 cursor-pointer transition ${selected?.id === p.id ? "bg-blue-50" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{p.code}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{p.name}</td>
                    <td className="px-4 py-2.5"><ScmBadge label={p.status} /></td>
                    <td className="px-4 py-2.5 text-right text-slate-600">₩{fmt(p.unitCost)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">결과 없음</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 우측 상세 패널 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          {selected ? (
            <>
              <h3 className="text-base font-bold text-slate-900 mb-1">{selected.name}</h3>
              <p className="text-xs text-slate-500 mb-4">{selected.code} · {selected.barcode}</p>

              <div className="flex gap-1 border-b border-slate-200 mb-4">
                {(["기본정보", "사양", "문서", "원가이력"] as DetailTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${detailTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {detailTab === "기본정보" && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <Detail label="카테고리" value={selected.category} />
                  <Detail label="시리즈" value={selected.series} />
                  <Detail label="제조사" value={selected.manufacturer} />
                  <Detail label="호수/색상" value={selected.variant} />
                  <Detail label="상태" value={selected.status} />
                  <Detail label="원가" value={`₩${fmt(selected.unitCost)}`} />
                  <div className="col-span-2">
                    <Detail label="메모" value={selected.memo || "—"} />
                  </div>
                </div>
              )}

              {detailTab === "사양" && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <Detail label="박스 (W×H×D)" value={selected.boxWidth ? `${selected.boxWidth}×${selected.boxHeight}×${selected.boxDepth} mm` : "—"} />
                  <Detail label="무게" value={selected.weight ? `${selected.weight}g` : "—"} />
                  <Detail label="용적" value={selected.volume ? `${selected.volume}ml` : "—"} />
                  <Detail label="출시일" value={selected.launchDate || "—"} />
                </div>
              )}

              {detailTab === "문서" && (
                <div className="space-y-2">
                  {(selected.documents || []).length > 0 ? selected.documents!.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                        <p className="text-[11px] text-slate-400">{doc.type} · {doc.date}</p>
                      </div>
                      <button onClick={() => console.log("다운로드", doc.name)} className="text-xs text-blue-500 hover:underline">다운</button>
                    </div>
                  )) : <p className="text-sm text-slate-400 py-4 text-center">첨부 문서 없음</p>}
                </div>
              )}

              {detailTab === "원가이력" && (
                <div className="space-y-2">
                  {(selected.costHistory || []).map((h, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">₩{fmt(h.cost)}</p>
                        <p className="text-[11px] text-slate-400">{h.reason}</p>
                      </div>
                      <span className="text-xs text-slate-500">{h.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">좌측에서 상품을 선택하세요</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500 mb-0.5">{label}</p>
      <p className="text-slate-900 font-medium">{value}</p>
    </div>
  );
}
