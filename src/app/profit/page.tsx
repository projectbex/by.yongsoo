"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useData } from "@/lib/dataContext";
import {
  PageHeader, ChartCard, LoadingState, ErrorState, Tabs, MockBadge,
  TOOLTIP_STYLE, AXIS_STYLE, GRID_STROKE,
} from "@/components/ui";
import KpiCard from "@/components/KpiCard";
import { fmt, fmtKrw, fmtPct, fmtPctOrNull } from "@/lib/format";
import { revenue, profit as sumProfit, marginPct, yoy, shiftYearBack, inRange, sumTargetProfit, achievement } from "@/lib/kpi";
import { summarizeProfit, type ProfitGroupKey } from "@/lib/profit";
import { CATEGORY_COLOR } from "@/lib/category";

type TabId = ProfitGroupKey;

const TABS: { id: TabId; label: string }[] = [
  { id: "category", label: "유종별" },
  { id: "staff", label: "담당자별" },
  { id: "customer", label: "거래처별" },
];

export default function ProfitPage() {
  const { profits, filteredProfits, targets, filters, loading, error, reload, usingMock } = useData();
  const [tab, setTab] = useState<TabId>("category");

  // 상단 KPI: 매출/영업이익/이익률/목표달성률/동기비
  const top = useMemo(() => {
    const rev = revenue(filteredProfits);
    const prf = sumProfit(filteredProfits);
    const mp = marginPct(prf, rev);

    const prev = shiftYearBack(filters.from, filters.to);
    const prv = profits.filter((p) => inRange(p.saleDate, prev.from, prev.to));
    const prevRev = revenue(prv);
    const prevPrf = sumProfit(prv);

    const targetProfit = sumTargetProfit(targets, filters.from, filters.to, "전체", "-");
    const ach = achievement(prf, targetProfit);

    return {
      rev, prf, mp,
      yoyRev: yoy(rev, prevRev),
      yoyPrf: yoy(prf, prevPrf),
      targetProfit,
      ach,
    };
  }, [profits, filteredProfits, targets, filters.from, filters.to]);

  // 탭별 그룹 요약
  const summary = useMemo(() => summarizeProfit({
    rows: profits,
    targets,
    from: filters.from,
    to: filters.to,
    group: tab,
  }), [profits, targets, filters.from, filters.to, tab]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="영업이익 분석"
        subtitle="유종 / 담당자 / 거래처 차원별 수익성"
        right={(usingMock.profit || usingMock.target) ? <MockBadge /> : undefined}
      />

      {/* 상단 KPI */}
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

      {/* 탭 */}
      <Tabs<TabId> tabs={TABS} active={tab} onChange={setTab} />

      {/* 차트: 영업이익 막대 */}
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
                {summary.map((s, i) => (
                  <Cell
                    key={s.key}
                    fill={
                      tab === "category" && s.key in CATEGORY_COLOR
                        ? CATEGORY_COLOR[s.key as keyof typeof CATEGORY_COLOR]
                        : ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"][i % 8]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* 표 */}
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
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">목표 이익</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">달성률</th>
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
                  <td className="py-2 px-2 text-xs text-slate-700 text-right">{s.target > 0 ? fmtKrw(s.target) : "—"}</td>
                  <td className={`py-2 px-2 text-xs text-right font-medium ${s.achievementPct === null ? "text-slate-400" : s.achievementPct >= 100 ? "text-emerald-600" : "text-amber-600"}`}>
                    {s.achievementPct === null ? "목표 없음" : fmtPct(s.achievementPct)}
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
