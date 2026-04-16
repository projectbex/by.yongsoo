// ── CSV 파싱 & 데이터 타입 ──
// 데이터 소스: public/data/ 의 3개 CSV 파일
//   - sales.csv      (통합데이터)
//   - targets.csv    (목표데이터)
//   - receivables.csv (미수현황)

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

// ─────────────────────────────────────────
// 로컬 정적 CSV 로더 (public/data/*.csv)
// ─────────────────────────────────────────
const BASE_PATH = "/projectbex.by.yongsoo"; // next.config.ts basePath

export async function fetchLocalCsv(fileName: string): Promise<string[][]> {
  const url = `${BASE_PATH}/data/${fileName}`;
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to fetch local csv: ${fileName}`);
  let text = await res.text();
  // BOM 제거
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return parseCSV(text);
}

// ─────────────────────────────────────────
// 통합데이터 (매출 + 원가 + 이익)
// CSV 컬럼: date, year, month, team, customer, product, category, quantity, revenue, cost, profit
// ─────────────────────────────────────────
export interface SaleRow {
  date: string;       // "2023-01-01"
  year: number;
  month: number;
  team: string;       // 단위부서명 (영업팀)
  customer: string;   // 거래처명
  product: string;    // 품목명
  category: string;   // 유종대분류 (ERP 기준)
  quantity: number;
  revenue: number;    // 매출액
  cost: number;       // 원가 (revenue - profit)
  profit: number;     // 영업이익
}

export function parseSalesSheet(rows: string[][]): SaleRow[] {
  if (rows.length < 2) return [];
  return rows.slice(1).map((r) => ({
    date: r[0] || "",
    year: parseInt(r[1]) || 0,
    month: parseInt(r[2]) || 0,
    team: (r[3] || "").trim(),
    customer: (r[4] || "").trim(),
    product: (r[5] || "").trim(),
    category: (r[6] || "").trim(),
    quantity: parseFloat(String(r[7]).replace(/,/g, "")) || 0,
    revenue: parseFloat(String(r[8]).replace(/,/g, "")) || 0,
    cost: parseFloat(String(r[9]).replace(/,/g, "")) || 0,
    profit: parseFloat(String(r[10]).replace(/,/g, "")) || 0,
  })).filter((r) => r.customer && (r.revenue !== 0 || r.quantity !== 0));
}

// ─────────────────────────────────────────
// 미수현황
// CSV 컬럼: customer, team, remaining
// ─────────────────────────────────────────
export interface ReceivableRow {
  customer: string;
  team: string;
  remaining: number;
}

export function parseReceivableSheet(rows: string[][]): ReceivableRow[] {
  if (rows.length < 2) return [];
  return rows.slice(1).map((r) => ({
    customer: (r[0] || "").trim(),
    team: (r[1] || "").trim(),
    remaining: parseFloat(String(r[2]).replace(/,/g, "")) || 0,
  })).filter((r) => r.customer && r.remaining !== 0);
}

// ─────────────────────────────────────────
// 목표 데이터
// CSV 컬럼: year_month, target_revenue, target_profit
// ─────────────────────────────────────────
export interface TargetRow {
  period: string;          // "2023-01"
  targetRevenue: number;
  targetProfit: number;
}

export function parseTargetSheet(rows: string[][]): TargetRow[] {
  if (rows.length < 2) return [];
  return rows.slice(1).map((r) => ({
    period: (r[0] || "").trim(),
    targetRevenue: parseFloat(String(r[1]).replace(/,/g, "")) || 0,
    targetProfit: parseFloat(String(r[2]).replace(/,/g, "")) || 0,
  })).filter((r) => r.period);
}
