import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// 광역 지역 매핑
const BROAD_REGION_MAP: Record<string, string> = {
  서울: "수도권",
  경기: "수도권",
  인천: "수도권",
  충남: "충청",
  충북: "충청",
  대전: "충청",
  세종: "충청",
  경남: "경상",
  경북: "경상",
  부산: "경상",
  울산: "경상",
  대구: "경상",
  강원: "강원",
  전남: "호남",
  전북: "호남",
  광주: "호남",
  제주: "제주",
};

function extractBroadRegion(region: string | null | undefined): string {
  if (!region) return "기타";
  const prefix = region.split(" ")[0];
  return BROAD_REGION_MAP[prefix] || "기타";
}

function extractCategory(productName: string | null | undefined): string {
  if (!productName) return "기타";
  // Extract prefix before the first space (e.g., "WD-40 360ML" → "WD-40")
  const prefix = productName.split(" ")[0];
  return prefix || "기타";
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get("month") || "";

  const where = month ? { month } : {};

  // 1. Fetch sales grouped by customerId with sums
  const salesByCustomer = await prisma.sale.groupBy({
    by: ["customerId"],
    where,
    _sum: { totalAmount: true, quantity: true },
  });

  // 2. Fetch sales grouped by productId with sums
  const salesByProduct = await prisma.sale.groupBy({
    by: ["productId"],
    where,
    _sum: { totalAmount: true, quantity: true },
  });

  // 3. Fetch all customers
  const customerIds = salesByCustomer
    .map((s) => s.customerId)
    .filter(Boolean) as string[];
  const customers = await prisma.customer.findMany({
    where: customerIds.length > 0 ? { id: { in: customerIds } } : undefined,
  });
  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]));

  // 4. Fetch all products
  const productIds = salesByProduct
    .map((s) => s.productId)
    .filter(Boolean) as string[];
  const products = await prisma.product.findMany({
    where: productIds.length > 0 ? { id: { in: productIds } } : undefined,
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  // Build customer sales lookup
  const customerSalesMap = new Map(
    salesByCustomer.map((s) => [
      s.customerId,
      {
        totalAmount: s._sum.totalAmount || 0,
        quantity: s._sum.quantity || 0,
      },
    ])
  );

  // Calculate grand totals
  const grandTotalAmount = salesByCustomer.reduce(
    (sum, s) => sum + (s._sum.totalAmount || 0),
    0
  );
  const grandTotalQuantity = salesByCustomer.reduce(
    (sum, s) => sum + (s._sum.quantity || 0),
    0
  );

  // --- regionStats ---
  // Group by raw region first, then aggregate into broad regions
  const regionAgg = new Map<
    string,
    {
      customerIds: Set<string>;
      totalQuantity: number;
      totalAmount: number;
    }
  >();

  for (const sale of salesByCustomer) {
    const customer = sale.customerId ? customerMap[sale.customerId] : null;
    const broadRegion = extractBroadRegion(customer?.region);
    const existing = regionAgg.get(broadRegion) || {
      customerIds: new Set<string>(),
      totalQuantity: 0,
      totalAmount: 0,
    };
    if (sale.customerId) existing.customerIds.add(sale.customerId);
    existing.totalQuantity += sale._sum.quantity || 0;
    existing.totalAmount += sale._sum.totalAmount || 0;
    regionAgg.set(broadRegion, existing);
  }

  const regionStats = Array.from(regionAgg.entries())
    .map(([region, data]) => ({
      name: region,
      customerCount: data.customerIds.size,
      totalQuantity: data.totalQuantity,
      totalAmount: data.totalAmount,
      percentage:
        grandTotalAmount > 0
          ? Math.round((data.totalAmount / grandTotalAmount) * 10000) / 100
          : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // --- gradeStats ---
  const gradeAgg = new Map<
    string,
    {
      customerIds: Set<string>;
      totalQuantity: number;
      totalAmount: number;
    }
  >();

  for (const sale of salesByCustomer) {
    const customer = sale.customerId ? customerMap[sale.customerId] : null;
    const grade = customer?.grade || "미지정";
    const existing = gradeAgg.get(grade) || {
      customerIds: new Set<string>(),
      totalQuantity: 0,
      totalAmount: 0,
    };
    if (sale.customerId) existing.customerIds.add(sale.customerId);
    existing.totalQuantity += sale._sum.quantity || 0;
    existing.totalAmount += sale._sum.totalAmount || 0;
    gradeAgg.set(grade, existing);
  }

  const gradeStats = Array.from(gradeAgg.entries())
    .map(([grade, data]) => ({
      name: grade,
      customerCount: data.customerIds.size,
      totalQuantity: data.totalQuantity,
      totalAmount: data.totalAmount,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // --- marketStats ---
  const marketAgg = new Map<
    string,
    {
      customerIds: Set<string>;
      totalQuantity: number;
      totalAmount: number;
    }
  >();

  for (const sale of salesByCustomer) {
    const customer = sale.customerId ? customerMap[sale.customerId] : null;
    const market = customer?.market || "미지정";
    const existing = marketAgg.get(market) || {
      customerIds: new Set<string>(),
      totalQuantity: 0,
      totalAmount: 0,
    };
    if (sale.customerId) existing.customerIds.add(sale.customerId);
    existing.totalQuantity += sale._sum.quantity || 0;
    existing.totalAmount += sale._sum.totalAmount || 0;
    marketAgg.set(market, existing);
  }

  const marketStats = Array.from(marketAgg.entries())
    .map(([market, data]) => ({
      name: market,
      customerCount: data.customerIds.size,
      totalQuantity: data.totalQuantity,
      totalAmount: data.totalAmount,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // --- categoryStats ---
  const categoryAgg = new Map<
    string,
    { totalQuantity: number; totalAmount: number }
  >();

  for (const sale of salesByProduct) {
    const product = sale.productId ? productMap[sale.productId] : null;
    // Prefer product.category if available, otherwise derive from name
    const category = product?.category || extractCategory(product?.name);
    const existing = categoryAgg.get(category) || {
      totalQuantity: 0,
      totalAmount: 0,
    };
    existing.totalQuantity += sale._sum.quantity || 0;
    existing.totalAmount += sale._sum.totalAmount || 0;
    categoryAgg.set(category, existing);
  }

  const categoryStats = Array.from(categoryAgg.entries())
    .map(([category, data]) => ({
      name: category,
      customerCount: 0,
      totalQuantity: data.totalQuantity,
      totalAmount: data.totalAmount,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // --- customersByRegion ---
  const customersByBroadRegion = new Map<string, string[]>();

  for (const customer of customers) {
    const broadRegion = extractBroadRegion(customer.region);
    const existing = customersByBroadRegion.get(broadRegion) || [];
    existing.push(customer.name);
    customersByBroadRegion.set(broadRegion, existing);
  }

  const customersByRegion: Record<string, string[]> = {};
  for (const [region, names] of customersByBroadRegion.entries()) {
    customersByRegion[region] = names.sort();
  }

  return Response.json({
    summary: {
      totalCustomers: customerIds.length,
      totalQuantity: grandTotalQuantity,
      totalAmount: grandTotalAmount,
    },
    regionStats,
    gradeStats,
    marketStats,
    categoryStats,
    customersByRegion,
  });
}
