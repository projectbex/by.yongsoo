"use client";

import { useData } from "@/lib/dataContext";
import { fmt, fmtKrw } from "@/lib/format";
import { PageHeader, ChartCard, LoadingState, ErrorState } from "@/components/ui";
import { useMemo, useState } from "react";

export default function CustomerPage() {
  const { filtered, customerMap, loading, error, reload } = useData();
  const [query, setQuery] = useState("");

  const data = useMemo(() => {
    const m = new Map<string, { amt: number; qty: number; count: number }>();
    filtered.forEach((r) => {
      const e = m.get(r.customer) || { amt: 0, qty: 0, count: 0 };
      e.amt += r.supplyAmount + r.taxAmount;
      e.qty += r.quantity;
      e.count += 1;
      m.set(r.customer, e);
    });
    const rows = [...m.entries()]
      .map(([name, v]) => {
        const info = customerMap.get(name);
        return {
          name,
          ...v,
          staff: info?.staff || "-",
          team: info?.team || "-",
          region: info?.region || "-",
          grade: info?.grade || "-",
        };
      })
      .sort((a, b) => b.amt - a.amt);
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;
  }, [filtered, customerMap, query]);

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
          className="mb-4 w-full md:w-80 bg-[#111827] border border-white/10 text-gray-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">거래처</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">담당</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">지역</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">등급</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">매출</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">수량</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">건수</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={r.name} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-2 text-xs text-gray-500">{i + 1}</td>
                  <td className="py-2 px-2 text-xs text-white font-medium max-w-[180px] truncate">{r.name}</td>
                  <td className="py-2 px-2 text-xs text-gray-400">{r.staff}</td>
                  <td className="py-2 px-2 text-xs text-gray-400">{r.region}</td>
                  <td className="py-2 px-2 text-xs text-emerald-400">{r.grade}</td>
                  <td className="py-2 px-2 text-xs text-blue-400 text-right whitespace-nowrap">{fmtKrw(r.amt)}</td>
                  <td className="py-2 px-2 text-xs text-gray-300 text-right">{fmt(r.qty)}</td>
                  <td className="py-2 px-2 text-xs text-gray-500 text-right">{fmt(r.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
