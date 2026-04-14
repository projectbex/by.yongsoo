"use client";

import { fmtPct, deltaColor, deltaBg } from "@/lib/format";

interface Props {
  label: string;
  value: string;
  unit?: string;
  delta?: number;        // 전월 대비 증감률 %
  icon?: React.ReactNode;
}

export default function KpiCard({ label, value, unit, delta, icon }: Props) {
  return (
    <div className="bg-[#1F2937] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
        {icon && <span className="text-gray-500">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-white">{value}</span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium w-fit ${deltaBg(delta)} ${deltaColor(delta)}`}>
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "─"} {fmtPct(delta)}
        </div>
      )}
    </div>
  );
}
