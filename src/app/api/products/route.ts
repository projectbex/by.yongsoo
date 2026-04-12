import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { code: { contains: search, mode: "insensitive" as const } },
          { category: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return Response.json({ products, total, page, limit });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, category, volume, unit, price } = body;

    if (!name) {
      return Response.json({ error: "상품명은 필수입니다." }, { status: 400 });
    }

    if (code) {
      const existing = await prisma.product.findUnique({ where: { code } });
      if (existing) {
        return Response.json({ error: "이미 존재하는 품목코드입니다." }, { status: 400 });
      }
    }

    const product = await prisma.product.create({
      data: { code, name, category, volume, unit, price: price ? parseFloat(price) : null },
    });

    return Response.json(product, { status: 201 });
  } catch (error) {
    return Response.json({ error: "상품 등록 실패: " + (error as Error).message }, { status: 500 });
  }
}
