"use client";

import { useEffect, useState } from "react";
import { fetchSheet, parseSalesSheet, SaleRow } from "@/lib/sheets";

function fmt(n: number) { return new Intl.NumberFormat("ko-KR").format(Math.round(n)); }

export default function SalesPage() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const PER_PAGE = 30;

  useEffect(() => {
    (async () => {
      try {
        const rows = await fetchSheet("매출데이터");
        setSales(parseSalesSheet(rows));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const filtered = sales.filter(s =>
    !search || s.customer.includes(search) || s.staff.includes(search) || s.product.includes(search)
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="inline-block w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">출고 현황</h1>
          <p className="text-xs text-gray-400 mt-0.5">전체 출고 내역 조회 ({fmt(filtered.length)}건)</p>
        </div>
        <input
          type="text" placeholder="검색 (거래처, 담당자, 품목)"
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">일자</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">담당자</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">거래처</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">품목</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">구분</th>
                <th className="text-right py-3 px-4 text-gray-600 font-medium">수량</th>
                <th className="text-right py-3 px-4 text-gray-600 font-medium">공급가</th>
                <th className="text-right py-3 px-4 text-gray-600 font-medium">합계</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((s, i) => (
                <tr key={i} className={`border-b border-gray-50 hover:bg-blue-50/30 transition ${i % 2 ? "bg-gray-50/30" : ""}`}>
                  <td className="py-2.5 px-4 text-gray-500 text-xs">{s.saleDate}</td>
                  <td className="py-2.5 px-4 text-gray-700">{s.staff}</td>
                  <td className="py-2.5 px-4 text-gray-700 truncate max-w-[180px]">{s.customer}</td>
                  <td className="py-2.5 px-4 text-gray-700 truncate max-w-[160px]">{s.product}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${s.saleType === "매출" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {s.saleType}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-gray-600">{fmt(s.quantity)}</td>
                  <td className="py-2.5 px-4 text-right text-gray-600">{fmt(s.supplyAmount)}</td>
                  <td className="py-2.5 px-4 text-right font-medium text-gray-800">{fmt(s.supplyAmount + s.taxAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 disabled:opacity-40">이전</button>
            <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 disabled:opacity-40">다음</button>
          </div>
        )}
      </div>
    </div>
  );
}
