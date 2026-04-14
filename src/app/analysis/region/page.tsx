"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useData } from "@/lib/dataContext";
import { toBroadRegion } from "@/lib/sheets";
import { fmt, fmtKrw } from "@/lib/format";
import { PageHeader, ChartCard, LoadingState, ErrorState, CHART_COLORS, TOOLTIP_STYLE } from "@/components/ui";
import { useMemo } from "react";

export default function RegionAnalysisPage() {
  const { filtered, customerMap, loading, error, reload } = useData();

  const { broad, detail } = useMemo(() => {
    const broadMap = new Map<string, number>();
    const detailMap = new Map<string, { amt: number; qty: number; count: number }>();
    filtered.forEach((r) => {
      const info = customerMap.get(r.customer);
      const region = info?.region || "기타";
      const b = toBroadRegion(region);
      const amt = r.supplyAmount + r.taxAmount;
      broadMap.set(b, (broadMap.get(b) || 0) + amt);
      const e = detailMap.get(region) || { amt: 0, qty: 0, count: 0 };
      e.amt += amt;
      e.qty += r.quantity;
      e.count += 1;
      detailMap.set(region, e);
    });
    return {
      broad: [...broadMap.entries()].sort((a, b) => b[1] - a[1]).map(([name, amt]) => ({
        name, 금액: Math.round(amt / 10000), amt,
      })),
      detail: [...detailMap.entries()].sort((a, b) => b[1].amt - a[1].amt).map(([name, v]) => ({ name, ...v })),
    };
  }, [filtered, customerMap]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader title="지역별 분석" subtitle="광역 / 상세 지역별 매출" />

      <ChartCard title="광역 지역별 매출" subtitle="단위: 만원">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={broad}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" tick={{ fill: "#d1d5db", fontSize: 11 }} axisLine={false} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickFormatter={(v) => fmt(v)} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(Number(v)) + "만원", "매출"]} />
            <Bar dataKey="금액" radius={[6, 6, 0, 0]}>
              {broad.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="상세 지역별 매출" subtitle={`총 ${detail.length}개 지역`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">지역</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">매출</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">수량</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">건수</th>
              </tr>
            </thead>
            <tbody>
              {detail.map((r) => (
                <tr key={r.name} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-2 text-xs text-white">{r.name}</td>
                  <td className="py-2 px-2 text-xs text-blue-400 text-right whitespace-nowrap">{fmtKrw(r.amt)}</td>
                  <td className="py-2 px-2 text-xs text-gray-300 text-right">{fmt(r.qty)}</td>
                  <td className="py-2 px-2 text-xs text-gray-400 text-right">{fmt(r.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
