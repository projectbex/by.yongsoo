// ── KPI 핵심 계산 함수 ──
//
// 매출     = row.revenue
// 영업이익 = row.profit
// 동기비   = (current - prev) / prev * 100
// 달성률   = actual / target * 100

import type { SaleRow, ReceivableRow, TargetRow } from "./sheets";

// ─────────────────────────────────────────
// 1. 날짜 유틸
// ─────────────────────────────────────────

/** "2026-03-05" 또는 "20260305" → "20260305" (8자리) */
export function toYmd(dateStr: string): string {
  return (dateStr || "").replace(/[^0-9]/g, "").slice(0, 8);
}

/** 날짜 범위 포함 여부 (YYYYMMDD 비교) */
export function inRange(dateStr: string, from: string, to: string): boolean {
  const d = toYmd(dateStr);
  if (d.length < 8) return false;
  const f = from.replace(/[^0-9]/g, "").padEnd(8, "0");
  const t = to.replace(/[^0-9]/g, "").padEnd(8, "9");
  return d >= f && d <= t;
}

/** 전년 동기 범위 */
export function shiftYearBack(from: string, to: string): { from: string; to: string } {
  const shift = (ymd: string) => {
    const y = ymd.slice(0, 4);
    const rest = ymd.slice(4);
    return String(Number(y) - 1) + rest;
  };
  return { from: shift(toYmd(from) || from), to: shift(toYmd(to) || to) };
}

/** 오늘 YYYYMMDD */
export function todayYmd(): string {
  const d = new Date();
  return (
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0")
  );
}

// ─────────────────────────────────────────
// 2. 집계 함수
// ─────────────────────────────────────────

export function revenue(rows: SaleRow[]): number {
  return rows.reduce((s, r) => s + r.revenue, 0);
}

export function quantity(rows: SaleRow[]): number {
  return rows.reduce((s, r) => s + r.quantity, 0);
}

export function cost(rows: SaleRow[]): number {
  return rows.reduce((s, r) => s + r.cost, 0);
}

export function profit(rows: SaleRow[]): number {
  return rows.reduce((s, r) => s + r.profit, 0);
}

export function marginPct(profit: number, rev: number): number {
  return rev > 0 ? (profit / rev) * 100 : 0;
}

// ─────────────────────────────────────────
// 3. 동기비 / 달성률
// ─────────────────────────────────────────

export function yoy(current: number, prev: number): number | null {
  if (!isFinite(prev) || prev <= 0) return null;
  return ((current - prev) / prev) * 100;
}

export function achievement(actual: number, target: number): number | null {
  if (!isFinite(target) || target <= 0) return null;
  return (actual / target) * 100;
}

// ─────────────────────────────────────────
// 4. 목표 조회 (기간 합산)
// ─────────────────────────────────────────

/** YYYY-MM 형식을 YYYYMM 6자리로 변환 */
function periodToYm(period: string): string {
  return period.replace(/[^0-9]/g, "").slice(0, 6);
}

export function sumTargetRevenue(targets: TargetRow[], from: string, to: string): number {
  const fromYm = toYmd(from).slice(0, 6);
  const toYm = toYmd(to).slice(0, 6);
  return targets
    .filter((t) => {
      const ym = periodToYm(t.period);
      return ym >= fromYm && ym <= toYm;
    })
    .reduce((s, t) => s + (t.targetRevenue || 0), 0);
}

export function sumTargetProfit(targets: TargetRow[], from: string, to: string): number {
  const fromYm = toYmd(from).slice(0, 6);
  const toYm = toYmd(to).slice(0, 6);
  return targets
    .filter((t) => {
      const ym = periodToYm(t.period);
      return ym >= fromYm && ym <= toYm;
    })
    .reduce((s, t) => s + (t.targetProfit || 0), 0);
}

// ─────────────────────────────────────────
// 5. 미수금
// ─────────────────────────────────────────

export function outstandingReceivable(rows: ReceivableRow[]): number {
  return rows.reduce((s, r) => s + r.remaining, 0);
}

// ─────────────────────────────────────────
// 범우연합 KPI 산식 (Phase 1)
// ─────────────────────────────────────────

export interface BwKpiInput {
  drumPrevious: number;
  drumCurrent: number;
  eaPrevious: number;
  eaCurrent: number;
  drumRevenue: number;
  eaRevenue: number;
  profitPlan: number;
  profitActual: number;
}

export interface BwKpiResult {
  drumGrowth: number;
  eaGrowth: number;
  drumWeight: number;
  eaWeight: number;
  drumWeighted: number;
  eaWeighted: number;
  totalWeighted: number;
  salesScore: number;
  profitAchievement: number;
  profitScore: number;
  totalScore: number;
  grade: "S" | "A" | "B" | "C" | "D";
}

export function getGrade(score: number): BwKpiResult["grade"] {
  if (score > 110) return "S";
  if (score > 100) return "A";
  if (score > 90) return "B";
  if (score > 80) return "C";
  return "D";
}

export function calculateBexKPI(input: BwKpiInput): BwKpiResult {
  const drumGrowth = input.drumPrevious > 0 ? input.drumCurrent / input.drumPrevious : 0;
  const eaGrowth = input.eaPrevious > 0 ? input.eaCurrent / input.eaPrevious : 0;

  const totalRevenue = input.drumRevenue + input.eaRevenue;
  const drumWeight = totalRevenue > 0 ? input.drumRevenue / totalRevenue : 0;
  const eaWeight = totalRevenue > 0 ? input.eaRevenue / totalRevenue : 0;

  const drumWeighted = drumGrowth * drumWeight;
  const eaWeighted = eaGrowth * eaWeight;
  const totalWeighted = drumWeighted + eaWeighted;

  const salesScore = totalWeighted * 0.5 * 100;

  const profitAchievement = input.profitPlan > 0 ? input.profitActual / input.profitPlan : 0;
  const profitScore = profitAchievement * 0.5 * 100;

  const totalScore = salesScore + profitScore;

  return {
    drumGrowth,
    eaGrowth,
    drumWeight,
    eaWeight,
    drumWeighted,
    eaWeighted,
    totalWeighted,
    salesScore,
    profitAchievement,
    profitScore,
    totalScore,
    grade: getGrade(totalScore),
  };
}

/** 품목명에서 DRUM/EA 단위 판별 */
export function isDrum(productName: string): boolean {
  const upper = productName.toUpperCase();
  return upper.includes("드럼") || upper.includes("DRUM") || upper.includes("DRM") || upper.includes("DR ");
}

/** 실데이터로부터 BwKpiInput 구성 */
export function buildBwKpiInput(args: {
  allSales: SaleRow[];
  targets: TargetRow[];
  year: number;
}): BwKpiInput {
  const { allSales, targets, year } = args;

  const curYearRows = allSales.filter((r) => r.year === year);
  const prevYearRows = allSales.filter((r) => r.year === year - 1);

  const drumCurrent = curYearRows.filter((r) => isDrum(r.product)).reduce((s, r) => s + r.quantity, 0);
  const drumPrevious = prevYearRows.filter((r) => isDrum(r.product)).reduce((s, r) => s + r.quantity, 0);
  const eaCurrent = curYearRows.filter((r) => !isDrum(r.product)).reduce((s, r) => s + r.quantity, 0);
  const eaPrevious = prevYearRows.filter((r) => !isDrum(r.product)).reduce((s, r) => s + r.quantity, 0);

  const drumRevenue = curYearRows.filter((r) => isDrum(r.product)).reduce((s, r) => s + r.revenue, 0);
  const eaRevenue = curYearRows.filter((r) => !isDrum(r.product)).reduce((s, r) => s + r.revenue, 0);

  const profitActual = curYearRows.reduce((s, r) => s + r.profit, 0);

  const fromYm = `${year}01`;
  const toYm = `${year}12`;
  const profitPlan = targets
    .filter((t) => {
      const ym = t.period.replace(/[^0-9]/g, "").slice(0, 6);
      return ym >= fromYm && ym <= toYm;
    })
    .reduce((s, t) => s + (t.targetProfit || 0), 0);

  return { drumPrevious, drumCurrent, eaPrevious, eaCurrent, drumRevenue, eaRevenue, profitPlan, profitActual };
}

/** 월별 누적 KPI 점수 계산 (차트용) */
export function monthlyKpiScores(args: {
  allSales: SaleRow[];
  targets: TargetRow[];
  year: number;
}): Array<{ month: number; label: string; totalScore: number; salesScore: number; profitScore: number; grade: string }> {
  const { allSales, targets, year } = args;
  const results: Array<{ month: number; label: string; totalScore: number; salesScore: number; profitScore: number; grade: string }> = [];

  for (let m = 1; m <= 12; m++) {
    const curRows = allSales.filter((r) => r.year === year && r.month <= m);
    const prevRows = allSales.filter((r) => r.year === year - 1 && r.month <= m);

    if (curRows.length === 0) break;

    const drumCurrent = curRows.filter((r) => isDrum(r.product)).reduce((s, r) => s + r.quantity, 0);
    const drumPrevious = prevRows.filter((r) => isDrum(r.product)).reduce((s, r) => s + r.quantity, 0);
    const eaCurrent = curRows.filter((r) => !isDrum(r.product)).reduce((s, r) => s + r.quantity, 0);
    const eaPrevious = prevRows.filter((r) => !isDrum(r.product)).reduce((s, r) => s + r.quantity, 0);
    const drumRevenue = curRows.filter((r) => isDrum(r.product)).reduce((s, r) => s + r.revenue, 0);
    const eaRevenue = curRows.filter((r) => !isDrum(r.product)).reduce((s, r) => s + r.revenue, 0);
    const profitActual = curRows.reduce((s, r) => s + r.profit, 0);

    const fromYm = `${year}01`;
    const toYm = `${year}${String(m).padStart(2, "0")}`;
    const profitPlan = targets
      .filter((t) => {
        const ym = t.period.replace(/[^0-9]/g, "").slice(0, 6);
        return ym >= fromYm && ym <= toYm;
      })
      .reduce((s, t) => s + (t.targetProfit || 0), 0);

    const result = calculateBexKPI({
      drumPrevious, drumCurrent, eaPrevious, eaCurrent,
      drumRevenue, eaRevenue, profitPlan, profitActual,
    });

    results.push({
      month: m,
      label: `${m}월`,
      totalScore: Math.round(result.totalScore * 10) / 10,
      salesScore: Math.round(result.salesScore * 10) / 10,
      profitScore: Math.round(result.profitScore * 10) / 10,
      grade: result.grade,
    });
  }

  return results;
}

// ─────────────────────────────────────────
// 6. 메인 KPI 집계
// ─────────────────────────────────────────

export interface MainKpi {
  totalRevenue: number;
  targetRevenue: number;
  achievementPct: number | null;
  yoyRevenuePct: number | null;
  totalProfit: number;
  totalReceivable: number;
  prevRevenue: number;
  prevProfit: number;
  profitYoyPct: number | null;
}

export function computeMainKpi(args: {
  allSales: SaleRow[];
  filtered: SaleRow[];
  receivables: ReceivableRow[];
  targets: TargetRow[];
  from: string;
  to: string;
}): MainKpi {
  const { allSales, filtered, receivables, targets, from, to } = args;

  const totalRevenue = revenue(filtered);
  const totalProfit = profit(filtered);
  const targetRevenue = sumTargetRevenue(targets, from, to);

  const prev = shiftYearBack(from, to);
  const prevRows = allSales.filter((s) => inRange(s.date, prev.from, prev.to));
  const prevRevenue = revenue(prevRows);
  const prevProfit = profit(prevRows);

  return {
    totalRevenue,
    targetRevenue,
    achievementPct: achievement(totalRevenue, targetRevenue),
    yoyRevenuePct: yoy(totalRevenue, prevRevenue),
    totalProfit,
    totalReceivable: outstandingReceivable(receivables),
    prevRevenue,
    prevProfit,
    profitYoyPct: yoy(totalProfit, prevProfit),
  };
}
