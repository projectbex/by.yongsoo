"use client";

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { useMemo } from "react";
import { useData } from "@/lib/dataContext";
import { fmt, fmtKrw, fmtPct } from "@/lib/format";
import KpiCard from "@/components/KpiCard";
import {
  PageHeader, ChartCard, LoadingState, ErrorState,
  TOOLTIP_STYLE, AXIS_STYLE, GRID_STROKE, MockBadge,
} from "@/components/ui";
import {
  computeMainKpi, todayRevenue, revenue, inRange, shiftYearBack, toYmd,
} from "@/lib/kpi";
import { revenueByMainCategory } from "@/lib/profit";
import { CATEGORY_COLOR, MAIN_CATEGORIES } from "@/lib/category";

export default function HomePage() {
  const {
    sales, profits, receivables, targets, customerMap,
    filtered, filteredProfits, filters, loading, error, reload, usingMock,
  } = useData();

  // ── 6개 메인 KPI ──
  const kpi = useMemo(() => computeMainKpi({
    sales, filteredSales: filtered,
    profits: filteredProfits,
    receivables, targets,
    from: filters.from, to: filters.to,
  }), [sales, filtered, filteredProfits, receivables, targets, filters.from, filters.to]);

  // ── 도넛: 유종 4분류 매출 ──
  const donut = useMemo(() => {
    const m = revenueByMainCategory(filtered);
    return MAIN_CATEGORIES
      .map((c) => ({ name: c, value: Math.round(m[c]) }))
      .filter((d) => d.value > 0);
  }, [filtered]);

  // ── 일별 매출 (현재 + 전년 동기) ──
  const daily = useMemo(() => {
    const cur = new Map<string, number>();
    filtered.forEach((r) => {
      const ymd = toYmd(r.saleDate);
      if (ymd.length < 8) return;
      cur.set(ymd, (cur.get(ymd) || 0) + r.supplyAmount + r.taxAmount);
    });

    const prev = shiftYearBack(filters.from, filters.to);
    const prevMap = new Map<string, number>();
    sales
      .filter((s) => inRange(s.saleDate, prev.from, prev.to))
      .forEach((r) => {
        const ymd = toYmd(r.saleDate);
        if (ymd.length < 8) return;
        // 전년 -> 현재 비교를 위해 +1년 키로 매핑
        const y = String(Number(ymd.slice(0, 4)) + 1);
        const key = y + ymd.slice(4);
        prevMap.set(key, (prevMap.get(key) || 0) + r.supplyAmount + r.taxAmount);
      });

    const allKeys = new Set([...cur.keys(), ...prevMap.keys()]);
    return [...allKeys]
      .sort()
      .map((k) => ({
        name: `${k.slice(4, 6)}/${k.slice(6, 8)}`,
        ymd: k,
        당기: Math.round((cur.get(k) || 0) / 10000),
        전년: Math.round((prevMap.get(k) || 0) / 10000),
      }));
  }, [filtered, sales, filters.from, filters.to]);

  // ── 당일 매출 ──
  const today = useMemo(() => todayRevenue(filtered), [filtered]);
  const todayCount = useMemo(() => {
    const ymd = toYmd(new Date().toISOString().slice(0, 10));
    return filtered.filter((r) => toYmd(r.saleDate) === ymd).length;
  }, [filtered]);

  // ── 담당자 전수 (TOP 제한 없음) ──
  const byStaff = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => {
      m.set(r.staff, (m.get(r.staff) || 0) + r.supplyAmount + r.taxAmount);
    });
    return [...m.entries()]
      .filter(([s]) => s)
      .sort((a, b) => b[1] - a[1])
      .map(([staff, amt]) => ({ staff, 매출: Math.round(amt / 10000) }));
  }, [filtered]);

  // ── 거래처 순위 (전수, 정렬: 매출) ──
  const customerRank = useMemo(() => {
    const m = new Map<string, { amt: number; qty: number }>();
    filtered.forEach((r) => {
      const e = m.get(r.customer) || { amt: 0, qty: 0 };
      e.amt += r.supplyAmount + r.taxAmount;
      e.qty += r.quantity;
      m.set(r.customer, e);
    });
    return [...m.entries()]
      .sort((a, b) => b[1].amt - a[1].amt)
      .map(([customer, v], i) => {
        const info = customerMap.get(customer);
        return {
          rank: i + 1,
          customer,
          amt: v.amt,
          qty: v.qty,
          team: info?.team || "-",
          staff: info?.staff || "-",
        };
      });
  }, [filtered, customerMap]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const showMockNote = usingMock.profit || usingMock.target || usingMock.receivable;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="전체 개요"
        subtitle={`${filters.from.slice(0, 4)}-${filters.from.slice(4, 6)}-${filters.from.slice(6, 8)} ~ ${filters.to.slice(0, 4)}-${filters.to.slice(4, 6)}-${filters.to.slice(6, 8)}`}
        right={showMockNote ? <MockBadge /> : undefined}
      />

      {/* 6개 메인 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <KpiCard
          label="총 매출" value={fmtKrw(kpi.totalRevenue)} icon="💰" accent="blue"
          delta={kpi.yoyRevenuePct} deltaLabel="전년동기"
        />
        <KpiCard
          label="목표 매출" value={fmtKrw(kpi.targetRevenue)} icon="🎯" accent="violet"
          delta={kpi.targetRevenue > 0 ? null : null}
          deltaFallback={kpi.targetRevenue > 0 ? "목표 설정됨" : "목표 없음"}
        />
        <KpiCard
          label="목표 대비 실적" value={kpi.achievementPct === null ? "—" : fmtPct(kpi.achievementPct)} icon="📊" accent="emerald"
          delta={kpi.achievementPct} deltaFallback="목표 없음"
        />
        <KpiCard
          label="동기비 실적" value={kpi.yoyRevenuePct === null ? "—" : fmtPct(kpi.yoyRevenuePct)} icon="📈" accent="blue"
          delta={kpi.yoyRevenuePct} deltaLabel="vs 전년"
        />
        <KpiCard
          label="영업이익" value={fmtKrw(kpi.totalProfit)} icon="💵" accent="emerald"
          delta={kpi.profitYoyPct} deltaLabel="전년동기"
        />
        <KpiCard
          label="현재 미수금" value={fmtKrw(kpi.totalReceivable)} icon="⚠️" accent="red"
          deltaFallback="전체 잔액"
          delta={null}
        />
      </div>

      {/* 도넛 + 당일 KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="유종별 매출 비중" subtitle="대분류 4버킷">
          {donut.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-12">데이터 없음</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={donut} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {donut.map((d) => (
                    <Cell key={d.name} fill={CATEGORY_COLOR[d.name as keyof typeof CATEGORY_COLOR]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v) => [fmtKrw(Number(v)), "매출"]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="당일 매출" subtitle={new Date().toISOString().slice(0, 10)}>
          <div className="flex flex-col items-center justify-center h-[280px] gap-3">
            <div className="text-4xl font-bold text-slate-900">{fmtKrw(today)}</div>
            <div className="text-xs text-slate-500">거래 {fmt(todayCount)}건</div>
            <div className="w-full max-w-[200px] h-px bg-slate-200" />
            <div className="text-[11px] text-slate-400">전체 기간 일평균 대비</div>
            <div className="text-sm text-slate-700 font-medium">
              {(() => {
                const days = Math.max(1, daily.length);
                const avg = revenue(filtered) / days;
                if (avg <= 0) return "—";
                const pct = ((today - avg) / avg) * 100;
                return (pct >= 0 ? "▲ " : "▼ ") + fmtPct(pct);
              })()}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="영업이익 / 이익률" subtitle="기간 합산">
          <div className="flex flex-col items-center justify-center h-[280px] gap-2">
            <div className="text-3xl font-bold text-emerald-600">{fmtKrw(kpi.totalProfit)}</div>
            <div className="text-xs text-slate-500">
              매출 {fmtKrw(kpi.totalRevenue)} 중
            </div>
            <div className="text-2xl font-semibold text-slate-700 mt-2">
              {kpi.totalRevenue > 0 ? ((kpi.totalProfit / kpi.totalRevenue) * 100).toFixed(1) + "%" : "—"}
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

      {/* 일별 매출 (당기 + 전년) */}
      <ChartCard title="일별 매출 추이" subtitle="당기 vs 전년 동기 (만원)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="name" {...AXIS_STYLE} />
            <YAxis {...AXIS_STYLE} tickFormatter={(v) => fmt(v)} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v, name) => [fmt(Number(v)) + "만원", String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="당기" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="전년" stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 담당자 전수 */}
      <ChartCard title="담당자별 매출" subtitle="전체 (TOP 제한 없음, 만원)">
        <ResponsiveContainer width="100%" height={Math.max(220, byStaff.length * 36)}>
          <BarChart data={byStaff} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
            <XAxis type="number" {...AXIS_STYLE} tickFormatter={(v) => fmt(v)} />
            <YAxis type="category" dataKey="staff" tick={{ fill: "#0F172A", fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v) => [fmt(Number(v)) + "만원", "매출"]}
            />
            <Bar dataKey="매출" fill="#3B82F6" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 거래처 순위 (전수 표) */}
      <ChartCard title="거래처 순위" subtitle={`매출 기준 · 전체 ${customerRank.length}곳`}>
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">#</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">거래처</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">팀</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">담당자</th>
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
                  <td className="py-2 px-2 text-xs text-slate-500">{c.staff}</td>
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
