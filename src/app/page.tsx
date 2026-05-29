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
import { aggregateSales, getNewProductDetails } from "@/lib/salesAggregator";
import { getMonthsSinceLaunch } from "@/lib/productClassifier";
import { getActivePromotions, getDaysUntilEnd } from "@/data/promotions";

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

  // ── Phase 2: 신상품 매출 분리 ──
  const salesSummary = useMemo(() => aggregateSales(filtered), [filtered]);
  const newProductDetails = useMemo(() => getNewProductDetails(filtered), [filtered]);

  // ── Phase 4: 프로모션 현황 ──
  const activePromotions = useMemo(() => getActivePromotions(), []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  {/*
   * Phase 1 UX 가독성 개선 (2026-05-22)
   * 페이지 레이아웃 변경:
   *   - 좌우 padding: p-4/p-6 → px-4 md:px-8 py-6 md:py-8
   *   - 섹션 간격: space-y-5 → space-y-8
   *   - 최대 너비: max-w-[1440px] 추가
   */}
  return (
    <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8 space-y-5 sm:space-y-8 max-w-[1440px] mx-auto">
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

      {/*
       * 6개 메인 KPI — Phase 1 UX 개선
       * 변경: gap-3/4 → gap-5, grid-cols-2/3 → grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
       * 총매출/영업이익은 size="large" (40px 숫자)
       */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <KpiCard label="총 매출" value={fmtKrw(kpi.totalRevenue)} icon="💰" accent="blue"
          delta={kpi.yoyRevenuePct} deltaLabel="전년동기" size="large" />
        <KpiCard label="목표 매출" value={fmtKrw(kpi.targetRevenue)} icon="🎯" accent="violet"
          deltaFallback={kpi.targetRevenue > 0 ? "목표 설정됨" : "목표 없음"} delta={null} />
        <KpiCard label="목표 대비 실적" value={kpi.achievementPct === null ? "—" : fmtPct(kpi.achievementPct)} icon="📊" accent="emerald"
          delta={kpi.achievementPct} deltaFallback="목표 없음" />
        <KpiCard label="동기비 실적" value={kpi.yoyRevenuePct === null ? "—" : fmtPct(kpi.yoyRevenuePct)} icon="📈" accent="blue"
          delta={kpi.yoyRevenuePct} deltaLabel="vs 전년" />
        <KpiCard label="영업이익" value={fmtKrw(kpi.totalProfit)} icon="💵" accent="emerald"
          delta={kpi.profitYoyPct} deltaLabel="전년동기" size="large" />
        <KpiCard label="현재 미수금" value={fmtKrw(kpi.totalReceivable)} icon="⚠️" accent="red"
          deltaFallback="전체 잔액" delta={null} />
      </div>

      {/* 도넛 + 영업이익 — gap 4→5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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

        {/*
         * 영업이익 카드 — Phase 1 UX 개선
         * 변경: 숫자 크기 3xl→4xl, 보조텍스트 xs→sm, 이익률 2xl→3xl
         */}
        <ChartCard title="영업이익 / 이익률" subtitle="기간 합산">
          <div className="flex flex-col items-center justify-center h-[260px] sm:h-[300px] gap-3">
            <div className="text-2xl sm:text-4xl font-bold text-emerald-600" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtKrw(profitTotal)}</div>
            <div className="text-xs sm:text-sm text-slate-500">매출 {fmtKrw(kpi.totalRevenue)} 중</div>
            <div className="text-xl sm:text-3xl font-semibold text-slate-700 mt-2" style={{ fontVariantNumeric: "tabular-nums" }}>
              {kpi.totalRevenue > 0 ? ((profitTotal / kpi.totalRevenue) * 100).toFixed(1) + "%" : "—"}
            </div>
            <div className="text-xs text-slate-400">이익률</div>
            <div className="w-full max-w-[200px] h-px bg-slate-200 my-2" />
            <div className="text-sm text-slate-500">
              전년동기 대비:{" "}
              <span className={kpi.profitYoyPct === null ? "text-slate-400" : kpi.profitYoyPct >= 0 ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
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

      {/* ========== Phase 2: 신상품 KPI 영역 ========== */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-5 tracking-tight">
          신상품 성과
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <KpiCard
            label="신상품 매출 (당기)"
            value={fmtKrw(salesSummary.newProductRevenue)}
            icon="🆕"
            accent="violet"
            delta={null}
            deltaFallback={`${salesSummary.newProductRatio.toFixed(1)}% 비중`}
          />
          <KpiCard
            label="기존상품 매출 (당기)"
            value={fmtKrw(salesSummary.existingProductRevenue)}
            icon="📦"
            accent="slate"
            delta={null}
            deltaFallback={`${(100 - salesSummary.newProductRatio).toFixed(1)}% 비중`}
          />
          <KpiCard
            label="신상품 비중"
            value={`${salesSummary.newProductRatio.toFixed(1)}%`}
            icon="📊"
            accent={salesSummary.newProductRatio >= 15 ? "emerald" : "amber"}
            delta={null}
            deltaFallback="목표: 15% 이상"
          />
        </div>
      </section>

      {/* ========== Phase 2: 신상품 매출 현황 테이블 ========== */}
      <ChartCard title="신상품 매출 현황" subtitle={`등록 ${newProductDetails.length}개 SKU`}>
        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#F7F8FA] z-10">
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-[13px] font-medium text-slate-500">상품명</th>
                <th className="text-left py-3 px-4 text-[13px] font-medium text-slate-500">카테고리</th>
                <th className="text-left py-3 px-4 text-[13px] font-medium text-slate-500">출시일</th>
                <th className="text-left py-3 px-4 text-[13px] font-medium text-slate-500">출시 후 경과</th>
                <th className="text-right py-3 px-4 text-[13px] font-medium text-slate-500">당기 매출</th>
                <th className="text-right py-3 px-4 text-[13px] font-medium text-slate-500">판매수량</th>
              </tr>
            </thead>
            <tbody>
              {newProductDetails.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-[13px] text-slate-900 font-medium max-w-[260px] truncate">{p.name}</td>
                  <td className="py-3 px-4 text-[13px] text-slate-500">{p.category}</td>
                  <td className="py-3 px-4 text-[13px] text-slate-500">{p.launchDate}</td>
                  <td className="py-3 px-4 text-[13px] text-slate-500">
                    {getMonthsSinceLaunch(p.launchDate).toFixed(0)}개월
                  </td>
                  <td className="py-3 px-4 text-[13px] text-slate-900 font-semibold text-right whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {p.monthlyRevenue > 0 ? fmtKrw(p.monthlyRevenue) : "—"}
                  </td>
                  <td className="py-3 px-4 text-[13px] text-slate-700 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {p.quantity > 0 ? fmt(p.quantity) : "—"}
                  </td>
                </tr>
              ))}
              {newProductDetails.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
                    등록된 신상품이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* ========== Phase 3: 매출 구성 (경영속보 기준) ========== */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-5 tracking-tight">
          매출 구성 (경영속보 기준)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <KpiCard
            label="외부 매출"
            value={fmtKrw(salesSummary.externalRevenue)}
            icon="🏢"
            accent="slate"
            delta={null}
            deltaFallback={`${salesSummary.externalRatio.toFixed(1)}% 비중`}
          />
          <KpiCard
            label="내부거래 (그룹사)"
            value={fmtKrw(salesSummary.internalRevenue)}
            icon="🔄"
            accent="slate"
            delta={null}
            deltaFallback={`${(100 - salesSummary.externalRatio).toFixed(1)}% 비중`}
          />
          <KpiCard
            label="총 매출 (외부+내부)"
            value={fmtKrw(salesSummary.totalRevenue)}
            icon="📋"
            accent="slate"
            delta={null}
            deltaFallback="경영속보 보고 기준"
          />
        </div>
      </section>

      {/* Phase 3: 그룹사별 내부거래 테이블 */}
      {salesSummary.internalByGroup.length > 0 && (
        <ChartCard title="그룹사별 내부거래" subtitle={`${salesSummary.internalByGroup.length}개 그룹사`}>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#F7F8FA] z-10">
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-slate-500">그룹사</th>
                  <th className="text-right py-3 px-4 text-[13px] font-medium text-slate-500">거래건수</th>
                  <th className="text-right py-3 px-4 text-[13px] font-medium text-slate-500">매출액</th>
                  <th className="text-right py-3 px-4 text-[13px] font-medium text-slate-500">비중</th>
                </tr>
              </thead>
              <tbody>
                {salesSummary.internalByGroup.map((g) => (
                  <tr key={g.group} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-[13px] text-slate-900 font-medium">{g.group}</td>
                    <td className="py-3 px-4 text-[13px] text-slate-700 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(g.count)}</td>
                    <td className="py-3 px-4 text-[13px] text-slate-900 font-semibold text-right whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtKrw(g.revenue)}</td>
                    <td className="py-3 px-4 text-[13px] text-slate-500 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {salesSummary.internalRevenue > 0 ? ((g.revenue / salesSummary.internalRevenue) * 100).toFixed(1) + "%" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}

      {/* ========== Phase 4: 프로모션 현황 ========== */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-5 tracking-tight">
          프로모션 현황
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <KpiCard
            label="진행 중 프로모션"
            value={`${activePromotions.length}건`}
            icon="🏷️"
            accent="slate"
            delta={null}
            deltaFallback="현재 활성"
          />
          <KpiCard
            label="적용 가능 SKU"
            value={`${new Set(activePromotions.flatMap((p) => p.applicableProductIds)).size}개`}
            icon="📦"
            accent="slate"
            delta={null}
            deltaFallback="중복 제외"
          />
          <KpiCard
            label="최단 종료일"
            value={activePromotions.length > 0 ? `D-${Math.max(0, Math.min(...activePromotions.map((p) => getDaysUntilEnd(p.endDate))))}` : "—"}
            icon="⏰"
            accent="slate"
            delta={null}
            deltaFallback={activePromotions.length > 0 ? activePromotions.reduce((a, b) => getDaysUntilEnd(a.endDate) < getDaysUntilEnd(b.endDate) ? a : b).name : ""}
          />
        </div>
      </section>

      {/* Phase 4: 진행 중 프로모션 테이블 */}
      {activePromotions.length > 0 && (
        <ChartCard title="진행 중 프로모션 상세" subtitle={`${activePromotions.length}건 활성`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#F7F8FA] z-10">
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-slate-500">프로모션명</th>
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-slate-500">유형</th>
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-slate-500">기간</th>
                  <th className="text-right py-3 px-4 text-[13px] font-medium text-slate-500">남은 일수</th>
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-slate-500">설명</th>
                </tr>
              </thead>
              <tbody>
                {activePromotions.map((p) => {
                  const daysLeft = getDaysUntilEnd(p.endDate);
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-[13px] text-slate-900 font-medium">{p.name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                          {p.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[13px] text-slate-500 whitespace-nowrap">{p.startDate} ~ {p.endDate}</td>
                      <td className="py-3 px-4 text-[13px] text-right font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                        <span className={daysLeft <= 14 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-slate-700"}>
                          D-{daysLeft}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[13px] text-slate-500 max-w-[300px]">{p.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}

      {/*
       * 거래처 순위 — Phase 1 UX 개선
       * 변경: 헤더 text-[11px]→text-[13px], 본문 text-xs→text-[13px]
       * padding: py-2 px-2 → py-3 px-4
       * 매출 숫자 색상: text-blue-600 → text-slate-900 (차분하게)
       */}
      <ChartCard title="거래처 순위" subtitle={`매출 기준 · 전체 ${customerRank.length}곳`}>
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#F7F8FA] z-10">
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-[13px] font-medium text-slate-500">#</th>
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-[13px] font-medium text-slate-500">거래처</th>
                <th className="text-left py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-[13px] font-medium text-slate-500 hidden sm:table-cell">팀</th>
                <th className="text-right py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-[13px] font-medium text-slate-500 hidden sm:table-cell">수량</th>
                <th className="text-right py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-[13px] font-medium text-slate-500">매출</th>
              </tr>
            </thead>
            <tbody>
              {customerRank.map((c) => (
                <tr key={c.customer} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-[13px] text-slate-400">{c.rank}</td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-[13px] text-slate-900 font-medium max-w-[140px] sm:max-w-[220px] truncate">{c.customer}</td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-[13px] text-slate-500 hidden sm:table-cell">{c.team}</td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-[13px] text-slate-700 text-right hidden sm:table-cell" style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(c.qty)}</td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-[13px] text-slate-900 font-semibold text-right whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtKrw(c.amt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
