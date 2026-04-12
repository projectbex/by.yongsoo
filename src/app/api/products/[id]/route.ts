import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        code: body.code,
        category: body.category,
        volume: body.volume,
        unit: body.unit,
        price: body.price ? parseFloat(body.price) : null,
        isActive: body.isActive,
      },
    });
    return Response.json(product);
  } catch (error) {
    return Response.json({ error: "수정 실패: " + (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "삭제 실패: " + (error as Error).message }, { status: 500 });
  }
}
