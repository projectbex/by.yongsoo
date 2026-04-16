// ── 유종 카테고리 (ERP category 필드 기준) ──
// 통합데이터.csv 의 category 컬럼을 그대로 사용.
// 도넛 차트/색상용 유틸.

// 도넛 차트 색상 팔레트 (최대 12개, 초과 시 순환)
const PALETTE = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
  "#84CC16", "#14B8A6", "#A855F7", "#E11D48",
];

export function getCategoryColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

/** SaleRow[] 에서 고유 카테고리 목록 추출 (매출 내림차순) */
export function extractCategories(rows: Array<{ category: string; revenue: number }>): string[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.category, (map.get(r.category) || 0) + r.revenue);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);
}

/** 카테고리별 매출 집계 */
export function revenueByCategory(rows: Array<{ category: string; revenue: number }>): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.category, (map.get(r.category) || 0) + r.revenue);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .filter((d) => d.value > 0);
}
