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
    customer: (r[5] || "").trim(),
    customerCode: r[4] || "",
    saleType: r[6] || "",
    saleDate: r[7] || "",
    productCode: r[8] || "",
    product: r[9] || "",
    volume: r[11] || "",
    unit: r[12] || "",
    quantity: parseInt(String(r[15]).replace(/,/g, "")) || 0,
    unitPrice: parseFloat(String(r[16]).replace(/,/g, "")) || 0,
    supplyAmount: parseFloat(String(r[17]).replace(/,/g, "")) || 0,
    taxAmount: parseFloat(String(r[18]).replace(/,/g, "")) || 0,
  })).filter(r =>
    r.staff                        // 담당자명 존재
    && r.customer                  // 거래처명 존재 (빈값 제거)
    && r.saleType.includes("매출") // 매출구분 = "매출"만 (견본/미분류 제외)
  );
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

// ─────────────────────────────────────────
// 영업이익 데이터 (매출 + 원가)
// ─────────────────────────────────────────
export interface ProfitRow extends SaleRow {
  cost: number;   // 원가
}

// 시트 컬럼 예시:
//   A: 거래일자 | B: 담당자 | C: 거래처코드 | D: 거래처명 | E: 매출구분
//   F: 품목코드 | G: 품목명  | H: 수량       | I: 단가     | J: 공급가
//   K: 부가세  | L: 원가
// 실제 스키마에 맞춰 인덱스만 수정하면 됨.
export function parseProfitSheet(rows: string[][]): ProfitRow[] {
  if (rows.length < 2) return [];
  return rows.slice(1).map((r) => ({
    staff: r[1] || "",
    staffCode: "",
    customer: (r[3] || "").trim(),
    customerCode: r[2] || "",
    saleType: r[4] || "매출",
    saleDate: r[0] || "",
    productCode: r[5] || "",
    product: r[6] || "",
    volume: "",
    unit: "",
    quantity: parseInt(String(r[7]).replace(/,/g, "")) || 0,
    unitPrice: parseFloat(String(r[8]).replace(/,/g, "")) || 0,
    supplyAmount: parseFloat(String(r[9]).replace(/,/g, "")) || 0,
    taxAmount: parseFloat(String(r[10]).replace(/,/g, "")) || 0,
    cost: parseFloat(String(r[11]).replace(/,/g, "")) || 0,
  })).filter((r) => r.staff && r.customer && r.saleType.includes("매출"));
}

// ─────────────────────────────────────────
// 미수현황
// ─────────────────────────────────────────
export interface ReceivableRow {
  customerCode: string;
  customer: string;
  staff: string;
  team: string;
  occurredDate: string;       // YYYY-MM-DD
  amount: number;             // 최초 발생액
  remaining: number;          // 현재 남은 잔액
  daysOverdue: number;
  status: "outstanding" | "paid";
  note: string;
}

// 시트 컬럼 예시:
//   A: 거래처코드 | B: 거래처명 | C: 담당자 | D: 팀
//   E: 발생일     | F: 미수금액 | G: 잔액   | H: 경과일
//   I: 상태       | J: 비고
export function parseReceivableSheet(rows: string[][]): ReceivableRow[] {
  if (rows.length < 2) return [];
  return rows.slice(1).map((r) => {
    const amount = parseFloat(String(r[5]).replace(/,/g, "")) || 0;
    const remaining = parseFloat(String(r[6]).replace(/,/g, "")) || amount;
    const statusStr = (r[8] || "").trim();
    const status: ReceivableRow["status"] =
      statusStr === "수금완료" || statusStr === "paid" || remaining <= 0 ? "paid" : "outstanding";
    return {
      customerCode: r[0] || "",
      customer: (r[1] || "").trim(),
      staff: r[2] || "",
      team: r[3] || "",
      occurredDate: r[4] || "",
      amount,
      remaining,
      daysOverdue: parseInt(String(r[7]).replace(/,/g, "")) || 0,
      status,
      note: r[9] || "",
    };
  }).filter((r) => r.customer);
}

// ─────────────────────────────────────────
// 목표 데이터
// ─────────────────────────────────────────
export interface TargetRow {
  period: string;                                      // "YYYY-MM"
  type: "전체" | "담당자" | "유종" | "거래처";
  key: string;                                          // "-" | 담당자명 | 유종 | 거래처명
  targetRevenue: number;
  targetProfit: number;
}

// 시트 컬럼 예시:
//   A: 년월 | B: 구분 | C: 키 | D: 목표매출 | E: 목표영업이익
export function parseTargetSheet(rows: string[][]): TargetRow[] {
  if (rows.length < 2) return [];
  return rows.slice(1).map((r) => ({
    period: r[0] || "",
    type: ((r[1] || "전체").trim()) as TargetRow["type"],
    key: (r[2] || "-").trim(),
    targetRevenue: parseFloat(String(r[3]).replace(/,/g, "")) || 0,
    targetProfit: parseFloat(String(r[4]).replace(/,/g, "")) || 0,
  })).filter((r) => r.period);
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
