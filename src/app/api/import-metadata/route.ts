import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";
import * as iconv from "iconv-lite";
const CSV_PATH = path.join("C:", "Users", "BWC-MASTER", "Desktop", "거래처별1.csv");
const DATA_START_ROW = 4; // 0-indexed, row 5 in the spreadsheet

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  return lines.map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          cells.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

export async function POST() {
  try {
    // Read and decode the EUC-KR CSV file
    const rawBuffer = fs.readFileSync(CSV_PATH);
    const decoded = iconv.decode(rawBuffer, "euc-kr");
    const rows = parseCSV(decoded);

    let updatedCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;
    const notFoundNames: string[] = [];

    for (let i = DATA_START_ROW; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 6) continue;

      const customerName = row[2]?.trim();
      const grade = row[3]?.trim() || null;
      const market = row[4]?.trim() || null;
      const region = row[5]?.trim() || null;

      if (!customerName) {
        skippedCount++;
        continue;
      }

      // Skip if all metadata fields are empty
      if (!grade && !market && !region) {
        skippedCount++;
        continue;
      }

      // Find customer by name
      const customer = await prisma.customer.findFirst({
        where: { name: customerName },
      });

      if (!customer) {
        notFoundCount++;
        if (notFoundNames.length < 20) {
          notFoundNames.push(customerName);
        }
        continue;
      }

      // Build update data with only non-empty fields
      const updateData: { grade?: string; market?: string; region?: string } = {};
      if (grade) updateData.grade = grade;
      if (market) updateData.market = market;
      if (region) updateData.region = region;

      await prisma.customer.update({
        where: { id: customer.id },
        data: updateData,
      });

      updatedCount++;
    }

    return Response.json({
      success: true,
      message: `${updatedCount}건의 거래처 메타데이터가 업데이트되었습니다.`,
      updatedCount,
      skippedCount,
      notFoundCount,
      notFoundNames,
      totalDataRows: rows.length - DATA_START_ROW,
    });
  } catch (error) {
    console.error("Import metadata error:", error);
    return Response.json(
      { error: "메타데이터 가져오기 중 오류가 발생했습니다: " + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const totalCustomers = await prisma.customer.count();

    const withGrade = await prisma.customer.count({
      where: { grade: { not: null } },
    });

    const withMarket = await prisma.customer.count({
      where: { market: { not: null } },
    });

    const withRegion = await prisma.customer.count({
      where: { region: { not: null } },
    });

    const withAllMetadata = await prisma.customer.count({
      where: {
        grade: { not: null },
        market: { not: null },
        region: { not: null },
      },
    });

    const withNoMetadata = await prisma.customer.count({
      where: {
        grade: null,
        market: null,
        region: null,
      },
    });

    return Response.json({
      totalCustomers,
      withGrade,
      withMarket,
      withRegion,
      withAllMetadata,
      withNoMetadata,
      coverage: {
        grade: totalCustomers > 0 ? Math.round((withGrade / totalCustomers) * 100) : 0,
        market: totalCustomers > 0 ? Math.round((withMarket / totalCustomers) * 100) : 0,
        region: totalCustomers > 0 ? Math.round((withRegion / totalCustomers) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Metadata stats error:", error);
    return Response.json(
      { error: "메타데이터 통계 조회 중 오류가 발생했습니다: " + (error as Error).message },
      { status: 500 }
    );
  }
}
