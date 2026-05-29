"use client";

import { fmtPct, deltaColor, deltaBg } from "@/lib/format";

/*
 * Phase 1 UX 가독성 개선 (2026-05-22)
 * 변경 사항:
 *   - 라벨: text-[11px] → text-sm (14px)
 *   - 메인 숫자: text-2xl (24px) → text-[32px] / large → text-[40px]
 *   - delta 텍스트: text-[11px] → text-xs (12px)
 *   - delta 라벨: text-[10px] → text-xs
 *   - 카드 padding: p-5 → p-6 (24px)
 *   - 카드 gap: gap-3 → gap-2
 *   - 카드 최소 높이: min-h-[120px] 추가
 *   - 숫자 tabular-nums 추가 (정렬 깔끔)
 *   - 아이콘 크기: text-base → text-lg
 */

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
  size?: "large" | "medium";  // large: 핵심 KPI (40px), medium: 일반 (32px)
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
  label, value, unit, delta, deltaLabel, deltaFallback = "—", icon, accent = "blue", size = "medium",
}: Props) {
  const hasDelta = delta !== undefined && delta !== null && isFinite(delta);
  /*
   * 반응형 숫자 크기:
   *   large: 모바일 28px → sm 이상 40px
   *   medium: 모바일 24px → sm 이상 32px
   */
  const numberSize = size === "large"
    ? "text-[28px] sm:text-[40px]"
    : "text-2xl sm:text-[32px]";

  return (
    <div className="relative bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-2 min-h-[100px] sm:min-h-[120px]">
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${ACCENT_BAR[accent]}`} />
      {/* 라벨 — 모바일 13px, sm 이상 14px */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] sm:text-sm font-medium text-slate-500 tracking-tight">{label}</span>
        {icon && <span className="text-slate-400 text-lg">{icon}</span>}
      </div>
      {/* 메인 숫자 — 반응형: 모바일 24-28px / 데스크탑 32-40px */}
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className={`${numberSize} font-bold text-slate-900 leading-tight tracking-tight truncate`} style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
        {unit && <span className="text-sm sm:text-base text-slate-500 shrink-0">{unit}</span>}
      </div>
      {/* 증감률 — 12px */}
      {delta !== undefined && (
        hasDelta ? (
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold w-fit ${deltaBg(delta!)} ${deltaColor(delta!)}`}>
              {delta! > 0 ? "▲" : delta! < 0 ? "▼" : "─"} {fmtPct(delta!)}
            </span>
            {deltaLabel && <span className="text-xs text-slate-400">{deltaLabel}</span>}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-slate-500 bg-slate-100 w-fit">
              {deltaFallback}
            </span>
            {deltaLabel && <span className="text-xs text-slate-400">{deltaLabel}</span>}
          </div>
        )
      )}
    </div>
  );
}
