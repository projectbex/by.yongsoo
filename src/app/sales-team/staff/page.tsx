"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useData } from "@/lib/dataContext";
import { fmt, fmtKrw } from "@/lib/format";
import { PageHeader, ChartCard, LoadingState, ErrorState, CHART_COLORS, TOOLTIP_STYLE } from "@/components/ui";
import { useMemo } from "react";

export default function TeamPerformancePage() {
  const { filtered, loading, error, reload } = useData();

  const data = useMemo(() => {
    const m = new Map<string, { amt: number; qty: number; count: number; customers: Set<string> }>();
    filtered.forEach((r) => {
      const team = r.team || "미지정";
      const e = m.get(team) || { amt: 0, qty: 0, count: 0, customers: new Set<string>() };
      e.amt += r.revenue;
      e.qty += r.quantity;
      e.count += 1;
      e.customers.add(r.customer);
      m.set(team, e);
    });
    return [...m.entries()]
      .sort((a, b) => b[1].amt - a[1].amt)
      .map(([name, v]) => ({
        name,
        금액: Math.round(v.amt / 10000),
        amt: v.amt,
        qty: v.qty,
        count: v.count,
        custCount: v.customers.size,
      }));
  }, [filtered]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader title="팀별 성과" subtitle={`총 ${data.length}개 팀`} />

      <ChartCard title="팀별 매출" subtitle="단위: 만원">
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickFormatter={(v) => fmt(v)} />
            <YAxis type="category" dataKey="name" tick={{ fill: "#0F172A", fontSize: 12 }} axisLine={false} width={80} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(Number(v)) + "만원", "매출"]} />
            <Bar dataKey="금액" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="팀별 상세" subtitle="매출 · 수량 · 건수 · 거래처">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">#</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">팀</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">매출</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">수량</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">건수</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">거래처</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={r.name} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-2 text-xs text-slate-500">{i + 1}</td>
                  <td className="py-2 px-2 text-xs text-slate-900 font-medium">{r.name}</td>
                  <td className="py-2 px-2 text-xs text-blue-600 text-right whitespace-nowrap">{fmtKrw(r.amt)}</td>
                  <td className="py-2 px-2 text-xs text-slate-700 text-right">{fmt(r.qty)}</td>
                  <td className="py-2 px-2 text-xs text-slate-500 text-right">{fmt(r.count)}</td>
                  <td className="py-2 px-2 text-xs text-emerald-600 text-right">{r.custCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
