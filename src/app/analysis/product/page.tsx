"use client";

import { useData } from "@/lib/dataContext";
import { fmt, fmtKrw } from "@/lib/format";
import { PageHeader, ChartCard, LoadingState, ErrorState } from "@/components/ui";
import { useMemo, useState } from "react";

type SortKey = "amt" | "qty" | "count";

export default function ProductAnalysisPage() {
  const { filtered, loading, error, reload } = useData();
  const [sortKey, setSortKey] = useState<SortKey>("amt");

  const data = useMemo(() => {
    const m = new Map<string, { amt: number; qty: number; count: number }>();
    filtered.forEach((r) => {
      const e = m.get(r.product) || { amt: 0, qty: 0, count: 0 };
      e.amt += r.supplyAmount + r.taxAmount;
      e.qty += r.quantity;
      e.count += 1;
      m.set(r.product, e);
    });
    return [...m.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b[sortKey] - a[sortKey]);
  }, [filtered, sortKey]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const sortBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => setSortKey(key)}
      className={`text-xs px-3 py-1 rounded-md transition ${
        sortKey === key ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader title="품목별 분석" subtitle={`총 ${data.length}개 품목`} />

      <ChartCard title="품목 순위" subtitle="정렬 기준 선택">
        <div className="flex gap-2 mb-4">
          {sortBtn("amt", "매출액")}
          {sortBtn("qty", "수량")}
          {sortBtn("count", "건수")}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">#</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">품목</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">매출</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">수량</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">건수</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={r.name} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-2 text-xs text-slate-500">{i + 1}</td>
                  <td className="py-2 px-2 text-xs text-slate-900 max-w-[240px] truncate">{r.name}</td>
                  <td className="py-2 px-2 text-xs text-blue-600 text-right whitespace-nowrap">{fmtKrw(r.amt)}</td>
                  <td className="py-2 px-2 text-xs text-slate-700 text-right">{fmt(r.qty)}</td>
                  <td className="py-2 px-2 text-xs text-slate-500 text-right">{fmt(r.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
