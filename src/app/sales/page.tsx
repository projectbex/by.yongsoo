"use client";

import { useEffect, useState, useCallback } from "react";

interface Sale {
  id: string;
  saleType: string | null;
  saleDate: string | null;
  weekNumber: number | null;
  quantity: number;
  unitPrice: number;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  staff: { name: string } | null;
  customer: { name: string } | null;
  product: { name: string; code: string | null } | null;
}

function formatNumber(num: number) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(num));
}

const inputClass = "border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [month, setMonth] = useState("");
  const [week, setWeek] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  const loadSales = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (month) params.set("month", month);
    if (week) params.set("week", week);
    if (search) params.set("search", search);
    const res = await fetch(`/api/sales?${params}`);
    const data = await res.json();
    setSales(data.sales);
    setTotal(data.total);
  }, [page, month, week, search]);

  useEffect(() => { loadSales(); }, [loadSales]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">출고현황</h1>
          <p className="text-xs text-gray-400 mt-0.5">전체 출고 데이터 조회</p>
        </div>
        <span className="text-sm text-gray-500">총 <span className="text-blue-600 font-semibold">{formatNumber(total)}</span>건</span>
      </div>

      {/* 필터 */}
      <div className="flex gap-3 mb-4 items-end">
        <div>
          <label className="block text-[11px] text-gray-400 mb-1">월</label>
          <input type="month" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} className={inputClass} />
        </div>
        <div>
          <label className="block text-[11px] text-gray-400 mb-1">주차</label>
          <select value={week} onChange={(e) => { setWeek(e.target.value); setPage(1); }} className={inputClass}>
            <option value="">전체</option>
            <option value="1">1주차</option>
            <option value="2">2주차</option>
            <option value="3">3주차</option>
            <option value="4">4주차</option>
            <option value="5">5주차</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-gray-400 mb-1">검색</label>
          <input type="text" placeholder="상품명, 거래처명..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={inputClass + " w-56"} />
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-xs whitespace-nowrap">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100 bg-gray-50">
              <th className="text-left py-3 px-3">거래일자</th>
              <th className="text-left py-3 px-3">주차</th>
              <th className="text-left py-3 px-3">담당자</th>
              <th className="text-left py-3 px-3">거래처</th>
              <th className="text-left py-3 px-3">품목코드</th>
              <th className="text-left py-3 px-3">상품명</th>
              <th className="text-left py-3 px-3">구분</th>
              <th className="text-right py-3 px-3">수량</th>
              <th className="text-right py-3 px-3">단가</th>
              <th className="text-right py-3 px-3">공급가액</th>
              <th className="text-right py-3 px-3">부가세</th>
              <th className="text-right py-3 px-3">합계</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5 px-3 text-gray-400">{s.saleDate ? new Date(s.saleDate).toLocaleDateString("ko-KR") : "-"}</td>
                <td className="py-2.5 px-3 text-gray-500">{s.weekNumber ? s.weekNumber + "주" : "-"}</td>
                <td className="py-2.5 px-3 text-gray-700">{s.staff?.name || "-"}</td>
                <td className="py-2.5 px-3 text-gray-700">{s.customer?.name || "-"}</td>
                <td className="py-2.5 px-3 text-gray-400">{s.product?.code || "-"}</td>
                <td className="py-2.5 px-3 text-gray-900 font-medium">{s.product?.name || "-"}</td>
                <td className="py-2.5 px-3 text-gray-500">{s.saleType || "-"}</td>
                <td className="py-2.5 px-3 text-right text-gray-500">{formatNumber(s.quantity)}</td>
                <td className="py-2.5 px-3 text-right text-gray-500">{formatNumber(s.unitPrice)}</td>
                <td className="py-2.5 px-3 text-right text-gray-500">{formatNumber(s.supplyAmount)}</td>
                <td className="py-2.5 px-3 text-right text-gray-500">{formatNumber(s.taxAmount)}</td>
                <td className="py-2.5 px-3 text-right text-green-600 font-medium">{formatNumber(s.totalAmount)}</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={12} className="text-center py-10 text-gray-400">데이터가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded text-xs bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30">이전</button>
          <span className="px-3 py-1 text-xs text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded text-xs bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30">다음</button>
        </div>
      )}
    </div>
  );
}
