"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useData } from "@/lib/dataContext";
import {
  PageHeader, ChartCard, LoadingState, ErrorState,
  TOOLTIP_STYLE, AXIS_STYLE, GRID_STROKE,
} from "@/components/ui";
import KpiCard from "@/components/KpiCard";
import { fmt, fmtKrw } from "@/lib/format";
import { byCustomer, byTeam, summarize } from "@/lib/receivable";

export default function ReceivablesPage() {
  const { receivables, loading, error, reload } = useData();
  const [excludePurchase, setExcludePurchase] = useState(true);

  const summary = useMemo(() => summarize(receivables), [receivables]);
  const customerRows = useMemo(() => byCustomer(receivables), [receivables]);
  const teamRows = useMemo(
    () => byTeam(receivables, { excludeTeam: excludePurchase ? "구매팀" : undefined }),
    [receivables, excludePurchase],
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="미수 관리"
        subtitle="현재 잔액 기준"
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <KpiCard label="총 미수금" value={fmtKrw(summary.totalRemaining)} icon="⚠️" accent="red" />
        <KpiCard label="미수 거래처" value={fmt(summary.customerCount)} unit="곳" icon="🏢" accent="amber" />
        <KpiCard label="관련 팀" value={fmt(summary.teamCount)} unit="팀" icon="👥" accent="slate" />
      </div>

      {/* 거래처별 표 */}
      <ChartCard title="거래처별 미수 잔액" subtitle={`현재 잔액 기준 · ${customerRows.length}곳`}>
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">거래처</th>
                <th className="text-left py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">팀</th>
                <th className="text-right py-2 px-2 text-[11px] font-semibold text-slate-500 uppercase">잔액</th>
              </tr>
            </thead>
            <tbody>
              {customerRows.map((c) => (
                <tr key={c.customer} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-2 text-xs text-slate-900 font-medium">{c.customer}</td>
                  <td className="py-2 px-2 text-xs text-slate-500">{c.team}</td>
                  <td className="py-2 px-2 text-xs text-red-600 font-semibold text-right whitespace-nowrap">{fmtKrw(c.remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* 팀별 바 차트 (구매팀 제외 토글) */}
      <ChartCard
        title="팀별 미수 잔액"
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
        {teamRows.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">데이터 없음</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(220, teamRows.length * 40)}>
            <BarChart
              data={teamRows.map((s) => ({ ...s, remainingMan: Math.round(s.remaining / 10000) }))}
              layout="vertical" margin={{ left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
              <XAxis type="number" {...AXIS_STYLE} tickFormatter={(v) => fmt(v)} />
              <YAxis type="category" dataKey="team" tick={{ fill: "#0F172A", fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v) => [fmt(Number(v)) + "만원", "잔액"]}
              />
              <Bar dataKey="remainingMan" fill="#EF4444" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
