import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const month = formData.get("month") as string | null;

    if (!file || !month) {
      return Response.json({ error: "파일과 월을 선택해주세요." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });

    // 주차별 시트 찾기 (1주차~5주차)
    const weekSheets = wb.SheetNames.filter((name) =>
      /^\d주차$/.test(name)
    );

    let totalRows = 0;

    const upload = await prisma.upload.create({
      data: {
        fileName: file.name,
        month,
        sheetName: weekSheets.join(", "),
        rowCount: 0,
      },
    });

    for (const sheetName of weekSheets) {
      const weekNum = parseInt(sheetName.charAt(0));
      const sheet = wb.Sheets[sheetName];
      const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // 첫 행은 헤더, 나머지가 데이터
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 10 || !row[9]) continue; // 품목명 없으면 스킵

        const staffCode = row[2] ? String(row[2]) : null;
        const staffName = row[3] ? String(row[3]) : null;
        const customerCode = row[4] ? String(row[4]) : null;
        const customerName = row[5] ? String(row[5]) : null;
        const saleType = row[6] ? String(row[6]).replace(/^\d+:\s*/, "") : null;
        const saleDateRaw = row[7] as number | null;
        const productCode = row[8] ? String(row[8]) : null;
        const productName = row[9] ? String(row[9]) : null;
        const oldProductName = row[10] ? String(row[10]) : null;
        const volume = row[11] ? String(row[11]) : null;
        const unitRaw = row[12] ? String(row[12]) : null;
        const unit = unitRaw ? unitRaw.replace(/^\d+:\s*/, "") : null;
        const quantity = Number(row[15]) || 0;
        const unitPrice = Number(row[16]) || 0;
        const supplyAmount = Number(row[17]) || 0;
        const taxAmount = Number(row[18]) || 0;

        // 날짜 변환 (Excel serial number)
        let saleDate: Date | null = null;
        if (saleDateRaw && typeof saleDateRaw === "number") {
          saleDate = new Date((saleDateRaw - 25569) * 86400 * 1000);
        }

        // 담당자 upsert
        let staff = null;
        if (staffCode && staffName) {
          staff = await prisma.staff.upsert({
            where: { code: staffCode },
            update: { name: staffName },
            create: { code: staffCode, name: staffName },
          });
        }

        // 거래처 upsert
        let customer = null;
        if (customerCode && customerName) {
          customer = await prisma.customer.upsert({
            where: { code: customerCode },
            update: { name: customerName, staffId: staff?.id },
            create: { code: customerCode, name: customerName, staffId: staff?.id },
          });
        }

        // 상품 upsert
        let product = null;
        if (productCode && productName) {
          product = await prisma.product.upsert({
            where: { code: productCode },
            update: { name: productName, oldName: oldProductName, volume, unit },
            create: { code: productCode, name: productName, oldName: oldProductName, volume, unit, price: unitPrice },
          });
        }

        // 매출 데이터 생성
        await prisma.sale.create({
          data: {
            uploadId: upload.id,
            staffId: staff?.id,
            customerId: customer?.id,
            productId: product?.id,
            saleType,
            saleDate,
            month,
            weekNumber: weekNum,
            quantity,
            unitPrice,
            supplyAmount,
            taxAmount,
            totalAmount: supplyAmount + taxAmount,
          },
        });

        totalRows++;
      }
    }

    // 업로드 행 수 업데이트
    await prisma.upload.update({
      where: { id: upload.id },
      data: { rowCount: totalRows },
    });

    return Response.json({
      success: true,
      message: `${totalRows}건의 데이터가 업로드되었습니다.`,
      uploadId: upload.id,
      sheets: weekSheets,
      rowCount: totalRows,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      { error: "업로드 중 오류가 발생했습니다: " + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const uploads = await prisma.upload.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return Response.json(uploads);
}
