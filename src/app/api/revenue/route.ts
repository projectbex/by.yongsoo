import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const REGION_MAP: Record<string, string[]> = {
  수도권: ["서울", "경기", "인천"],
  "충남/충북": ["충남", "충북", "대전", "세종", "충청"],
  "경남/경북": ["경남", "경북", "부산", "울산", "대구"],
  강원도: ["강원"],
  호남: ["전남", "전북", "광주", "전라", "제주"],
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get("month") || "";
  const region = searchParams.get("region") || "";

  const where: Record<string, unknown> = {};
  if (month) where.month = month;

  // 지역 필터
  if (region && REGION_MAP[region]) {
    where.customer = {
      region: { in: REGION_MAP[region], mode: "insensitive" },
    };
  }

  const [totalAgg, weeklySales, monthlySales, staffRevenue, productRevenue, regionSales] = await Promise.all([
    prisma.sale.aggregate({
      where,
      _sum: { totalAmount: true, supplyAmount: true, taxAmount: true, quantity: true },
      _count: true,
    }),
    // 주차별 매출 추이
    prisma.sale.groupBy({
      by: ["weekNumber"],
      where,
      _sum: { totalAmount: true, quantity: true },
      _count: true,
      orderBy: { weekNumber: "asc" },
    }),
    // 월별 매출 추이
    prisma.sale.groupBy({
      by: ["month"],
      ...(region && REGION_MAP[region] ? { where: { customer: { region: { in: REGION_MAP[region], mode: "insensitive" } } } } : {}),
      _sum: { totalAmount: true, quantity: true },
      _count: true,
      orderBy: { month: "asc" },
    }),
    // 담당자별 매출
    prisma.sale.groupBy({
      by: ["staffId"],
      where,
      _sum: { totalAmount: true, supplyAmount: true, quantity: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 10,
    }),
    // 상품별 매출
    prisma.sale.groupBy({
      by: ["productId"],
      where,
      _sum: { totalAmount: true, quantity: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 10,
    }),
    // 지역별 매출 합계
    prisma.$queryRawUnsafe(`
      SELECT c.region, COUNT(s.id)::int as count,
        COALESCE(SUM(s."totalAmount"), 0) as "totalAmount",
        COALESCE(SUM(s.quantity), 0)::int as "totalQuantity"
      FROM sales s
      LEFT JOIN customers c ON s."customerId" = c.id
      ${month ? `WHERE s.month = '${month}'` : ""}
      GROUP BY c.region
      ORDER BY "totalAmount" DESC
    `) as Promise<{ region: string | null; count: number; totalAmount: number; totalQuantity: number }[]>,
  ]);

  // 담당자 이름 조회
  const staffIds = staffRevenue.map((s) => s.staffId).filter(Boolean) as string[];
  const staffList = staffIds.length > 0
    ? await prisma.staff.findMany({ where: { id: { in: staffIds } } })
    : [];
  const staffMap = Object.fromEntries(staffList.map((s) => [s.id, s]));

  // 상품명 조회
  const productIds = productRevenue.map((p) => p.productId).filter(Boolean) as string[];
  const productList = productIds.length > 0
    ? await prisma.product.findMany({ where: { id: { in: productIds } } })
    : [];
  const productMap = Object.fromEntries(productList.map((p) => [p.id, p]));

  return Response.json({
    summary: {
      totalCount: totalAgg._count,
      totalAmount: totalAgg._sum.totalAmount || 0,
      supplyAmount: totalAgg._sum.supplyAmount || 0,
      taxAmount: totalAgg._sum.taxAmount || 0,
      totalQuantity: totalAgg._sum.quantity || 0,
    },
    weeklySales: weeklySales.map((w) => ({
      week: w.weekNumber,
      totalAmount: w._sum.totalAmount || 0,
      totalQuantity: w._sum.quantity || 0,
      count: w._count,
    })),
    monthlySales: monthlySales.map((m) => ({
      month: m.month,
      totalAmount: m._sum.totalAmount || 0,
      totalQuantity: m._sum.quantity || 0,
      count: m._count,
    })),
    staffRevenue: staffRevenue.map((s) => ({
      staff: staffMap[s.staffId!] || { name: "미지정" },
      totalAmount: s._sum.totalAmount || 0,
      supplyAmount: s._sum.supplyAmount || 0,
      totalQuantity: s._sum.quantity || 0,
    })),
    productRevenue: productRevenue.map((p) => ({
      product: productMap[p.productId!] || { name: "미지정" },
      totalAmount: p._sum.totalAmount || 0,
      totalQuantity: p._sum.quantity || 0,
    })),
    regionSales: regionSales.map((r) => ({
      region: r.region || "미지정",
      count: Number(r.count),
      totalAmount: Number(r.totalAmount),
      totalQuantity: Number(r.totalQuantity),
    })),
  });
}
