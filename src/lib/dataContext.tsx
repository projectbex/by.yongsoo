"use client";

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import {
  fetchSheet, fetchLocalCsv,
  parseSalesSheet, parseCustomerSheet,
  parseProfitSheet, parseReceivableSheet, parseTargetSheet,
  SaleRow, CustomerInfo, ProfitRow, ReceivableRow, TargetRow,
} from "./sheets";
import { MOCK_PROFITS, MOCK_RECEIVABLES, MOCK_TARGETS } from "./mockData";
import { toMainCategory, type MainCategory } from "./category";
import { inRange } from "./kpi";

// ─────────────────────────────────────────
// 데이터 소스 플래그
//   false → public/data/*.csv (ERP 익스포트 정적 번들, 2023-01 ~ 2026-03)
//   true  → lib/mockData.ts 가짜 데이터
// ─────────────────────────────────────────
const USE_MOCK_PROFIT = false;
const USE_MOCK_RECEIVABLE = false;
const USE_MOCK_TARGET = false;

// 로컬 CSV 파일명 (public/data/)
const LOCAL_FILE_PROFIT = "profits.csv";
const LOCAL_FILE_RECEIVABLE = "receivables.csv";
const LOCAL_FILE_TARGET = "targets.csv";

// (추후 구글 시트 직연결 전환 시 아래 이름으로 fetchSheet 호출)
// const SHEET_NAME_PROFIT = "영업이익데이터";
// const SHEET_NAME_RECEIVABLE = "미수현황";
// const SHEET_NAME_TARGET = "목표";
void fetchSheet; // keep import for future sheet-based path

// ─────────────────────────────────────────
// Filters
// ─────────────────────────────────────────
export interface Filters {
  from: string;                 // YYYYMMDD
  to: string;                   // YYYYMMDD
  staff: string;
  team: string;
  category: MainCategory | "";  // 대분류
  product: string;              // 텍스트 검색
  customer: string;             // 텍스트 검색
}

// 기본 기간: 올해 1월 1일 ~ 오늘 (YTD)
function todayYmd(): string {
  const d = new Date();
  return (
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0")
  );
}

function ytdStartYmd(): string {
  const d = new Date();
  return d.getFullYear().toString() + "0101";
}

const defaultFilters: Filters = {
  from: ytdStartYmd(),
  to: todayYmd(),
  staff: "",
  team: "",
  category: "",
  product: "",
  customer: "",
};

// ─────────────────────────────────────────
// Context
// ─────────────────────────────────────────
interface DataContextType {
  // 원본
  sales: SaleRow[];
  profits: ProfitRow[];
  receivables: ReceivableRow[];
  targets: TargetRow[];
  customers: CustomerInfo[];
  customerMap: Map<string, CustomerInfo>;
  // 필터 적용 결과
  filtered: SaleRow[];               // 매출
  filteredProfits: ProfitRow[];      // 영업이익용 (동일 필터 적용)
  // 필터
  filters: Filters;
  setFilters: (f: Filters) => void;
  // 리스트
  staffList: string[];
  teamList: string[];
  categoryList: MainCategory[];
  // 상태
  loading: boolean;
  error: string | null;
  reload: () => void;
  // Mock 사용 여부 (UI 배지용)
  usingMock: { profit: boolean; receivable: boolean; target: boolean };
}

const Ctx = createContext<DataContextType | null>(null);

export function useData(): DataContextType {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be inside DataProvider");
  return ctx;
}

// ─────────────────────────────────────────
// Provider
// ─────────────────────────────────────────
export function DataProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [profits, setProfits] = useState<ProfitRow[]>([]);
  const [receivables, setReceivables] = useState<ReceivableRow[]>([]);
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [customerMap, setCustomerMap] = useState<Map<string, CustomerInfo>>(new Map());
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // 1) 영업이익 = 실데이터 메인 소스 (ERP 익스포트 정적 CSV)
      const profits = USE_MOCK_PROFIT
        ? MOCK_PROFITS
        : parseProfitSheet(await fetchLocalCsv(LOCAL_FILE_PROFIT));

      // 2) 매출 = 영업이익에서 cost 만 뺀 동일 구조 → 단일 소스 유지로 수치 일관성 보장
      //    ※ 담당자 필드엔 실제로는 팀명이 들어있음 (ERP 집계 기준).
      const sales: SaleRow[] = profits.map((p) => ({
        staff: p.staff,
        staffCode: p.staffCode,
        customer: p.customer,
        customerCode: p.customerCode,
        saleType: p.saleType,
        saleDate: p.saleDate,
        productCode: p.productCode,
        product: p.product,
        volume: p.volume,
        unit: p.unit,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        supplyAmount: p.supplyAmount,
        taxAmount: p.taxAmount,
      }));

      // 3) 거래처정보 (있으면 팀/지역/등급 enrichment, 실패해도 무시)
      let custs: CustomerInfo[] = [];
      try {
        custs = parseCustomerSheet(await fetchSheet("거래처정보"));
      } catch {
        custs = [];
      }
      const map = new Map<string, CustomerInfo>();
      custs.forEach((c) => map.set(c.customer, c));

      // 4) 미수현황 (현재 빈 파일이어도 파서가 []로 안전 반환)
      const receivables = USE_MOCK_RECEIVABLE
        ? MOCK_RECEIVABLES
        : parseReceivableSheet(
            await fetchLocalCsv(LOCAL_FILE_RECEIVABLE).catch(() => [] as string[][]),
          );

      // 5) 목표
      const targets = USE_MOCK_TARGET
        ? MOCK_TARGETS
        : parseTargetSheet(await fetchLocalCsv(LOCAL_FILE_TARGET));

      setSales(sales);
      setProfits(profits);
      setReceivables(receivables);
      setTargets(targets);
      setCustomers(custs);
      setCustomerMap(map);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // 공통 필터 적용 함수
  function applyFilters<T extends {
    saleDate: string; staff: string; customer: string; product: string;
  }>(data: T[]): T[] {
    return data.filter((r) => {
      if (!inRange(r.saleDate, filters.from, filters.to)) return false;
      if (filters.staff && r.staff !== filters.staff) return false;
      if (filters.team) {
        const info = customerMap.get(r.customer);
        if (info?.team !== filters.team) return false;
      }
      if (filters.category && toMainCategory(r.product) !== filters.category) return false;
      if (filters.product && !r.product.toLowerCase().includes(filters.product.toLowerCase())) return false;
      if (filters.customer && !r.customer.toLowerCase().includes(filters.customer.toLowerCase())) return false;
      return true;
    });
  }

  const filtered = useMemo(() => applyFilters(sales), [sales, filters, customerMap]);
  const filteredProfits = useMemo(() => applyFilters(profits), [profits, filters, customerMap]);

  const staffList = useMemo(() => [...new Set(sales.map((s) => s.staff))].filter(Boolean).sort(), [sales]);
  const teamList = useMemo(() => [...new Set(customers.map((c) => c.team).filter(Boolean))].sort(), [customers]);
  const categoryList: MainCategory[] = ["WD-40", "케이블타이", "방진복", "기타"];

  return (
    <Ctx.Provider value={{
      sales, profits, receivables, targets, customers, customerMap,
      filtered, filteredProfits,
      filters, setFilters,
      staffList, teamList, categoryList,
      loading, error, reload: load,
      usingMock: {
        profit: USE_MOCK_PROFIT,
        receivable: USE_MOCK_RECEIVABLE,
        target: USE_MOCK_TARGET,
      },
    }}>
      {children}
    </Ctx.Provider>
  );
}
