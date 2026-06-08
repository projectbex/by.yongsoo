// ── 매출 집계 (신상품 + 내부/외부거래) ──
// Phase 2: 매출을 신상품 vs 기존상품으로 분리 집계
// Phase 3: 내부거래(그룹사) vs 외부거래 분리 집계

import type { SaleRow } from "./sheets";
import type { Product } from "@/data/products";
import { NEW_PRODUCTS } from "@/data/products";
import { isNewProduct } from "./productClassifier";
import { classifyCustomer } from "@/data/customerClassifier";
import type { InternalGroup } from "@/data/customerClassifier";

export interface SalesSummary {
  newProductRevenue: number;
  existingProductRevenue: number;
  totalRevenue: number;
  newProductRatio: number;
  // Phase 3: 내부/외부 매출
  externalRevenue: number;
  internalRevenue: number;
  externalRatio: number;
  internalByGroup: { group: string; revenue: number; count: number }[];
}

export interface NewProductDetail {
  id: string;
  name: string;
  category: string;
  launchDate: string;
  monthlyRevenue: number;
  cumulativeRevenue: number;
  quantity: number;
}

function matchesNewProduct(productName: string, product: Product): boolean {
  const upper = productName.toUpperCase();
  const idUpper = product.id.toUpperCase();
  if (upper.includes(idUpper)) return true;
  const nameKeywords = product.name.toUpperCase();
  if (upper === nameKeywords) return true;
  return false;
}

function findNewProduct(productName: string): Product | null {
  for (const p of NEW_PRODUCTS) {
    if (matchesNewProduct(productName, p)) return p;
  }
  return null;
}

export function aggregateSales(
  salesItems: SaleRow[],
  asOfDate: Date = new Date(),
): SalesSummary {
  let newRevenue = 0;
  let existingRevenue = 0;
  let externalRevenue = 0;
  let internalRevenue = 0;

  // Phase 3: 그룹사별 집계
  const groupMap = new Map<string, { revenue: number; count: number }>();

  for (const item of salesItems) {
    // Phase 2: 신상품 vs 기존상품
    const matched = findNewProduct(item.product);
    if (matched && isNewProduct(matched, asOfDate)) {
      newRevenue += item.revenue;
    } else {
      existingRevenue += item.revenue;
    }

    // Phase 3: 내부 vs 외부
    const classification = classifyCustomer(item.customer);
    if (classification.isInternal) {
      internalRevenue += item.revenue;
      const g = classification.group || "기타그룹사";
      const entry = groupMap.get(g) || { revenue: 0, count: 0 };
      entry.revenue += item.revenue;
      entry.count += 1;
      groupMap.set(g, entry);
    } else {
      externalRevenue += item.revenue;
    }
  }

  const total = newRevenue + existingRevenue;

  // 그룹사별 매출 내림차순 정렬
  const internalByGroup = [...groupMap.entries()]
    .map(([group, data]) => ({ group, revenue: data.revenue, count: data.count }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    newProductRevenue: newRevenue,
    existingProductRevenue: existingRevenue,
    totalRevenue: total,
    newProductRatio: total > 0 ? (newRevenue / total) * 100 : 0,
    externalRevenue,
    internalRevenue,
    externalRatio: total > 0 ? (externalRevenue / total) * 100 : 0,
    internalByGroup,
  };
}

export function getNewProductDetails(
  salesItems: SaleRow[],
  asOfDate: Date = new Date(),
): NewProductDetail[] {
  const detailMap = new Map<string, { revenue: number; quantity: number }>();

  for (const item of salesItems) {
    const matched = findNewProduct(item.product);
    if (matched && isNewProduct(matched, asOfDate)) {
      const existing = detailMap.get(matched.id) || { revenue: 0, quantity: 0 };
      existing.revenue += item.revenue;
      existing.quantity += item.quantity;
      detailMap.set(matched.id, existing);
    }
  }

  return NEW_PRODUCTS
    .filter((p) => isNewProduct(p, asOfDate))
    .map((p) => {
      const sales = detailMap.get(p.id) || { revenue: 0, quantity: 0 };
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        launchDate: p.launchDate,
        monthlyRevenue: sales.revenue,
        cumulativeRevenue: sales.revenue,
        quantity: sales.quantity,
      };
    });
}
