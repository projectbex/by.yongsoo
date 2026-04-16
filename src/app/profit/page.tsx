"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useData } from "@/lib/dataContext";
import {
  PageHeader, ChartCard, LoadingState, ErrorState, Tabs,
  TOOLTIP_STYLE, AXIS_STYLE, GRID_STROKE, CHART_COLORS,
} from "@/components/ui";
import KpiCard from "@/components/KpiCard";
import { fmt, fmtKrw, fmtPct, fmtPctOrNull } from "@/lib/format";
import { revenue, profit as sumProfit, marginPct, yoy, shiftYearBack, inRange, sumTargetProfit, achievement } from "@/lib/kpi";
import { summarizeProfit, type ProfitGroupKey } from "@/lib/profit";

type TabId = ProfitGroupKey;

const TABS: { id: TabId; label: string }[] = [
  { id: "category", label: "유종별" },
  { id: "team", label: "팀별" },
  { id: "customer", label: "거래처별" },
];

export default function ProfitPage() {
  const { sales, filtered, targets, filters, loading, error, reload } = useData();
  const [tab, setTab] = useState<TabId>("category");

  const top = useMemo(() => {
    const rev = revenue(filtered);
    const prf = sumProfit(filtered);
    const mp = marginPct(prf, rev);

    const prev = shiftYearBack(filters.from, filters.to);
    const prv = sales.filter((p) => inRange(p.date, prev.from, prev.to));
    const prevRev = revenue(prv);
    const prevPrf = sumProfit(prv);

    const targetProfit = sumTargetProfit(targets, filters.from, filters.to);
    const ach = achievement(prf, targetProfit);

    return {
      rev, prf, mp,
      yoyRev: yoy(rev, prevRev),
      yoyPrf: yoy(prf, prevPrf),
      targetProfit,
      ach,
    };
  }, [sales, filtered, targets, filters.from, filters.to]);

  const summary = useMemo(() => summarizeProfit({
    rows: sales,
    targets,
    from: filters.from,
    to: filters.to,
    group: tab,
  }), [sales, targets, filters.from, filters.to, tab]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="영업이익 분석"
        subtitle="유종 / 팀 / 거래처 차원별 수익성"
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <KpiCard label="매출" value={fmtKrw(top.rev)} icon="💰" accent="blue"
          delta={top.yoyRev} deltaLabel="전년동기" />
        <KpiCard label="영업이익" value={fmtKrw(top.prf)} icon="💵" accent="emerald"
          delta={top.yoyPrf} deltaLabel="전년동기" />
        <KpiCard label="이익률" value={top.rev > 0 ? top.mp.toFixed(1) + "%" : "—"} icon="📊" accent="violet"
          delta={null} deltaFallback="—" />
        <KpiCard label="목표 영업이익" value={fmtKrw(top.targetProfit)} icon="🎯" accent="slate"
          delta={null} deltaFallback={top.targetProfit > 0 ? "목표 설정됨" : "목표 없음"} />
        <KpiCard label="목표 대비 실적" value={top.ach === null ? "—" : fmtPct(top.ach)} icon="✅" accent="amber"
          delta={top.ach} deltaFallback="목표 없음" />
      </div>

      <Tabs<TabId> tabs={TABS} active={tab} onChange={setTab} />

      <ChartCard
        title={`${TABS.find((t) => t.id === tab)?.label} 영업이익`}
        subtitle={`총 ${summary.length}개 항목 · 영업이익 내림차순`}
      >
        {summary.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">데이터 없음</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(240, summary.length * 32)}>
            <BarChart data={summary.map((s) => ({ ...s, profitMan: Math.round(s.profit / 10000) }))} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
              <XAxis type="number" {...AXIS_STYLE} tickFormatter={(v) => fmt(v)} />
              <YAxis type="category" dataKey="key" tick={{ fill: "#0F172A", fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v) => [fmt(Number(v)) + "만원", "영업이익"]}
              />
              <Bar dataKey="profitMan" radius={[0, 6, 6, 0]}>
                {summary.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="상세 표">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">항목</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">매출</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">영업이익</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">이익률</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">동기비(매출)</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">동기비(이익)</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.key} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-2 text-xs text-slate-900 font-medium">{s.key}</td>
                  <td className="py-2 px-2 text-xs text-slate-700 text-right">{fmtKrw(s.revenue)}</td>
                  <td className="py-2 px-2 text-xs text-emerald-600 font-semibold text-right">{fmtKrw(s.profit)}</td>
                  <td className="py-2 px-2 text-xs text-slate-700 text-right">{s.revenue > 0 ? s.marginPct.toFixed(1) + "%" : "—"}</td>
                  <td className={`py-2 px-2 text-xs text-right ${s.yoyRevenuePct === null ? "text-slate-400" : s.yoyRevenuePct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {fmtPctOrNull(s.yoyRevenuePct)}
                  </td>
                  <td className={`py-2 px-2 text-xs text-right ${s.yoyProfitPct === null ? "text-slate-400" : s.yoyProfitPct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {fmtPctOrNull(s.yoyProfitPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
