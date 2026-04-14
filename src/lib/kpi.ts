// ── KPI 핵심 계산 함수 (공통) ──
//
// 매출     = supplyAmount + taxAmount
// 영업이익 = 매출 - 원가 (cost)
// 동기비   = (current - prev) / prev * 100     ← 사용자 확정 공식
// 달성률   = actual / target * 100 (target 0 → "목표 없음" 반환용으로 null 처리)
//
// 모든 함수는 "target이 없거나 0인 경우에도 안전하게 동작"하도록 설계됨.

import type { SaleRow, ProfitRow, ReceivableRow, TargetRow } from "./sheets";

// ─────────────────────────────────────────
// 1. 날짜 유틸
// ─────────────────────────────────────────

/** "2026-03-05" 또는 "20260305" → "20260305" (8자리) */
export function toYmd(dateStr: string): string {
  return (dateStr || "").replace(/[^0-9]/g, "").slice(0, 8);
}

/** 날짜 범위 포함 여부 (문자열 YYYYMMDD 비교) */
export function inRange(dateStr: string, from: string, to: string): boolean {
  const d = toYmd(dateStr);
  if (d.length < 8) return false;
  const f = from.replace(/[^0-9]/g, "").padEnd(8, "0");
  const t = to.replace(/[^0-9]/g, "").padEnd(8, "9");
  return d >= f && d <= t;
}

/**
 * 전년 동기 범위 계산 (shiftYearBack).
 * 동기비 계산 시 모든 곳에서 이 함수를 통해 일관 적용.
 *   from: "20260101", to: "20260430"  →  { from: "20250101", to: "20250430" }
 */
export function shiftYearBack(from: string, to: string): { from: string; to: string } {
  const shift = (ymd: string) => {
    const y = ymd.slice(0, 4);
    const rest = ymd.slice(4);
    return String(Number(y) - 1) + rest;
  };
  return { from: shift(toYmd(from) || from), to: shift(toYmd(to) || to) };
}

/** 오늘 날짜를 YYYYMMDD 문자열로 */
export function todayYmd(): string {
  const d = new Date();
  return (
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0")
  );
}

// ─────────────────────────────────────────
// 2. 매출 / 영업이익 합산
// ─────────────────────────────────────────

/** 매출 합산: 공급가 + 부가세 */
export function revenue(rows: Array<{ supplyAmount: number; taxAmount: number }>): number {
  return rows.reduce((s, r) => s + r.supplyAmount + r.taxAmount, 0);
}

/** 수량 합산 */
export function quantity(rows: Array<{ quantity: number }>): number {
  return rows.reduce((s, r) => s + r.quantity, 0);
}

/** 원가 합산 */
export function cost(rows: Array<{ cost: number }>): number {
  return rows.reduce((s, r) => s + r.cost, 0);
}

/** 영업이익 합산: 매출 - 원가 */
export function profit(rows: ProfitRow[]): number {
  return rows.reduce((s, r) => s + (r.supplyAmount + r.taxAmount) - r.cost, 0);
}

/** 이익률 % */
export function marginPct(profit: number, rev: number): number {
  return rev > 0 ? (profit / rev) * 100 : 0;
}

// ─────────────────────────────────────────
// 3. 동기비 / 목표 달성률
// ─────────────────────────────────────────

/**
 * 전년 동기비 = (current - prev) / prev * 100
 * prev가 0 또는 음수면 계산 불가 → null 반환 (UI에서 "—" 표시)
 */
export function yoy(current: number, prev: number): number | null {
  if (!isFinite(prev) || prev <= 0) return null;
  return ((current - prev) / prev) * 100;
}

/**
 * 목표 달성률 = actual / target * 100
 * target이 없거나 0이면 null → UI에서 "목표 없음" 표시
 */
export function achievement(actual: number, target: number): number | null {
  if (!isFinite(target) || target <= 0) return null;
  return (actual / target) * 100;
}

// ─────────────────────────────────────────
// 4. 목표 조회 (fallback 안전)
// ─────────────────────────────────────────

/**
 * 기간(from~to) 내 합산 목표 매출.
 * 해당 기간에 매칭되는 목표 행이 없으면 0 반환 (achievement()가 null로 처리).
 */
export function sumTargetRevenue(
  targets: TargetRow[],
  from: string,
  to: string,
  type: TargetRow["type"] = "전체",
  key: string = "-",
): number {
  const fromYm = toYmd(from).slice(0, 6);
  const toYm = toYmd(to).slice(0, 6);
  return targets
    .filter((t) => t.type === type && (type === "전체" ? true : t.key === key))
    .filter((t) => t.period.replace(/[^0-9]/g, "") >= fromYm && t.period.replace(/[^0-9]/g, "") <= toYm)
    .reduce((s, t) => s + (t.targetRevenue || 0), 0);
}

/** 기간 내 합산 목표 영업이익 */
export function sumTargetProfit(
  targets: TargetRow[],
  from: string,
  to: string,
  type: TargetRow["type"] = "전체",
  key: string = "-",
): number {
  const fromYm = toYmd(from).slice(0, 6);
  const toYm = toYmd(to).slice(0, 6);
  return targets
    .filter((t) => t.type === type && (type === "전체" ? true : t.key === key))
    .filter((t) => t.period.replace(/[^0-9]/g, "") >= fromYm && t.period.replace(/[^0-9]/g, "") <= toYm)
    .reduce((s, t) => s + (t.targetProfit || 0), 0);
}

// ─────────────────────────────────────────
// 5. 당일 / 미수 / 편의 함수
// ─────────────────────────────────────────

/** 당일 매출 */
export function todayRevenue(rows: SaleRow[]): number {
  const ymd = todayYmd();
  return revenue(rows.filter((r) => toYmd(r.saleDate) === ymd));
}

/** 현재 남아있는 미수금 총액 (status === "outstanding" 또는 remaining 기준) */
export function outstandingReceivable(rows: ReceivableRow[]): number {
  return rows
    .filter((r) => r.status === "outstanding")
    .reduce((s, r) => s + r.remaining, 0);
}

// ─────────────────────────────────────────
// 6. 6개 메인 KPI 집계
// ─────────────────────────────────────────

export interface MainKpi {
  totalRevenue: number;
  targetRevenue: number;
  achievementPct: number | null;      // null = 목표 없음
  yoyRevenuePct: number | null;       // null = 전년 데이터 없음
  totalProfit: number;
  totalReceivable: number;
  // 참고용 전년값
  prevRevenue: number;
  prevProfit: number;
  profitYoyPct: number | null;
}

export function computeMainKpi(args: {
  sales: SaleRow[];         // 전체 기간 (전년 비교용)
  filteredSales: SaleRow[]; // 필터 + 기간 적용된 매출
  profits: ProfitRow[];     // 전체 기간
  receivables: ReceivableRow[];
  targets: TargetRow[];
  from: string;             // 현재 기간
  to: string;
}): MainKpi {
  const { sales, filteredSales, profits, receivables, targets, from, to } = args;

  const totalRevenue = revenue(filteredSales);
  const targetRevenue = sumTargetRevenue(targets, from, to, "전체", "-");

  const prev = shiftYearBack(from, to);
  const prevSales = sales.filter((s) => inRange(s.saleDate, prev.from, prev.to));
  const prevRevenue = revenue(prevSales);

  const curProfitRows = profits.filter((p) => inRange(p.saleDate, from, to));
  const totalProfit = profit(curProfitRows);
  const prevProfitRows = profits.filter((p) => inRange(p.saleDate, prev.from, prev.to));
  const prevProfit = profit(prevProfitRows);

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
