"use client";

import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useData } from "@/lib/dataContext";
import { PageHeader, ChartCard, LoadingState, ErrorState, TOOLTIP_STYLE, AXIS_STYLE, GRID_STROKE } from "@/components/ui";
import KpiCard from "@/components/KpiCard";
import { fmt, fmtKrw } from "@/lib/format";
import {
  buildBwKpiInput, calculateBexKPI, monthlyKpiScores, isDrum,
  type BwKpiResult,
} from "@/lib/kpi";

const GRADE_TABLE = [
  { grade: "S", range: "110점 초과", color: "text-blue-600" },
  { grade: "A", range: "100 ~ 110", color: "text-emerald-600" },
  { grade: "B", range: "90 ~ 100", color: "text-amber-600" },
  { grade: "C", range: "80 ~ 90", color: "text-orange-600" },
  { grade: "D", range: "80점 이하", color: "text-red-600" },
];

function gradeColor(grade: string): string {
  switch (grade) {
    case "S": return "text-blue-600";
    case "A": return "text-emerald-600";
    case "B": return "text-amber-600";
    case "C": return "text-orange-600";
    default: return "text-red-600";
  }
}

function gradeBg(grade: string): string {
  switch (grade) {
    case "S": return "bg-blue-50 border-blue-200";
    case "A": return "bg-emerald-50 border-emerald-200";
    case "B": return "bg-amber-50 border-amber-200";
    case "C": return "bg-orange-50 border-orange-200";
    default: return "bg-red-50 border-red-200";
  }
}

export default function KpiPage() {
  const { sales, targets, loading, error, reload } = useData();
  const currentYear = new Date().getFullYear();

  const { input, result, prevResult } = useMemo(() => {
    const inp = buildBwKpiInput({ allSales: sales, targets, year: currentYear });
    const res = calculateBexKPI(inp);

    const prevInp = buildBwKpiInput({ allSales: sales, targets, year: currentYear - 1 });
    const prevRes = calculateBexKPI(prevInp);

    return { input: inp, result: res, prevResult: prevRes };
  }, [sales, targets, currentYear]);

  const monthly = useMemo(
    () => monthlyKpiScores({ allSales: sales, targets, year: currentYear }),
    [sales, targets, currentYear],
  );

  const warnings = useMemo(() => {
    const items: Array<{ type: "warn" | "ok"; text: string }> = [];

    const drumGrowthPct = (result.drumGrowth - 1) * 100;
    const eaGrowthPct = (result.eaGrowth - 1) * 100;

    if (eaGrowthPct < 0) {
      items.push({ type: "warn", text: `EA 판매수량 전년比 ${eaGrowthPct.toFixed(1)}% 하락` });
    } else {
      items.push({ type: "ok", text: `EA 판매수량 전년比 +${eaGrowthPct.toFixed(1)}% 성장` });
    }

    if (drumGrowthPct < 0) {
      items.push({ type: "warn", text: `DRUM 판매수량 전년比 ${drumGrowthPct.toFixed(1)}% 하락` });
    } else {
      items.push({ type: "ok", text: `DRUM 판매수량 전년比 +${drumGrowthPct.toFixed(1)}% 성장` });
    }

    if (result.profitAchievement < 1) {
      items.push({ type: "warn", text: `영업이익 계획 대비 ${(result.profitAchievement * 100).toFixed(1)}% (미달)` });
    } else {
      items.push({ type: "ok", text: `영업이익 계획 대비 +${((result.profitAchievement - 1) * 100).toFixed(1)}% 초과 달성` });
    }

    return items;
  }, [result]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const scoreDelta = prevResult.totalScore > 0 ? result.totalScore - prevResult.totalScore : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="KPI 종합"
        subtitle={`${currentYear}년 누적 기준 · 범우연합 현행 산식 기반 BEX 실시간 평가`}
      />

      {/* 종합 점수 카드 */}
      <div className={`rounded-2xl border-2 p-6 ${gradeBg(result.grade)}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">예상 종합 점수</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-slate-900">{result.totalScore.toFixed(1)}</span>
              <span className="text-sm text-slate-500">점</span>
              <span className={`text-2xl font-bold ${gradeColor(result.grade)}`}>{result.grade}등급</span>
            </div>
            {scoreDelta !== null && (
              <p className="text-xs text-slate-500 mt-1">
                전년 동기 대비 {scoreDelta > 0 ? "+" : ""}{scoreDelta.toFixed(1)}점
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <div className="bg-white/80 rounded-xl px-4 py-3 text-center border border-slate-200">
              <p className="text-[10px] text-slate-500 mb-0.5">판매수량 점수</p>
              <p className="text-xl font-bold text-slate-900">{result.salesScore.toFixed(1)}</p>
              <p className="text-[10px] text-slate-400">/ 50점</p>
            </div>
            <div className="bg-white/80 rounded-xl px-4 py-3 text-center border border-slate-200">
              <p className="text-[10px] text-slate-500 mb-0.5">영업이익 점수</p>
              <p className="text-xl font-bold text-slate-900">{result.profitScore.toFixed(1)}</p>
              <p className="text-[10px] text-slate-400">/ 50점</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 구성 + 등급 기준 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI 구성 상세 */}
        <div className="lg:col-span-2">
          <ChartCard title="KPI 산출 상세">
            <div className="space-y-4">
              {/* 판매수량 성장률 */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  판매수량 성장률 (가중치 50%)
                </h4>
                <div className="bg-slate-50 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] text-slate-500 border-b border-slate-200">
                        <th className="text-left px-4 py-2 font-medium">구분</th>
                        <th className="text-right px-4 py-2 font-medium">전년 수량</th>
                        <th className="text-right px-4 py-2 font-medium">당해 수량</th>
                        <th className="text-right px-4 py-2 font-medium">성장률</th>
                        <th className="text-right px-4 py-2 font-medium">금액비중</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="px-4 py-2 font-medium text-slate-700">DRUM</td>
                        <td className="px-4 py-2 text-right text-slate-600">{fmt(input.drumPrevious)}</td>
                        <td className="px-4 py-2 text-right text-slate-600">{fmt(input.drumCurrent)}</td>
                        <td className="px-4 py-2 text-right text-slate-600">{(result.drumGrowth * 100).toFixed(2)}%</td>
                        <td className="px-4 py-2 text-right text-slate-600">{(result.drumWeight * 100).toFixed(2)}%</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="px-4 py-2 font-medium text-slate-700">EA</td>
                        <td className="px-4 py-2 text-right text-slate-600">{fmt(input.eaPrevious)}</td>
                        <td className="px-4 py-2 text-right text-slate-600">{fmt(input.eaCurrent)}</td>
                        <td className="px-4 py-2 text-right text-slate-600">{(result.eaGrowth * 100).toFixed(2)}%</td>
                        <td className="px-4 py-2 text-right text-slate-600">{(result.eaWeight * 100).toFixed(2)}%</td>
                      </tr>
                      <tr className="bg-blue-50/50 font-semibold">
                        <td className="px-4 py-2 text-slate-900">판매수량 점수</td>
                        <td colSpan={3} className="px-4 py-2 text-right text-slate-700">
                          비중합산 {(result.totalWeighted * 100).toFixed(2)}% x 50%
                        </td>
                        <td className="px-4 py-2 text-right text-blue-600 font-bold">{result.salesScore.toFixed(2)}점</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 영업이익 달성률 */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  영업이익 달성률 (가중치 50%)
                </h4>
                <div className="bg-slate-50 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] text-slate-500 border-b border-slate-200">
                        <th className="text-left px-4 py-2 font-medium">구분</th>
                        <th className="text-right px-4 py-2 font-medium">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="px-4 py-2 font-medium text-slate-700">영업이익 계획</td>
                        <td className="px-4 py-2 text-right text-slate-600">{fmtKrw(input.profitPlan)}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="px-4 py-2 font-medium text-slate-700">영업이익 실적</td>
                        <td className="px-4 py-2 text-right text-slate-600">{fmtKrw(input.profitActual)}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="px-4 py-2 font-medium text-slate-700">달성률</td>
                        <td className="px-4 py-2 text-right text-slate-600">{(result.profitAchievement * 100).toFixed(2)}%</td>
                      </tr>
                      <tr className="bg-emerald-50/50 font-semibold">
                        <td className="px-4 py-2 text-slate-900">영업이익 점수</td>
                        <td className="px-4 py-2 text-right text-emerald-600 font-bold">{result.profitScore.toFixed(2)}점</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* 등급 기준 */}
        <div>
          <ChartCard title="등급 기준">
            <div className="space-y-2">
              {GRADE_TABLE.map((g) => (
                <div
                  key={g.grade}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${
                    result.grade === g.grade ? "bg-slate-100 ring-1 ring-slate-300" : "bg-slate-50"
                  }`}
                >
                  <span className={`font-bold text-lg ${g.color}`}>{g.grade}</span>
                  <span className="text-sm text-slate-600">{g.range}</span>
                  {result.grade === g.grade && (
                    <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">현재</span>
                  )}
                </div>
              ))}
            </div>
          </ChartCard>

          {/* 위험 요인 */}
          <ChartCard title="상태 진단" className="mt-6">
            <div className="space-y-2">
              {warnings.map((w, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
                    w.type === "warn" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"
                  }`}
                >
                  <span className="mt-0.5">{w.type === "warn" ? "⚠" : "✓"}</span>
                  <span>{w.text}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* 월별 점수 추이 */}
      {monthly.length > 0 && (
        <ChartCard title="월별 누적 KPI 점수 추이" subtitle={`${currentYear}년 1월~${monthly[monthly.length - 1].label}`}>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthly} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="label" {...AXIS_STYLE} />
              <YAxis domain={[0, "auto"]} {...AXIS_STYLE} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE as React.CSSProperties}
                formatter={(value, name) => {
                  const labels: Record<string, string> = {
                    totalScore: "종합 점수",
                    salesScore: "판매수량 점수",
                    profitScore: "영업이익 점수",
                  };
                  return [`${value}점`, labels[String(name)] || String(name)];
                }}
              />
              <ReferenceLine y={110} stroke="#3B82F6" strokeDasharray="5 5" label={{ value: "S기준(110)", fill: "#3B82F6", fontSize: 11 }} />
              <ReferenceLine y={100} stroke="#10B981" strokeDasharray="5 5" label={{ value: "A기준(100)", fill: "#10B981", fontSize: 11 }} />
              <Line type="monotone" dataKey="totalScore" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} name="totalScore" />
              <Line type="monotone" dataKey="salesScore" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="salesScore" />
              <Line type="monotone" dataKey="profitScore" stroke="#10B981" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="profitScore" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
