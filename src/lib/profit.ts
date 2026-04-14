// ── 영업이익 분석 ──
//
// 핵심 규칙(사용자 확정):
//   profitRow 는 saleRow 와 "거래일자 + 거래처 + 품목" 으로 매칭된다.
//   따라서 profitRow 집합 자체를 기간/필터로 자르면
//   매출 · 영업이익 · 이익률 · 동기비 · 목표달성률이 모두 일관되게 계산된다.
//
// 제공 함수:
//   buildProfitKey(row)        → 매칭 키
//   indexProfitByKey(profits)  → Map<key, ProfitRow> (cost 조회용)
//   summarizeProfit(...)       → 유종/담당/거래처별 집계

import type { ProfitRow, TargetRow, SaleRow } from "./sheets";
import { toMainCategory, type MainCategory } from "./category";
import { inRange, shiftYearBack, yoy, achievement, marginPct, revenue, profit, toYmd } from "./kpi";

export type ProfitGroupKey = "category" | "staff" | "customer";

// ── Row 매칭 키 ──
// 거래일자(YYYYMMDD) | 거래처 | 품목
export function buildProfitKey(row: { saleDate: string; customer: string; product: string }): string {
  return `${toYmd(row.saleDate)}|${row.customer}|${row.product}`;
}

// ── 원가 조회용 인덱스 ──
export function indexProfitByKey(profits: ProfitRow[]): Map<string, ProfitRow> {
  const map = new Map<string, ProfitRow>();
  for (const p of profits) map.set(buildProfitKey(p), p);
  return map;
}

/**
 * 매출 행 배열에 cost를 머지해 ProfitRow[]로 반환.
 * cost를 찾지 못하면 0 (→ 이익 = 매출 전액).
 * 실제 운영에서는 "매칭 실패율"을 로그로 노출하기도 함.
 */
export function mergeCostIntoSales(sales: SaleRow[], profits: ProfitRow[]): ProfitRow[] {
  const idx = indexProfitByKey(profits);
  return sales.map((s) => {
    const key = buildProfitKey(s);
    const p = idx.get(key);
    return {
      ...s,
      cost: p ? p.cost : 0,
    };
  });
}

// ── 그룹핑 함수 ──
function pickKey(row: ProfitRow, group: ProfitGroupKey): string {
  if (group === "category") return toMainCategory(row.product);
  if (group === "staff") return row.staff || "미지정";
  return row.customer || "미지정";
}

// ── 결과 타입 ──
export interface ProfitSummary {
  key: string;
  revenue: number;
  profit: number;
  marginPct: number;
  prevRevenue: number;
  prevProfit: number;
  yoyRevenuePct: number | null;
  yoyProfitPct: number | null;
  target: number;
  achievementPct: number | null;   // null = 목표 없음
}

/**
 * 유종/담당/거래처별 영업이익 요약.
 *   rows     : 전체 profit 데이터 (기간 필터 아직 적용 안 된 것)
 *   targets  : 목표 데이터 (type === group에 해당하는 것만 사용)
 *   from/to  : 현재 기간
 */
export function summarizeProfit(args: {
  rows: ProfitRow[];
  targets: TargetRow[];
  from: string;
  to: string;
  group: ProfitGroupKey;
}): ProfitSummary[] {
  const { rows, targets, from, to, group } = args;

  const cur = rows.filter((r) => inRange(r.saleDate, from, to));
  const prev = shiftYearBack(from, to);
  const prv = rows.filter((r) => inRange(r.saleDate, prev.from, prev.to));

  // 그룹별 현재/전년 합산
  const curMap = new Map<string, { rev: number; prf: number }>();
  for (const r of cur) {
    const k = pickKey(r, group);
    const e = curMap.get(k) || { rev: 0, prf: 0 };
    e.rev += r.supplyAmount + r.taxAmount;
    e.prf += (r.supplyAmount + r.taxAmount) - r.cost;
    curMap.set(k, e);
  }

  const prvMap = new Map<string, { rev: number; prf: number }>();
  for (const r of prv) {
    const k = pickKey(r, group);
    const e = prvMap.get(k) || { rev: 0, prf: 0 };
    e.rev += r.supplyAmount + r.taxAmount;
    e.prf += (r.supplyAmount + r.taxAmount) - r.cost;
    prvMap.set(k, e);
  }

  // 목표 매핑 (type === group에 해당하는 것만, 기간 내 합산)
  const targetTypeMap: Record<ProfitGroupKey, TargetRow["type"]> = {
    category: "유종",
    staff: "담당자",
    customer: "거래처",
  };
  const targetType = targetTypeMap[group];
  const fromYm = toYmd(from).slice(0, 6);
  const toYm = toYmd(to).slice(0, 6);
  const targetMap = new Map<string, number>();
  targets
    .filter((t) => t.type === targetType)
    .filter((t) => {
      const ym = t.period.replace(/[^0-9]/g, "");
      return ym >= fromYm && ym <= toYm;
    })
    .forEach((t) => {
      targetMap.set(t.key, (targetMap.get(t.key) || 0) + (t.targetProfit || 0));
    });

  // 결과 조립
  const results: ProfitSummary[] = [];
  for (const [key, c] of curMap.entries()) {
    const p = prvMap.get(key) || { rev: 0, prf: 0 };
    const target = targetMap.get(key) || 0;
    results.push({
      key,
      revenue: c.rev,
      profit: c.prf,
      marginPct: marginPct(c.prf, c.rev),
      prevRevenue: p.rev,
      prevProfit: p.prf,
      yoyRevenuePct: yoy(c.rev, p.rev),
      yoyProfitPct: yoy(c.prf, p.prf),
      target,
      achievementPct: achievement(c.prf, target),
    });
  }

  return results.sort((a, b) => b.profit - a.profit);
}

// ── 유종 4분류 합계 (도넛/카테고리 도넛용) ──
export function revenueByMainCategory(
  rows: Array<{ product: string; supplyAmount: number; taxAmount: number }>,
): Record<MainCategory, number> {
  const base: Record<MainCategory, number> = { "WD-40": 0, "케이블타이": 0, "방진복": 0, "기타": 0 };
  for (const r of rows) {
    const c = toMainCategory(r.product);
    base[c] += r.supplyAmount + r.taxAmount;
  }
  return base;
}
