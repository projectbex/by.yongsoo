// ── 영업이익 분석 ──

import type { SaleRow, TargetRow } from "./sheets";
import { inRange, shiftYearBack, yoy, achievement, marginPct, toYmd } from "./kpi";

export type ProfitGroupKey = "category" | "team" | "customer";

function pickKey(row: SaleRow, group: ProfitGroupKey): string {
  if (group === "category") return row.category || "미지정";
  if (group === "team") return row.team || "미지정";
  return row.customer || "미지정";
}

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
  achievementPct: number | null;
}

export function summarizeProfit(args: {
  rows: SaleRow[];
  targets: TargetRow[];
  from: string;
  to: string;
  group: ProfitGroupKey;
}): ProfitSummary[] {
  const { rows, targets, from, to, group } = args;

  const cur = rows.filter((r) => inRange(r.date, from, to));
  const prev = shiftYearBack(from, to);
  const prv = rows.filter((r) => inRange(r.date, prev.from, prev.to));

  const curMap = new Map<string, { rev: number; prf: number }>();
  for (const r of cur) {
    const k = pickKey(r, group);
    const e = curMap.get(k) || { rev: 0, prf: 0 };
    e.rev += r.revenue;
    e.prf += r.profit;
    curMap.set(k, e);
  }

  const prvMap = new Map<string, { rev: number; prf: number }>();
  for (const r of prv) {
    const k = pickKey(r, group);
    const e = prvMap.get(k) || { rev: 0, prf: 0 };
    e.rev += r.revenue;
    e.prf += r.profit;
    prvMap.set(k, e);
  }

  // 목표: 전체 합산만 있으므로 그룹별 목표 없음 (전체 합산을 참고)
  const fromYm = toYmd(from).slice(0, 6);
  const toYm = toYmd(to).slice(0, 6);
  void fromYm; void toYm; void targets;

  const results: ProfitSummary[] = [];
  for (const [key, c] of curMap.entries()) {
    const p = prvMap.get(key) || { rev: 0, prf: 0 };
    results.push({
      key,
      revenue: c.rev,
      profit: c.prf,
      marginPct: marginPct(c.prf, c.rev),
      prevRevenue: p.rev,
      prevProfit: p.prf,
      yoyRevenuePct: yoy(c.rev, p.rev),
      yoyProfitPct: yoy(c.prf, p.prf),
      target: 0,
      achievementPct: null,
    });
  }

  return results.sort((a, b) => b.profit - a.profit);
}
