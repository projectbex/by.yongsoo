"use client";

const COLORS: Record<string, string> = {
  "진행": "bg-blue-50 text-blue-700 border-blue-200",
  "종결": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "취소": "bg-red-50 text-red-700 border-red-200",
  "잔량": "bg-amber-50 text-amber-700 border-amber-200",
  "단종예정": "bg-orange-50 text-orange-700 border-orange-200",
  "런칭예정": "bg-violet-50 text-violet-700 border-violet-200",
  "단종": "bg-red-50 text-red-700 border-red-200",
  "제조": "bg-blue-50 text-blue-700 border-blue-200",
  "부자재": "bg-amber-50 text-amber-700 border-amber-200",
  "소모품": "bg-violet-50 text-violet-700 border-violet-200",
  "활성": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "비활성": "bg-slate-100 text-slate-500 border-slate-200",
};

const ICONS: Record<string, string> = {
  "제조": "🏭",
  "부자재": "📦",
  "소모품": "📮",
};

export default function ScmBadge({ label, showIcon = false }: { label: string; showIcon?: boolean }) {
  const cls = COLORS[label] || "bg-slate-100 text-slate-600 border-slate-200";
  const icon = showIcon ? ICONS[label] : undefined;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${cls}`}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}
