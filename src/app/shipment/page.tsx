"use client";

import { useData } from "@/lib/dataContext";
import { fmt, fmtKrw } from "@/lib/format";
import { PageHeader, ChartCard, LoadingState, ErrorState } from "@/components/ui";
import KpiCard from "@/components/KpiCard";
import { useMemo, useState } from "react";

export default function ShipmentPage() {
  const { filtered, loading, error, reload } = useData();
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(50);

  const rows = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      const da = a.saleDate.replace(/[^0-9]/g, "");
      const db = b.saleDate.replace(/[^0-9]/g, "");
      return db.localeCompare(da);
    });
    const q = query.trim().toLowerCase();
    return q
      ? sorted.filter((r) =>
          r.customer.toLowerCase().includes(q) ||
          r.product.toLowerCase().includes(q) ||
          r.staff.toLowerCase().includes(q)
        )
      : sorted;
  }, [filtered, query]);

  const totalAmt = useMemo(() => filtered.reduce((s, r) => s + r.supplyAmount + r.taxAmount, 0), [filtered]);
  const totalQty = useMemo(() => filtered.reduce((s, r) => s + r.quantity, 0), [filtered]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader title="출고 현황" subtitle="전체 출고 거래 내역" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="총 출고건" value={fmt(filtered.length)} unit="건" icon="📋" />
        <KpiCard label="총 수량" value={fmt(totalQty)} unit="개" icon="📦" />
        <KpiCard label="총 매출" value={fmtKrw(totalAmt)} icon="💰" />
        <KpiCard label="거래처" value={fmt(new Set(filtered.map((r) => r.customer)).size)} unit="곳" icon="🏢" />
      </div>

      <ChartCard title="출고 내역" subtitle={`${fmt(rows.length)}건 · 최신순`}>
        <input
          type="text"
          placeholder="거래처/품목/담당자 검색"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setLimit(50); }}
          className="mb-4 w-full md:w-80 bg-[#111827] border border-white/10 text-gray-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">일자</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">담당</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">거래처</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">품목</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">수량</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">금액</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((r, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-2 text-xs text-gray-400 whitespace-nowrap">{r.saleDate}</td>
                  <td className="py-2 px-2 text-xs text-gray-300">{r.staff}</td>
                  <td className="py-2 px-2 text-xs text-white max-w-[140px] truncate">{r.customer}</td>
                  <td className="py-2 px-2 text-xs text-gray-300 max-w-[160px] truncate">{r.product}</td>
                  <td className="py-2 px-2 text-xs text-gray-300 text-right">{fmt(r.quantity)}</td>
                  <td className="py-2 px-2 text-xs text-blue-400 font-medium text-right whitespace-nowrap">
                    {fmt(r.supplyAmount + r.taxAmount)}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > limit && (
          <div className="text-center mt-4">
            <button
              onClick={() => setLimit(limit + 50)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-lg"
            >
              더 보기 ({fmt(rows.length - limit)}건 남음)
            </button>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
