import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month") || "";
  const where = month ? { month } : {};

  const sales = await prisma.sale.findMany({
    where,
    include: { staff: { include: { department: true } }, customer: true },
  });

  // 담당자별로 그룹핑
  const staffMap = new Map<string, {
    staffName: string;
    department: string;
    customers: Map<string, { name: string; quantity: number; amount: number }>;
    totalQuantity: number;
    totalAmount: number;
  }>();

  for (const sale of sales) {
    const staffName = sale.staff?.name || "미지정";
    const dept = sale.staff?.department?.name || "";

    if (!staffMap.has(staffName)) {
      staffMap.set(staffName, { staffName, department: dept, customers: new Map(), totalQuantity: 0, totalAmount: 0 });
    }

    const staff = staffMap.get(staffName)!;
    staff.totalQuantity += sale.quantity;
    staff.totalAmount += sale.totalAmount;

    const custName = sale.customer?.name || "미지정";
    if (!staff.customers.has(custName)) {
      staff.customers.set(custName, { name: custName, quantity: 0, amount: 0 });
    }
    const cust = staff.customers.get(custName)!;
    cust.quantity += sale.quantity;
    cust.amount += sale.totalAmount;
  }

  const result = Array.from(staffMap.values())
    .map((s) => ({
      ...s,
      customers: Array.from(s.customers.values()).sort((a, b) => b.amount - a.amount),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return Response.json(result);
}
