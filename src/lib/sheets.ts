const SHEET_ID = "17sG8OuMbf_wqnoqekVcdKO8B8o1u5Rn6Kuyhv_LmlME";

function getSheetUrl(sheetName: string): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  const lines = csv.split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let inQuotes = false;
    let field = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        row.push(field.trim());
        field = "";
      } else {
        field += ch;
      }
    }
    row.push(field.trim());
    rows.push(row);
  }
  return rows;
}

export async function fetchSheet(sheetName: string): Promise<string[][]> {
  const url = getSheetUrl(sheetName);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${sheetName}`);
  const text = await res.text();
  return parseCSV(text);
}

// 매출데이터 시트 파싱 (3월전체 - 거래 내역)
export interface SaleRow {
  staff: string;       // 담당자명
  staffCode: string;   // 담당자코드
  customer: string;    // 거래처명
  customerCode: string;
  saleType: string;    // 매출구분
  saleDate: string;    // 거래일자
  productCode: string;
  product: string;     // 품목명
  volume: string;      // 용량
  unit: string;        // 포장단위
  quantity: number;    // 계약수량
  unitPrice: number;   // 단가
  supplyAmount: number;// 공급가액
  taxAmount: number;   // 부가세액
}

export function parseSalesSheet(rows: string[][]): SaleRow[] {
  if (rows.length < 2) return [];
  // Skip header row
  return rows.slice(1).map((r) => ({
    staff: r[3] || "",
    staffCode: r[2] || "",
    customer: r[5] || "",
    customerCode: r[4] || "",
    saleType: r[6] || "",
    saleDate: r[7] || "",
    productCode: r[8] || "",
    product: r[9] || "",
    volume: r[11] || "",
    unit: r[12] || "",
    quantity: parseInt(r[15]) || 0,
    unitPrice: parseFloat(r[16]) || 0,
    supplyAmount: parseFloat(r[17]) || 0,
    taxAmount: parseFloat(r[18]) || 0,
  })).filter(r => r.staff && r.customer);
}

// 거래처정보 시트 파싱
export interface CustomerInfo {
  team: string;
  staff: string;
  customer: string;
  grade: string;
  market: string;
  region: string;
}

export function parseCustomerSheet(rows: string[][]): CustomerInfo[] {
  if (rows.length < 5) return [];
  // Skip 4 header rows
  const dataRows = rows.slice(4);
  const results: CustomerInfo[] = [];
  let currentTeam = "";
  let currentStaff = "";
  let currentCustomer = "";

  for (const r of dataRows) {
    const team = r[0] || currentTeam;
    const staff = r[1] || currentStaff;
    const customer = r[2] || currentCustomer;
    const grade = r[3] || "";
    const market = r[4] || "";
    const region = r[5] || "";

    if (r[0]) currentTeam = r[0];
    if (r[1]) currentStaff = r[1];
    if (r[2]) currentCustomer = r[2];

    if (customer && customer !== "거래처명" && customer !== "합계" && !customer.includes("소계")) {
      results.push({ team, staff, customer, grade, market, region });
    }
  }
  return results;
}

// 광역 지역 매핑
const BROAD_REGION_MAP: Record<string, string> = {
  서울: "수도권", 경기: "수도권", 인천: "수도권",
  충남: "충청", 충북: "충청", 대전: "충청", 세종: "충청",
  경남: "경상", 경북: "경상", 부산: "경상", 울산: "경상", 대구: "경상",
  강원: "강원",
  전남: "호남", 전북: "호남", 광주: "호남",
  제주: "제주",
};

export function toBroadRegion(region: string): string {
  if (!region) return "기타";
  for (const [key, value] of Object.entries(BROAD_REGION_MAP)) {
    if (region.includes(key)) return value;
  }
  return "기타";
}

// 주차 추출 (거래일자에서)
export function getWeekNumber(dateStr: string): number {
  if (!dateStr) return 0;
  // dateStr format: "2026-03-05" or "20260305" etc
  const clean = dateStr.replace(/[^0-9]/g, "");
  const day = parseInt(clean.slice(6, 8)) || 1;
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  if (day <= 28) return 4;
  return 5;
}
