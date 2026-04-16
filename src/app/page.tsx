"use client";

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { useMemo, useState } from "react";
import { useData } from "@/lib/dataContext";
import { fmt, fmtKrw, fmtPct } from "@/lib/format";
import KpiCard from "@/components/KpiCard";
import {
  PageHeader, ChartCard, LoadingState, ErrorState,
  TOOLTIP_STYLE, AXIS_STYLE, GRID_STROKE,
} from "@/components/ui";
import {
  computeMainKpi, revenue, profit, inRange, shiftYearBack, toYmd,
} from "@/lib/kpi";
import { revenueByCategory, getCategoryColor } from "@/lib/category";

type YearTab = "YTD" | "2023" | "2024" | "2025" | "2026" | "ALL";

function yearTabRange(tab: YearTab): { from: string; to: string; label: string } {
  const now = new Date();
  const todayStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const curYear = now.getFullYear();
  if (tab === "YTD") return { from: `${curYear}0101`, to: todayStr, label: `${curYear} 누적 (YTD)` };
  if (tab === "ALL") return { from: "20230101", to: todayStr, label: "전체 기간" };
  const y = Number(tab);
  if (y === curYear) return { from: `${y}0101`, to: todayStr, label: `${y}년 누적` };
  return { from: `${y}0101`, to: `${y}1231`, label: `${y}년 전체` };
}

export default function HomePage() {
  const { sales, receivables, targets, loading, error, reload } = useData();

  const [yearTab, setYearTab] = useState<YearTab>("YTD");
  const tabRange = useMemo(() => yearTabRange(yearTab), [yearTab]);

  const filtered = useMemo(
    () => sales.filter((r) => inRange(r.date, tabRange.from, tabRange.to)),
    [sales, tabRange.from, tabRange.to],
  );

  // ── 6개 메인 KPI ──
  const kpi = useMemo(() => computeMainKpi({
    allSales: sales, filtered,
    receivables, targets,
    from: tabRange.from, to: tabRange.to,
  }), [sales, filtered, receivables, targets, tabRange.from, tabRange.to]);

  // ── 도넛: 유종별 매출 ──
  const donut = useMemo(() => revenueByCategory(filtered), [filtered]);

  // ── 월별 매출 (당기 vs 전년) ──
  const monthly = useMemo(() => {
    const cur = new Map<string, number>();
    filtered.forEach((r) => {
      const ym = `${r.year}-${String(r.month).padStart(2, "0")}`;
      cur.set(ym, (cur.get(ym) || 0) + r.revenue);
    });

    const prev = shiftYearBack(tabRange.from, tabRange.to);
    const prevMap = new Map<string, number>();
    sales
      .filter((s) => inRange(s.date, prev.from, prev.to))
      .forEach((r) => {
        // 전년 → 현재 비교를 위해 +1년 키로 매핑
        const ym = `${r.year + 1}-${String(r.month).padStart(2, "0")}`;
        prevMap.set(ym, (prevMap.get(ym) || 0) + r.revenue);
      });

    const allKeys = new Set([...cur.keys(), ...prevMap.keys()]);
    return [...allKeys]
      .sort()
      .map((k) => ({
        name: k.slice(5) + "월",
        당기: Math.round((cur.get(k) || 0) / 10000),
        전년: Math.round((prevMap.get(k) || 0) / 10000),
      }));
  }, [filtered, sales, tabRange.from, tabRange.to]);

  // ── 팀별 매출 ──
  const byTeam = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => {
      m.set(r.team, (m.get(r.team) || 0) + r.revenue);
    });
    return [...m.entries()]
      .filter(([t]) => t)
      .sort((a, b) => b[1] - a[1])
      .map(([team, amt]) => ({ team, 매출: Math.round(amt / 10000) }));
  }, [filtered]);

  // ── 거래처 순위 ──
  const customerRank = useMemo(() => {
    const m = new Map<string, { amt: number; qty: number; team: string }>();
    filtered.forEach((r) => {
      const e = m.get(r.customer) || { amt: 0, qty: 0, team: r.team };
      e.amt += r.revenue;
      e.qty += r.quantity;
      m.set(r.customer, e);
    });
    return [...m.entries()]
      .sort((a, b) => b[1].amt - a[1].amt)
      .map(([customer, v], i) => ({
        rank: i + 1,
        customer,
        amt: v.amt,
        qty: v.qty,
        team: v.team || "-",
      }));
  }, [filtered]);

  // ── 영업이익 요약 ──
  const profitTotal = useMemo(() => profit(filtered), [filtered]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="전체 개요"
        subtitle={`${tabRange.label} · ${tabRange.from.slice(0, 4)}-${tabRange.from.slice(4, 6)}-${tabRange.from.slice(6, 8)} ~ ${tabRange.to.slice(0, 4)}-${tabRange.to.slice(4, 6)}-${tabRange.to.slice(6, 8)}`}
      />

      {/* 연도 탭 */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {([
          { id: "YTD", label: "올해 누적" },
          { id: "2026", label: "2026" },
          { id: "2025", label: "2025" },
          { id: "2024", label: "2024" },
          { id: "2023", label: "2023" },
          { id: "ALL", label: "전체" },
        ] as { id: YearTab; label: string }[]).map((t) => {
          const active = yearTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setYearTab(t.id)}
              className={
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors " +
                (active
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 6개 메인 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <KpiCard label="총 매출" value={fmtKrw(kpi.totalRevenue)} icon="💰" accent="blue"
          delta={kpi.yoyRevenuePct} deltaLabel="전년동기" />
        <KpiCard label="목표 매출" value={fmtKrw(kpi.targetRevenue)} icon="🎯" accent="violet"
          deltaFallback={kpi.targetRevenue > 0 ? "목표 설정됨" : "목표 없음"} delta={null} />
        <KpiCard label="목표 대비 실적" value={kpi.achievementPct === null ? "—" : fmtPct(kpi.achievementPct)} icon="📊" accent="emerald"
          delta={kpi.achievementPct} deltaFallback="목표 없음" />
        <KpiCard label="동기비 실적" value={kpi.yoyRevenuePct === null ? "—" : fmtPct(kpi.yoyRevenuePct)} icon="📈" accent="blue"
          delta={kpi.yoyRevenuePct} deltaLabel="vs 전년" />
        <KpiCard label="영업이익" value={fmtKrw(kpi.totalProfit)} icon="💵" accent="emerald"
          delta={kpi.profitYoyPct} deltaLabel="전년동기" />
        <KpiCard label="현재 미수금" value={fmtKrw(kpi.totalReceivable)} icon="⚠️" accent="red"
          deltaFallback="전체 잔액" delta={null} />
      </div>

      {/* 도넛 + 영업이익 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="유종별 매출 비중" subtitle="ERP 유종대분류 기준">
          {donut.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-12">데이터 없음</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={donut} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {donut.map((_, i) => (
                    <Cell key={i} fill={getCategoryColor(i)} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmtKrw(Number(v)), "매출"]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="영업이익 / 이익률" subtitle="기간 합산">
          <div className="flex flex-col items-center justify-center h-[300px] gap-2">
            <div className="text-3xl font-bold text-emerald-600">{fmtKrw(profitTotal)}</div>
            <div className="text-xs text-slate-500">매출 {fmtKrw(kpi.totalRevenue)} 중</div>
            <div className="text-2xl font-semibold text-slate-700 mt-2">
              {kpi.totalRevenue > 0 ? ((profitTotal / kpi.totalRevenue) * 100).toFixed(1) + "%" : "—"}
            </div>
            <div className="text-[11px] text-slate-400">이익률</div>
            <div className="w-full max-w-[200px] h-px bg-slate-200 my-1" />
            <div className="text-[11px] text-slate-500">
              전년동기 대비:{" "}
              <span className={kpi.profitYoyPct === null ? "text-slate-400" : kpi.profitYoyPct >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                {kpi.profitYoyPct === null ? "—" : fmtPct(kpi.profitYoyPct)}
              </span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* 월별 매출 (당기 vs 전년) */}
      <ChartCard title="월별 매출 추이" subtitle="당기 vs 전년 동기 (만원)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="name" {...AXIS_STYLE} />
            <YAxis {...AXIS_STYLE} tickFormatter={(v) => fmt(v)} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, name) => [fmt(Number(v)) + "만원", String(name)]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="당기" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="전년" stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 팀별 매출 */}
      <ChartCard title="팀별 매출" subtitle="전체 (만원)">
        <ResponsiveContainer width="100%" height={Math.max(220, byTeam.length * 36)}>
          <BarChart data={byTeam} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
            <XAxis type="number" {...AXIS_STYLE} tickFormatter={(v) => fmt(v)} />
            <YAxis type="category" dataKey="team" tick={{ fill: "#0F172A", fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(Number(v)) + "만원", "매출"]} />
            <Bar dataKey="매출" fill="#3B82F6" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 거래처 순위 */}
      <ChartCard title="거래처 순위" subtitle={`매출 기준 · 전체 ${customerRank.length}곳`}>
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">#</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">거래처</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">팀</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">수량</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">매출</th>
              </tr>
            </thead>
            <tbody>
              {customerRank.map((c) => (
                <tr key={c.customer} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-2 text-xs text-slate-400">{c.rank}</td>
                  <td className="py-2 px-2 text-xs text-slate-900 font-medium max-w-[180px] truncate">{c.customer}</td>
                  <td className="py-2 px-2 text-xs text-slate-500">{c.team}</td>
                  <td className="py-2 px-2 text-xs text-slate-700 text-right">{fmt(c.qty)}</td>
                  <td className="py-2 px-2 text-xs text-blue-600 font-semibold text-right whitespace-nowrap">{fmtKrw(c.amt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
