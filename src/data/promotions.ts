// ── 프로모션 마스터 ──
// Phase 4: 진행 중인 프로모션/행사 관리

export type PromotionType = "N+1" | "증정" | "할인" | "행사단가" | "KD가" | "묶음할인";

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  startDate: string;
  endDate: string;
  applicableProductIds: string[];
  excludedProductIds?: string[];
  buyQuantity?: number;
  freeQuantity?: number;
  freeProductId?: string;
  description: string;
  isActive: boolean;
}

export const PROMOTIONS: Promotion[] = [
  {
    id: "PROMO-CT-202605",
    name: "케이블타이 10+1 행사",
    type: "N+1",
    startDate: "2026-05-19",
    endDate: "2026-06-30",
    applicableProductIds: [
      "BT-10W", "BT-10B", "BT-14W", "BT-14B",
      "BT-20W", "BT-20B", "BT-30W", "BT-30B",
      "BT-45W", "BT-45B",
    ],
    excludedProductIds: ["BT-27W", "BT-27B", "BT-37W", "BT-37B"],
    buyQuantity: 10,
    freeQuantity: 1,
    freeProductId: "BT-20B",
    description: "사이즈 무관 10박스 발주시 BT-20B 1박스 증정. BT-27/37 제외.",
    isActive: true,
  },
  {
    id: "PROMO-BP-202605",
    name: "방진복 10+1 행사",
    type: "N+1",
    startDate: "2026-05-19",
    endDate: "2026-06-30",
    applicableProductIds: [
      "BP-1W", "BP-1B", "BP-2W", "BP-2B", "BP-3W", "BP-3B",
    ],
    buyQuantity: 10,
    freeQuantity: 1,
    description: "10박스 발주시 요청 사이즈 1박스 증정",
    isActive: true,
  },
  {
    id: "PROMO-CT-KD-202605",
    name: "케이블타이 KD가 (출시 한정)",
    type: "KD가",
    startDate: "2026-05-19",
    endDate: "2026-08-31",
    applicableProductIds: [
      "BT-10W", "BT-10B", "BT-14W", "BT-14B", "BT-20W", "BT-20B",
      "BT-27W", "BT-27B", "BT-30W", "BT-30B", "BT-37W", "BT-37B",
      "BT-45W", "BT-45B",
    ],
    description: "8월까지 출시 프로모션 가격. 9월 이후 변동.",
    isActive: true,
  },
];

export function getActivePromotions(asOfDate: Date = new Date()): Promotion[] {
  return PROMOTIONS.filter(
    (p) =>
      p.isActive &&
      new Date(p.startDate) <= asOfDate &&
      new Date(p.endDate) >= asOfDate,
  );
}

export function getDaysUntilEnd(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
