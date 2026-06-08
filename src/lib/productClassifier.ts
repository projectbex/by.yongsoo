// ── 신상품 자동 판별 로직 ──
// Phase 2: 출시일 기준으로 신상품/기존상품 자동 분류

import type { Product, ProductGroup } from "@/data/products";

const NEW_PRODUCT_PERIOD_MONTHS: Record<string, number> = {
  "케이블타이": 12,
  "방진복": 12,
  "안전용품": 9,
  "WD-40": 6,
  "기타소비재": 6,
  "default": 6,
};

export function isNewProduct(product: Product, asOfDate: Date = new Date()): boolean {
  if (product.isNewProductOverride !== undefined) {
    return product.isNewProductOverride;
  }

  if (!product.launchDate) return false;

  const launchDate = new Date(product.launchDate);
  const monthsPeriod =
    NEW_PRODUCT_PERIOD_MONTHS[product.category] ?? NEW_PRODUCT_PERIOD_MONTHS.default;

  const monthsSinceLaunch =
    (asOfDate.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

  return monthsSinceLaunch <= monthsPeriod;
}

export function getProductGroup(product: Product, asOfDate: Date = new Date()): ProductGroup {
  if (product.productGroup) return product.productGroup;
  if (isNewProduct(product, asOfDate)) return "신상품";
  return "기존상품";
}

export function getMonthsSinceLaunch(launchDate: string, asOfDate: Date = new Date()): number {
  const launch = new Date(launchDate);
  const diff = (asOfDate.getTime() - launch.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  return Math.max(0, Math.round(diff * 10) / 10);
}
