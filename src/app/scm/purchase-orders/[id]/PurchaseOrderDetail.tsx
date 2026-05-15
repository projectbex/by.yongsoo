"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui";
import ScmBadge from "@/components/scm/ScmBadge";
import { mockPurchaseOrders } from "@/lib/scm-mock-data";
import { fmt } from "@/lib/format";

export default function PurchaseOrderDetail() {
  const params = useParams();
  const po = mockPurchaseOrders.find((p) => p.id === params.id);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (!po) {
    return (
      <div className="space-y-6">
        <PageHeader title="발주서 상세" />
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">발주서를 찾을 수 없습니다.</p>
          <Link href="/scm/purchase-orders" className="text-blue-500 hover:underline text-sm mt-2 inline-block">← 목록으로</Link>
        </div>
      </div>
    );
  }

  const grandTotal = po.items.reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/scm/purchase-orders" className="text-sm text-blue-500 hover:underline">← 목록</Link>
        <h1 className="text-xl font-bold text-slate-900">{po.poNumber}</h1>
        <ScmBadge label={po.status} />
        <div className="flex-1" />
        <button onClick={() => console.log("수정")} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">수정</button>
        <button onClick={() => console.log("삭제")} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">삭제</button>
        <button onClick={() => console.log("PDF 다운로드")} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">PDF</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">발주 정보</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-[11px] text-slate-500">거래처</p>
              <p className="text-slate-900 font-medium">{po.vendorName}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">발주일</p>
              <p className="text-slate-900 font-medium">{po.orderDate}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">납품장소</p>
              <p className="text-slate-900 font-medium">{po.deliveryLocation}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">메모</p>
              <p className="text-slate-900 font-medium">{po.memo || "—"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">거래처 정보</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-[11px] text-slate-500">담당자</p>
              <p className="text-slate-900 font-medium">{po.vendorContact}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">품목</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200">
              <th className="w-10 px-4 py-2.5" />
              <th className="text-center px-3 py-2.5 font-medium">#</th>
              <th className="text-left px-3 py-2.5 font-medium">종류</th>
              <th className="text-left px-3 py-2.5 font-medium">품목명</th>
              <th className="text-right px-3 py-2.5 font-medium">수량</th>
              <th className="text-right px-3 py-2.5 font-medium">단가</th>
              <th className="text-right px-3 py-2.5 font-medium">합계</th>
              <th className="text-center px-3 py-2.5 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((item, idx) => {
              const isOpen = expandedItems.has(item.id);
              const inboundTotal = item.inbounds.reduce((s, ib) => s + ib.quantity, 0);
              return (
                <tr key={item.id} className="border-b border-slate-100">
                  <td colSpan={8} className="p-0">
                    <table className="w-full">
                      <tbody>
                        <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => toggleItem(item.id)}>
                          <td className="w-10 px-4 py-2.5 text-slate-400">{isOpen ? "▼" : "▶"}</td>
                          <td className="px-3 py-2.5 text-center text-slate-500">{idx + 1}</td>
                          <td className="px-3 py-2.5"><ScmBadge label={item.type} /></td>
                          <td className="px-3 py-2.5 font-medium text-slate-900">{item.itemName}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">{fmt(item.quantity)}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">₩{fmt(item.unitPrice)}</td>
                          <td className="px-3 py-2.5 text-right font-medium text-slate-900">₩{fmt(item.total)}</td>
                          <td className="px-3 py-2.5 text-center"><ScmBadge label={item.status} /></td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={8} className="px-8 py-3">
                              <p className="text-xs text-slate-500 mb-2">입고 기록 ({inboundTotal}/{item.quantity})</p>
                              {item.inbounds.length > 0 ? (
                                <div className="space-y-1">
                                  {item.inbounds.map((ib) => (
                                    <div key={ib.id} className="flex items-center gap-3 text-xs bg-white rounded-lg px-3 py-2 border border-slate-200">
                                      <span className="text-slate-700">{ib.date}</span>
                                      <span className="font-medium text-slate-900">입고 {fmt(ib.quantity)}개</span>
                                      <span className="text-slate-400">({ib.recorder})</span>
                                      <button onClick={(e) => { e.stopPropagation(); console.log("삭제", ib.id); }} className="text-red-400 hover:text-red-600 ml-auto">✕</button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400">입고 기록 없음</p>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); console.log("입고 추가", item.id); }} className="mt-2 text-xs text-blue-500 hover:underline">+ 입고 추가</button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td colSpan={6} className="px-4 py-3 text-right text-sm font-semibold text-slate-900">합계</td>
              <td className="px-3 py-3 text-right text-base font-bold text-blue-600">₩{fmt(grandTotal)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
