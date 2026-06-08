// ── 상품 마스터 데이터 ──
// Phase 2: 신상품 분류를 위한 상품 레지스트리

export type ProductGroup = "신상품" | "기존상품" | "전략상품" | "프로모션상품" | "단종예정";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  launchDate: string;
  productGroup?: ProductGroup;
  isNewProductOverride?: boolean;
}

// 케이블타이 신상품 14개
const cableTieNewProducts: Product[] = [
  { id: "BT-10W", name: "케이블타이 BT-10W (100mm 백색)", category: "케이블타이", price: 2000, launchDate: "2026-05-19" },
  { id: "BT-10B", name: "케이블타이 BT-10B (100mm 흑색)", category: "케이블타이", price: 2000, launchDate: "2026-05-19" },
  { id: "BT-14W", name: "케이블타이 BT-14W (140mm 백색)", category: "케이블타이", price: 4050, launchDate: "2026-05-19" },
  { id: "BT-14B", name: "케이블타이 BT-14B (140mm 흑색)", category: "케이블타이", price: 4050, launchDate: "2026-05-19" },
  { id: "BT-20W", name: "케이블타이 BT-20W (200mm 백색)", category: "케이블타이", price: 8800, launchDate: "2026-05-19" },
  { id: "BT-20B", name: "케이블타이 BT-20B (200mm 흑색)", category: "케이블타이", price: 8800, launchDate: "2026-05-19" },
  { id: "BT-27W", name: "케이블타이 BT-27W (270mm 백색)", category: "케이블타이", price: 9050, launchDate: "2026-05-19" },
  { id: "BT-27B", name: "케이블타이 BT-27B (270mm 흑색)", category: "케이블타이", price: 9050, launchDate: "2026-05-19" },
  { id: "BT-30W", name: "케이블타이 BT-30W (300mm 백색)", category: "케이블타이", price: 7950, launchDate: "2026-05-19" },
  { id: "BT-30B", name: "케이블타이 BT-30B (300mm 흑색)", category: "케이블타이", price: 7950, launchDate: "2026-05-19" },
  { id: "BT-37W", name: "케이블타이 BT-37W (370mm 백색)", category: "케이블타이", price: 9400, launchDate: "2026-05-19" },
  { id: "BT-37B", name: "케이블타이 BT-37B (370mm 흑색)", category: "케이블타이", price: 9400, launchDate: "2026-05-19" },
  { id: "BT-45W", name: "케이블타이 BT-45W (450mm 백색)", category: "케이블타이", price: 5850, launchDate: "2026-05-19" },
  { id: "BT-45B", name: "케이블타이 BT-45B (450mm 흑색)", category: "케이블타이", price: 5850, launchDate: "2026-05-19" },
];

// 방진복 신상품 6개
const dustSuitNewProducts: Product[] = [
  { id: "BP-1W", name: "일반형 방진복 24EA 백색 XL", category: "방진복", price: 1100, launchDate: "2026-05-19" },
  { id: "BP-1B", name: "일반형 방진복 24EA 회색 XL", category: "방진복", price: 1100, launchDate: "2026-05-19" },
  { id: "BP-2W", name: "일반형 방진복 24EA 백색 XXL", category: "방진복", price: 1100, launchDate: "2026-05-19" },
  { id: "BP-2B", name: "일반형 방진복 24EA 회색 XXL", category: "방진복", price: 1100, launchDate: "2026-05-19" },
  { id: "BP-3W", name: "일반형 방진복 24EA 백색 XXXL", category: "방진복", price: 1100, launchDate: "2026-05-19" },
  { id: "BP-3B", name: "일반형 방진복 24EA 회색 XXXL", category: "방진복", price: 1100, launchDate: "2026-05-19" },
];

export const NEW_PRODUCTS: Product[] = [...cableTieNewProducts, ...dustSuitNewProducts];

export const PRODUCT_REGISTRY: Record<string, Product> = Object.fromEntries(
  NEW_PRODUCTS.map((p) => [p.id, p]),
);
