// ── Mock 데이터 (실데이터 연동 전) ──
//
// ⚠️  실제 Google Sheets 연결 시:
//     dataContext.tsx 의 USE_MOCK_* 플래그를 false 로 변경.
//     sheets.ts 의 parseProfitSheet / parseReceivableSheet / parseTargetSheet
//     가 아래 타입과 동일한 구조를 반환하도록 매핑만 맞추면 바로 동작.

import type { ProfitRow, ReceivableRow, TargetRow } from "./sheets";

// ─────────────────────────────────────────
// MOCK: 영업이익 데이터 (= 매출 + 원가)
// ─────────────────────────────────────────
// saleRow + cost 필드. 거래일자+거래처+품목 매칭용.
// 2023-01 ~ 2026-04 샘플 (유종 4분류 골고루)

const MOCK_CUSTOMERS = [
  "㈜한국공구", "대성산업", "동양물산", "세진기계", "한양유통",
  "삼원상사", "대한산업", "금호MRO", "미래테크", "광명공업",
];
const MOCK_STAFF = ["강병국", "김세하", "김태경", "박범용", "신익수", "이구"];
const MOCK_PRODUCTS = [
  { name: "WD-40 360ML", unitPrice: 15000, costRate: 0.55 },
  { name: "WD-40 450ML", unitPrice: 18000, costRate: 0.55 },
  { name: "케이블타이 200mm 흑색", unitPrice: 8000, costRate: 0.45 },
  { name: "케이블타이 300mm 백색", unitPrice: 12000, costRate: 0.45 },
  { name: "방진복 상하일체 L", unitPrice: 35000, costRate: 0.60 },
  { name: "방진복 커버올 M", unitPrice: 28000, costRate: 0.60 },
  { name: "크린에이스 500ML", unitPrice: 22000, costRate: 0.65 },
  { name: "DCHA 1L", unitPrice: 45000, costRate: 0.65 },
];

function pseudoRand(seed: number): () => number {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    return x / 0x7fffffff;
  };
}

function generateMockProfits(): ProfitRow[] {
  const rand = pseudoRand(42);
  const rows: ProfitRow[] = [];
  // 2023-01 ~ 2026-04 (약 40개월)
  const months: string[] = [];
  for (let y = 2023; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === 2026 && m > 4) break;
      months.push(`${y}-${String(m).padStart(2, "0")}`);
    }
  }
  for (const ym of months) {
    // 월당 20~30건
    const count = 20 + Math.floor(rand() * 10);
    for (let i = 0; i < count; i++) {
      const day = 1 + Math.floor(rand() * 27);
      const date = `${ym}-${String(day).padStart(2, "0")}`;
      const prod = MOCK_PRODUCTS[Math.floor(rand() * MOCK_PRODUCTS.length)];
      const qty = 5 + Math.floor(rand() * 50);
      const supply = prod.unitPrice * qty;
      const tax = Math.round(supply * 0.1);
      const cost = Math.round(supply * prod.costRate);
      rows.push({
        staff: MOCK_STAFF[Math.floor(rand() * MOCK_STAFF.length)],
        staffCode: "",
        customer: MOCK_CUSTOMERS[Math.floor(rand() * MOCK_CUSTOMERS.length)],
        customerCode: "",
        saleType: "매출",
        saleDate: date,
        productCode: "",
        product: prod.name,
        volume: "",
        unit: "",
        quantity: qty,
        unitPrice: prod.unitPrice,
        supplyAmount: supply,
        taxAmount: tax,
        cost,
      });
    }
  }
  return rows;
}

export const MOCK_PROFITS: ProfitRow[] = generateMockProfits();

// ─────────────────────────────────────────
// MOCK: 미수현황
// ─────────────────────────────────────────

export const MOCK_RECEIVABLES: ReceivableRow[] = [
  { customerCode: "C001", customer: "㈜한국공구", staff: "강병국", team: "유통1팀",
    occurredDate: "2025-10-15", amount: 3_500_000, remaining: 1_500_000, daysOverdue: 182,
    status: "outstanding", note: "할인 협의중" },
  { customerCode: "C002", customer: "대성산업", staff: "김세하", team: "유통2팀",
    occurredDate: "2025-12-02", amount: 2_200_000, remaining: 2_200_000, daysOverdue: 133,
    status: "outstanding", note: "" },
  { customerCode: "C003", customer: "동양물산", staff: "김태경", team: "유통1팀",
    occurredDate: "2026-01-05", amount: 4_800_000, remaining: 3_800_000, daysOverdue: 99,
    status: "outstanding", note: "" },
  { customerCode: "C004", customer: "세진기계", staff: "박범용", team: "유통3팀",
    occurredDate: "2026-02-10", amount: 1_100_000, remaining: 1_100_000, daysOverdue: 63,
    status: "outstanding", note: "" },
  { customerCode: "C005", customer: "한양유통", staff: "신익수", team: "유통2팀",
    occurredDate: "2026-02-20", amount: 5_500_000, remaining: 5_500_000, daysOverdue: 53,
    status: "outstanding", note: "분납 진행" },
  { customerCode: "C006", customer: "삼원상사", staff: "이구", team: "유통1팀",
    occurredDate: "2026-03-01", amount: 2_800_000, remaining: 2_800_000, daysOverdue: 44,
    status: "outstanding", note: "" },
  { customerCode: "C007", customer: "대한산업", staff: "강병국", team: "유통1팀",
    occurredDate: "2026-03-12", amount: 900_000, remaining: 900_000, daysOverdue: 33,
    status: "outstanding", note: "" },
  { customerCode: "C008", customer: "금호MRO", staff: "김세하", team: "유통2팀",
    occurredDate: "2026-03-20", amount: 6_700_000, remaining: 4_200_000, daysOverdue: 25,
    status: "outstanding", note: "일부 수금" },
  { customerCode: "C009", customer: "미래테크", staff: "구매담당", team: "구매팀",
    occurredDate: "2026-02-15", amount: 1_500_000, remaining: 1_500_000, daysOverdue: 58,
    status: "outstanding", note: "구매팀 (제외 대상)" },
  { customerCode: "C010", customer: "광명공업", staff: "박범용", team: "유통3팀",
    occurredDate: "2025-11-08", amount: 4_000_000, remaining: 0, daysOverdue: 158,
    status: "paid", note: "수금완료" },
];

// ─────────────────────────────────────────
// MOCK: 목표 데이터
// ─────────────────────────────────────────

function generateMockTargets(): TargetRow[] {
  const rows: TargetRow[] = [];
  for (let y = 2023; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === 2026 && m > 4) break;
      const period = `${y}-${String(m).padStart(2, "0")}`;

      // 전체
      rows.push({ period, type: "전체", key: "-", targetRevenue: 280_000_000, targetProfit: 70_000_000 });

      // 유종
      rows.push({ period, type: "유종", key: "WD-40", targetRevenue: 80_000_000, targetProfit: 20_000_000 });
      rows.push({ period, type: "유종", key: "케이블타이", targetRevenue: 60_000_000, targetProfit: 18_000_000 });
      rows.push({ period, type: "유종", key: "방진복", targetRevenue: 90_000_000, targetProfit: 24_000_000 });
      rows.push({ period, type: "유종", key: "기타", targetRevenue: 50_000_000, targetProfit: 8_000_000 });

      // 담당자
      for (const s of MOCK_STAFF) {
        rows.push({ period, type: "담당자", key: s, targetRevenue: 45_000_000, targetProfit: 11_000_000 });
      }
    }
  }
  return rows;
}

export const MOCK_TARGETS: TargetRow[] = generateMockTargets();
