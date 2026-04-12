import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get("month") || "";

  const where = month ? { month } : {};

  const [
    totalSales,
    totalAmount,
    productCount,
    customerCount,
    staffSales,
    weeklySales,
    topProducts,
  ] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.aggregate({ where, _sum: { totalAmount: true, quantity: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.customer.count(),
    // 담당자별 매출
    prisma.sale.groupBy({
      by: ["staffId"],
      where,
      _sum: { totalAmount: true, quantity: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 10,
    }),
    // 주차별 매출
    prisma.sale.groupBy({
      by: ["weekNumber"],
      where,
      _sum: { totalAmount: true, quantity: true },
      _count: true,
      orderBy: { weekNumber: "asc" },
    }),
    // 상위 상품
    prisma.sale.groupBy({
      by: ["productId"],
      where,
      _sum: { totalAmount: true, quantity: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 10,
    }),
  ]);

  // 담당자 이름 조회
  const staffIds = staffSales.map((s) => s.staffId).filter(Boolean) as string[];
  const staffList = await prisma.staff.findMany({
    where: { id: { in: staffIds } },
    include: { department: true },
  });
  const staffMap = Object.fromEntries(staffList.map((s) => [s.id, s]));

  // 상품명 조회
  const productIds = topProducts.map((p) => p.productId).filter(Boolean) as string[];
  const productList = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = Object.fromEntries(productList.map((p) => [p.id, p]));

  return Response.json({
    summary: {
      totalSales,
      totalQuantity: totalAmount._sum.quantity || 0,
      totalAmount: totalAmount._sum.totalAmount || 0,
      productCount,
      customerCount,
    },
    staffSales: staffSales.map((s) => ({
      staff: staffMap[s.staffId!] || { name: "미지정" },
      totalAmount: s._sum.totalAmount || 0,
      totalQuantity: s._sum.quantity || 0,
    })),
    weeklySales: weeklySales.map((w) => ({
      week: w.weekNumber,
      totalAmount: w._sum.totalAmount || 0,
      totalQuantity: w._sum.quantity || 0,
      count: w._count,
    })),
    topProducts: topProducts.map((p) => ({
      product: productMap[p.productId!] || { name: "미지정" },
      totalAmount: p._sum.totalAmount || 0,
      totalQuantity: p._sum.quantity || 0,
    })),
  });
}
