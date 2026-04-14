"use client";

import { fmtPct, deltaColor, deltaBg } from "@/lib/format";

interface Props {
  label: string;
  value: string;
  unit?: string;
  /**
   * 증감률 (%). null = 비교 데이터 없음 (예: 목표 미설정/전년 데이터 없음)
   * 이 경우 deltaFallback 문자열을 표시한다.
   */
  delta?: number | null;
  deltaLabel?: string;        // "전년동기" 등 라벨
  deltaFallback?: string;     // delta=null 일 때 표시 (기본 "—")
  icon?: React.ReactNode;
  accent?: "blue" | "emerald" | "amber" | "red" | "violet" | "slate";
}

const ACCENT_BAR: Record<NonNullable<Props["accent"]>, string> = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  violet: "bg-violet-500",
  slate: "bg-slate-400",
};

export default function KpiCard({
  label, value, unit, delta, deltaLabel, deltaFallback = "—", icon, accent = "blue",
}: Props) {
  const hasDelta = delta !== undefined && delta !== null && isFinite(delta);

  return (
    <div className="relative bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col gap-3 overflow-hidden">
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${ACCENT_BAR[accent]}`} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        {icon && <span className="text-slate-400 text-base">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
      {delta !== undefined && (
        hasDelta ? (
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold w-fit ${deltaBg(delta!)} ${deltaColor(delta!)}`}>
              {delta! > 0 ? "▲" : delta! < 0 ? "▼" : "─"} {fmtPct(delta!)}
            </span>
            {deltaLabel && <span className="text-[10px] text-slate-400">{deltaLabel}</span>}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-500 bg-slate-100 w-fit">
              {deltaFallback}
            </span>
            {deltaLabel && <span className="text-[10px] text-slate-400">{deltaLabel}</span>}
          </div>
        )
      )}
    </div>
  );
}
