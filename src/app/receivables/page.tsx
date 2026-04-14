"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useData } from "@/lib/dataContext";
import {
  PageHeader, ChartCard, LoadingState, ErrorState, MockBadge,
  TOOLTIP_STYLE, AXIS_STYLE, GRID_STROKE,
} from "@/components/ui";
import KpiCard from "@/components/KpiCard";
import { fmt, fmtKrw } from "@/lib/format";
import { byCustomer, byStaff, monthly, summarize } from "@/lib/receivable";

export default function ReceivablesPage() {
  const { receivables, loading, error, reload, usingMock } = useData();
  const [excludePurchase, setExcludePurchase] = useState(true);

  const summary = useMemo(() => summarize(receivables), [receivables]);
  const customerRows = useMemo(() => byCustomer(receivables), [receivables]);
  const staffRows = useMemo(
    () => byStaff(receivables, { excludeTeam: excludePurchase ? "구매팀" : undefined }),
    [receivables, excludePurchase],
  );
  const monthlyRows = useMemo(() => monthly(receivables), [receivables]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="미수 관리"
        subtitle="현재 잔액 기준 · 월별 누적은 발생월 기준"
        right={usingMock.receivable ? <MockBadge /> : undefined}
      />

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="총 미수금" value={fmtKrw(summary.totalRemaining)} icon="⚠️" accent="red" />
        <KpiCard label="미수 거래처" value={fmt(summary.customerCount)} unit="곳" icon="🏢" accent="amber" />
        <KpiCard label="평균 연체일수" value={fmt(summary.avgDaysOverdue)} unit="일" icon="📅" accent="slate" />
        <KpiCard label="90일 초과 건" value={fmt(summary.over90Count)} unit="건" icon="🚨" accent="red" />
      </div>

      {/* 거래처별 표 */}
      <ChartCard title="거래처별 미수 잔액" subtitle={`현재 잔액 기준 · ${customerRows.length}곳`}>
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">거래처</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">담당</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">팀</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">건수</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">최대 연체일</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">잔액</th>
              </tr>
            </thead>
            <tbody>
              {customerRows.map((c) => (
                <tr key={c.customer} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-2 text-xs text-slate-900 font-medium">{c.customer}</td>
                  <td className="py-2 px-2 text-xs text-slate-500">{c.staff}</td>
                  <td className="py-2 px-2 text-xs text-slate-500">{c.team}</td>
                  <td className="py-2 px-2 text-xs text-slate-700 text-right">{c.countOutstanding}</td>
                  <td className={`py-2 px-2 text-xs text-right font-medium ${c.maxDaysOverdue > 90 ? "text-red-600" : c.maxDaysOverdue > 60 ? "text-amber-600" : "text-slate-700"}`}>
                    {c.maxDaysOverdue}일
                  </td>
                  <td className="py-2 px-2 text-xs text-red-600 font-semibold text-right whitespace-nowrap">{fmtKrw(c.remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* 담당자별 바 차트 (구매팀 제외 토글) */}
      <ChartCard
        title="담당자별 미수 잔액"
        subtitle="현재 잔액 기준 (만원)"
        right={
          <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={excludePurchase}
              onChange={(e) => setExcludePurchase(e.target.checked)}
              className="rounded"
            />
            구매팀 제외
          </label>
        }
      >
        {staffRows.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">데이터 없음</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(220, staffRows.length * 40)}>
            <BarChart
              data={staffRows.map((s) => ({ ...s, remainingMan: Math.round(s.remaining / 10000) }))}
              layout="vertical" margin={{ left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
              <XAxis type="number" {...AXIS_STYLE} tickFormatter={(v) => fmt(v)} />
              <YAxis type="category" dataKey="staff" tick={{ fill: "#0F172A", fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v) => [fmt(Number(v)) + "만원", "잔액"]}
              />
              <Bar dataKey="remainingMan" fill="#EF4444" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* 월별 누적 (발생) vs 현재 잔액 */}
      <ChartCard title="월별 미수 추이" subtitle="발생월 기준 발생액 · 현재 잔여액 (만원)">
        {monthlyRows.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">데이터 없음</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRows.map((m) => ({
              name: m.period,
              발생액: Math.round(m.occurredTotal / 10000),
              현재잔액: Math.round(m.remainingNow / 10000),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="name" {...AXIS_STYLE} />
              <YAxis {...AXIS_STYLE} tickFormatter={(v) => fmt(v)} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v, n) => [fmt(Number(v)) + "만원", String(n)]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="발생액" stroke="#94A3B8" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="현재잔액" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
