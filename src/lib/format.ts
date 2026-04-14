// ── 숫자 포맷 유틸 (전역 공통) ──

/** 콤마 포맷 */
export function fmt(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(n));
}

/** 금액 → 억/만/원 자동 변환 */
export function fmtKrw(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100_000_000) return (n / 100_000_000).toFixed(1) + "억";
  if (abs >= 10_000) return (n / 10_000).toFixed(0) + "만";
  return fmt(n) + "원";
}

/** 퍼센트 표시 (+/-  부호 포함) */
export function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return sign + n.toFixed(1) + "%";
}

/** 증감 색상 (라이트 테마) */
export function deltaColor(n: number): string {
  if (n > 0) return "text-emerald-600";
  if (n < 0) return "text-red-600";
  return "text-slate-500";
}

/** 증감 배경 색상 (라이트 테마) */
export function deltaBg(n: number): string {
  if (n > 0) return "bg-emerald-50";
  if (n < 0) return "bg-red-50";
  return "bg-slate-100";
}

/** null 안전 퍼센트 — null일 때 fallback 문자열 반환 */
export function fmtPctOrNull(n: number | null, fallback = "—"): string {
  if (n === null || n === undefined || !isFinite(n)) return fallback;
  return fmtPct(n);
}
