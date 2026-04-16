"use client";

import { useData } from "@/lib/dataContext";
import { fmt, fmtKrw } from "@/lib/format";
import { PageHeader, ChartCard, LoadingState, ErrorState } from "@/components/ui";
import { useMemo, useState } from "react";

export default function CustomerPage() {
  const { filtered, loading, error, reload } = useData();
  const [query, setQuery] = useState("");

  const data = useMemo(() => {
    const m = new Map<string, { amt: number; qty: number; count: number; team: string }>();
    filtered.forEach((r) => {
      const e = m.get(r.customer) || { amt: 0, qty: 0, count: 0, team: r.team };
      e.amt += r.revenue;
      e.qty += r.quantity;
      e.count += 1;
      m.set(r.customer, e);
    });
    const rows = [...m.entries()]
      .map(([name, v]) => ({
        name,
        ...v,
      }))
      .sort((a, b) => b.amt - a.amt);
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;
  }, [filtered, query]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader title="거래처 분석" subtitle={`총 ${data.length}곳`} />

      <ChartCard title="거래처 리스트" subtitle="매출 순 정렬">
        <input
          type="text"
          placeholder="거래처명 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-4 w-full md:w-80 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">#</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">거래처</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">팀</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">매출</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">수량</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">건수</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={r.name} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-2 text-xs text-slate-500">{i + 1}</td>
                  <td className="py-2 px-2 text-xs text-slate-900 font-medium max-w-[180px] truncate">{r.name}</td>
                  <td className="py-2 px-2 text-xs text-slate-500">{r.team || "-"}</td>
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
