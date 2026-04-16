// ── 미수 현황 집계 ──
// 데이터 소스: 미수현황.csv (customer, team, remaining)
// 구매팀 제외 로직 유지

import type { ReceivableRow } from "./sheets";

// 거래처별
export interface ReceivableByCustomer {
  customer: string;
  team: string;
  remaining: number;
}

export function byCustomer(rows: ReceivableRow[]): ReceivableByCustomer[] {
  return [...rows]
    .sort((a, b) => b.remaining - a.remaining)
    .map((r) => ({ customer: r.customer, team: r.team, remaining: r.remaining }));
}

// 팀별 (구매팀 제외 옵션)
export interface ReceivableByTeam {
  team: string;
  remaining: number;
  customerCount: number;
}

export function byTeam(
  rows: ReceivableRow[],
  opts: { excludeTeam?: string } = { excludeTeam: "구매팀" },
): ReceivableByTeam[] {
  const map = new Map<string, { remaining: number; customers: Set<string> }>();
  for (const r of rows) {
    if (opts.excludeTeam && r.team === opts.excludeTeam) continue;
    const e = map.get(r.team) || { remaining: 0, customers: new Set<string>() };
    e.remaining += r.remaining;
    e.customers.add(r.customer);
    map.set(r.team, e);
  }
  return [...map.entries()]
    .map(([team, v]) => ({ team, remaining: v.remaining, customerCount: v.customers.size }))
    .sort((a, b) => b.remaining - a.remaining);
}

// 요약 KPI
export interface ReceivableSummary {
  totalRemaining: number;
  customerCount: number;
  teamCount: number;
}

export function summarize(rows: ReceivableRow[]): ReceivableSummary {
  const totalRemaining = rows.reduce((s, r) => s + r.remaining, 0);
  const customers = new Set(rows.map((r) => r.customer));
  const teams = new Set(rows.map((r) => r.team).filter(Boolean));
  return {
    totalRemaining,
    customerCount: customers.size,
    teamCount: teams.size,
  };
}
