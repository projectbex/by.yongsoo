// ── 유종 대분류 (메인 4버킷) ──
// 규칙 (사용자 확정):
//   product 에 "WD"     포함 → "WD-40"
//   product 에 "케이블타이" 포함 → "케이블타이"
//   product 에 "방진복"  포함 → "방진복"
//   그 외                       → "기타"

export type MainCategory = "WD-40" | "케이블타이" | "방진복" | "기타";

export const MAIN_CATEGORIES: MainCategory[] = ["WD-40", "케이블타이", "방진복", "기타"];

export function toMainCategory(product: string): MainCategory {
  const p = (product || "").toUpperCase();
  if (p.includes("WD")) return "WD-40";
  if (product.includes("케이블타이")) return "케이블타이";
  if (product.includes("방진복")) return "방진복";
  return "기타";
}

// 색상 고정 매핑 (도넛/바 공통)
export const CATEGORY_COLOR: Record<MainCategory, string> = {
  "WD-40": "#3B82F6",
  "케이블타이": "#10B981",
  "방진복": "#F59E0B",
  "기타": "#94A3B8",
};
