"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import ScmFilterBar from "@/components/scm/ScmFilterBar";
import ScmBadge from "@/components/scm/ScmBadge";
import { mockPurchaseOrders } from "@/lib/scm-mock-data";
import { fmt } from "@/lib/format";

export default function PurchaseOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");

  const filtered = useMemo(() => {
    return mockPurchaseOrders.filter((po) => {
      if (statusFilter && po.status !== statusFilter) return false;
      if (vendorFilter && po.vendorName !== vendorFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!po.poNumber.toLowerCase().includes(q) && !po.vendorName.toLowerCase().includes(q) && !po.items.some((i) => i.itemName.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [search, statusFilter, vendorFilter]);

  const vendors = [...new Set(mockPurchaseOrders.map((p) => p.vendorName))];

  return (
    <div className="space-y-6">
      <PageHeader title="발주 관리" subtitle="발주서 작성·이력 관리·입고 기록" />

      <ScmFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="PO번호/거래처/품목 검색"
        filters={
          <>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700">
              <option value="">전체 상태</option>
              <option value="진행">진행</option>
              <option value="종결">종결</option>
              <option value="취소">취소</option>
              <option value="잔량">잔량</option>
            </select>
            <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700">
              <option value="">전체 거래처</option>
              {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </>
        }
        actions={
          <>
            <Link href="/scm/purchase-orders/new" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 inline-block">+ 신규 발주</Link>
            <button onClick={() => console.log("엑셀 다운로드")} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">엑셀↓</button>
          </>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 font-medium">PO번호</th>
                <th className="text-left px-4 py-2.5 font-medium">발주일</th>
                <th className="text-left px-4 py-2.5 font-medium">거래처</th>
                <th className="text-left px-4 py-2.5 font-medium">품목명</th>
                <th className="text-right px-4 py-2.5 font-medium">수량</th>
                <th className="text-right px-4 py-2.5 font-medium">단가</th>
                <th className="text-right px-4 py-2.5 font-medium">합계</th>
                <th className="text-left px-4 py-2.5 font-medium">납기</th>
                <th className="text-center px-4 py-2.5 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.flatMap((po) =>
                po.items.map((item, idx) => (
                  <tr key={`${po.id}-${item.id}`} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      {idx === 0 ? (
                        <Link href={`/scm/purchase-orders/${po.id}`} className="text-blue-600 hover:underline font-mono text-xs">
                          {po.poNumber}
                        </Link>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">{idx === 0 ? po.orderDate : ""}</td>
                    <td className="px-4 py-2.5 text-slate-700">{idx === 0 ? po.vendorName : ""}</td>
                    <td className="px-4 py-2.5 text-slate-900">{item.itemName}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{fmt(item.quantity)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">₩{fmt(item.unitPrice)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900">₩{fmt(item.total)}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{item.dueDate}</td>
                    <td className="px-4 py-2.5 text-center"><ScmBadge label={item.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center">결과 없음</p>
        )}
      </div>
    </div>
  );
}
