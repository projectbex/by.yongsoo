"use client";

import { useState, useMemo, useCallback } from "react";
import { useData } from "@/lib/dataContext";
import { PageHeader, ChartCard, LoadingState, ErrorState } from "@/components/ui";
import { fmt, fmtKrw } from "@/lib/format";
import { calculateBexKPI, buildBwKpiInput, type BwKpiInput, type BwKpiResult } from "@/lib/kpi";

const EXAMPLE_2025: BwKpiInput = {
  drumPrevious: 2945,
  drumCurrent: 3095,
  eaPrevious: 5995813,
  eaCurrent: 5741006,
  drumRevenue: 1779178400,
  eaRevenue: 21769535619,
  profitPlan: 2651297264,
  profitActual: 4404050777,
};

const EMPTY: BwKpiInput = {
  drumPrevious: 0,
  drumCurrent: 0,
  eaPrevious: 0,
  eaCurrent: 0,
  drumRevenue: 0,
  eaRevenue: 0,
  profitPlan: 0,
  profitActual: 0,
};

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

function NumberInput({
  label, value, onChange, suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-500 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          value={value === 0 ? "" : fmt(value)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.-]/g, "");
            onChange(raw === "" ? 0 : parseFloat(raw));
          }}
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {suffix && <span className="text-[11px] text-slate-400 min-w-fit">{suffix}</span>}
      </div>
    </div>
  );
}

export default function SimulatorPage() {
  const { sales, targets, loading, error, reload } = useData();
  const currentYear = new Date().getFullYear();

  const [input, setInput] = useState<BwKpiInput>(EMPTY);

  const update = useCallback((field: keyof BwKpiInput, value: number) => {
    setInput((prev) => ({ ...prev, [field]: value }));
  }, []);

  const result: BwKpiResult = useMemo(() => calculateBexKPI(input), [input]);

  const loadCurrent = useCallback(() => {
    const built = buildBwKpiInput({ allSales: sales, targets, year: currentYear });
    setInput(built);
  }, [sales, targets, currentYear]);

  const loadExample = useCallback(() => setInput(EXAMPLE_2025), []);
  const reset = useCallback(() => setInput(EMPTY), []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const hasInput = Object.values(input).some((v) => v !== 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="KPI 산식 시뮬레이터"
        subtitle="입력값을 변경해 점수 변화를 시뮬레이션"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: 입력 */}
        <ChartCard title="입력값">
          <div className="space-y-5">
            {/* 판매수량 */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                판매수량
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="DRUM 전년" value={input.drumPrevious} onChange={(v) => update("drumPrevious", v)} suffix="개" />
                <NumberInput label="DRUM 당해" value={input.drumCurrent} onChange={(v) => update("drumCurrent", v)} suffix="개" />
                <NumberInput label="EA 전년" value={input.eaPrevious} onChange={(v) => update("eaPrevious", v)} suffix="개" />
                <NumberInput label="EA 당해" value={input.eaCurrent} onChange={(v) => update("eaCurrent", v)} suffix="개" />
              </div>
            </div>

            {/* 매출 금액 */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                매출 금액
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="DRUM 매출" value={input.drumRevenue} onChange={(v) => update("drumRevenue", v)} suffix="원" />
                <NumberInput label="EA 매출" value={input.eaRevenue} onChange={(v) => update("eaRevenue", v)} suffix="원" />
              </div>
            </div>

            {/* 영업이익 */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                영업이익
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="계획" value={input.profitPlan} onChange={(v) => update("profitPlan", v)} suffix="원" />
                <NumberInput label="실적" value={input.profitActual} onChange={(v) => update("profitActual", v)} suffix="원" />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={loadCurrent}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
              >
                현재 BEX 값 불러오기
              </button>
              <button
                onClick={loadExample}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
              >
                예시값 채우기
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
              >
                초기화
              </button>
            </div>
          </div>
        </ChartCard>

        {/* 우측: 결과 */}
        <div className="space-y-6">
          {/* 종합 점수 */}
          <div className={`rounded-2xl border-2 p-6 ${hasInput ? gradeBg(result.grade) : "bg-slate-50 border-slate-200"}`}>
            <p className="text-sm font-medium text-slate-500 mb-1">종합 점수</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-slate-900">
                {hasInput ? result.totalScore.toFixed(1) : "—"}
              </span>
              <span className="text-sm text-slate-500">점</span>
              {hasInput && (
                <span className={`text-2xl font-bold ${gradeColor(result.grade)}`}>
                  {result.grade}등급
                </span>
              )}
            </div>
          </div>

          {/* 산출 과정 */}
          <ChartCard title="산출 과정">
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div className="text-slate-500">DRUM 성장률</div>
                <div className="text-right font-medium text-slate-900">
                  {hasInput ? `${(result.drumGrowth * 100).toFixed(2)}%` : "—"}
                </div>

                <div className="text-slate-500">EA 성장률</div>
                <div className="text-right font-medium text-slate-900">
                  {hasInput ? `${(result.eaGrowth * 100).toFixed(2)}%` : "—"}
                </div>

                <div className="col-span-2 border-t border-slate-100 my-1" />

                <div className="text-slate-500">DRUM 금액비중</div>
                <div className="text-right font-medium text-slate-900">
                  {hasInput ? `${(result.drumWeight * 100).toFixed(2)}%` : "—"}
                </div>

                <div className="text-slate-500">EA 금액비중</div>
                <div className="text-right font-medium text-slate-900">
                  {hasInput ? `${(result.eaWeight * 100).toFixed(2)}%` : "—"}
                </div>

                <div className="col-span-2 border-t border-slate-100 my-1" />

                <div className="text-slate-500">비중합산 결과</div>
                <div className="text-right font-medium text-slate-900">
                  {hasInput ? `${(result.totalWeighted * 100).toFixed(2)}%` : "—"}
                </div>

                <div className="text-blue-600 font-semibold">판매수량 점수 (50%)</div>
                <div className="text-right font-bold text-blue-600">
                  {hasInput ? `${result.salesScore.toFixed(2)}점` : "—"}
                </div>

                <div className="col-span-2 border-t border-slate-100 my-1" />

                <div className="text-slate-500">영업이익 달성률</div>
                <div className="text-right font-medium text-slate-900">
                  {hasInput ? `${(result.profitAchievement * 100).toFixed(2)}%` : "—"}
                </div>

                <div className="text-emerald-600 font-semibold">영업이익 점수 (50%)</div>
                <div className="text-right font-bold text-emerald-600">
                  {hasInput ? `${result.profitScore.toFixed(2)}점` : "—"}
                </div>

                <div className="col-span-2 border-t border-slate-200 my-1" />

                <div className="text-slate-900 font-bold text-base">종합</div>
                <div className="text-right font-bold text-base text-slate-900">
                  {hasInput ? `${result.totalScore.toFixed(2)}점` : "—"}
                </div>

                <div className="text-slate-900 font-bold text-base">등급</div>
                <div className={`text-right font-bold text-base ${hasInput ? gradeColor(result.grade) : "text-slate-400"}`}>
                  {hasInput ? result.grade : "—"}
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
