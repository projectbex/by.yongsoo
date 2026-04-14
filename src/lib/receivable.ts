// ── 미수 현황 집계 ──
//
// 핵심 규칙 (사용자 확정):
//   · "현재 남아있는 미수금" 기준으로 계산 → status === "outstanding" + remaining
//   · 월별 누적: 발생월(occurredDate) 기준 그룹핑
//   · 월별 잔액(=월말 시점 잔여) 은 별도 snapshot 필드 또는 월별 합산
//
// 구매팀 제외는 호출 측에서 team === "구매팀" 필터 적용.

import type { ReceivableRow } from "./sheets";

// 거래처별 현재 잔액
export interface ReceivableByCustomer {
  customer: string;
  staff: string;
  team: string;
  remaining: number;           // 현재 남은 잔액 합
  maxDaysOverdue: number;
  countOutstanding: number;
}

export function byCustomer(rows: ReceivableRow[]): ReceivableByCustomer[] {
  const map = new Map<string, ReceivableByCustomer>();
  for (const r of rows) {
    if (r.status !== "outstanding") continue;
    const e = map.get(r.customer) || {
      customer: r.customer,
      staff: r.staff,
      team: r.team,
      remaining: 0,
      maxDaysOverdue: 0,
      countOutstanding: 0,
    };
    e.remaining += r.remaining;
    e.maxDaysOverdue = Math.max(e.maxDaysOverdue, r.daysOverdue);
    e.countOutstanding += 1;
    map.set(r.customer, e);
  }
  return [...map.values()].sort((a, b) => b.remaining - a.remaining);
}

// 담당자별 (구매팀 제외 옵션)
export interface ReceivableByStaff {
  staff: string;
  remaining: number;
  customerCount: number;
}

export function byStaff(
  rows: ReceivableRow[],
  opts: { excludeTeam?: string } = { excludeTeam: "구매팀" },
): ReceivableByStaff[] {
  const map = new Map<string, { remaining: number; customers: Set<string> }>();
  for (const r of rows) {
    if (r.status !== "outstanding") continue;
    if (opts.excludeTeam && r.team === opts.excludeTeam) continue;
    const e = map.get(r.staff) || { remaining: 0, customers: new Set<string>() };
    e.remaining += r.remaining;
    e.customers.add(r.customer);
    map.set(r.staff, e);
  }
  return [...map.entries()]
    .map(([staff, v]) => ({ staff, remaining: v.remaining, customerCount: v.customers.size }))
    .sort((a, b) => b.remaining - a.remaining);
}

// 월별 누적 (발생월 기준) + 월별 잔여 미수 (현재 잔액 월별 합)
export interface ReceivableMonthly {
  period: string;          // YYYY-MM
  occurredTotal: number;   // 해당 월에 "발생한" 미수 총액 (초기 amount)
  remainingNow: number;    // 해당 월에 발생해서 "현재까지 남아있는" 잔액
}

export function monthly(rows: ReceivableRow[]): ReceivableMonthly[] {
  const map = new Map<string, { occurred: number; remaining: number }>();
  for (const r of rows) {
    const ym = r.occurredDate.slice(0, 7);
    if (!ym) continue;
    const e = map.get(ym) || { occurred: 0, remaining: 0 };
    e.occurred += r.amount;
    if (r.status === "outstanding") e.remaining += r.remaining;
    map.set(ym, e);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({ period, occurredTotal: v.occurred, remainingNow: v.remaining }));
}

// 요약 KPI
export interface ReceivableSummary {
  totalRemaining: number;
  customerCount: number;
  avgDaysOverdue: number;
  over90Count: number;       // 90일 초과 연체 건
}

export function summarize(rows: ReceivableRow[]): ReceivableSummary {
  const outs = rows.filter((r) => r.status === "outstanding");
  const totalRemaining = outs.reduce((s, r) => s + r.remaining, 0);
  const customers = new Set(outs.map((r) => r.customer));
  const avg = outs.length > 0 ? outs.reduce((s, r) => s + r.daysOverdue, 0) / outs.length : 0;
  const over90 = outs.filter((r) => r.daysOverdue > 90).length;
  return {
    totalRemaining,
    customerCount: customers.size,
    avgDaysOverdue: Math.round(avg),
    over90Count: over90,
  };
}
