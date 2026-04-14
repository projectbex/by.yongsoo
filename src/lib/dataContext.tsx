"use client";

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import {
  fetchSheet, parseSalesSheet, parseCustomerSheet,
  parseProfitSheet, parseReceivableSheet, parseTargetSheet,
  SaleRow, CustomerInfo, ProfitRow, ReceivableRow, TargetRow,
} from "./sheets";
import { MOCK_PROFITS, MOCK_RECEIVABLES, MOCK_TARGETS } from "./mockData";
import { toMainCategory, type MainCategory } from "./category";
import { inRange } from "./kpi";

// ─────────────────────────────────────────
// Mock 사용 플래그
//   실 시트 연결 시 false 로 바꾸면 즉시 실데이터 사용.
// ─────────────────────────────────────────
const USE_MOCK_PROFIT = true;
const USE_MOCK_RECEIVABLE = true;
const USE_MOCK_TARGET = true;

// 실 시트 이름 (연결 시 사용)
const SHEET_NAME_PROFIT = "영업이익데이터";
const SHEET_NAME_RECEIVABLE = "미수현황";
const SHEET_NAME_TARGET = "목표";

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

// 기본 기간: 2023-01-01 ~ 오늘
function todayYmd(): string {
  const d = new Date();
  return (
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0")
  );
}

const defaultFilters: Filters = {
  from: "20230101",
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
      // 매출 + 거래처 (실 시트)
      const [salesRows, custRows] = await Promise.all([
        fetchSheet("매출데이터"),
        fetchSheet("거래처정보"),
      ]);
      const sales = parseSalesSheet(salesRows);
      const custs = parseCustomerSheet(custRows);
      const map = new Map<string, CustomerInfo>();
      custs.forEach((c) => map.set(c.customer, c));

      // 영업이익
      const profits = USE_MOCK_PROFIT
        ? MOCK_PROFITS
        : parseProfitSheet(await fetchSheet(SHEET_NAME_PROFIT));

      // 미수현황
      const receivables = USE_MOCK_RECEIVABLE
        ? MOCK_RECEIVABLES
        : parseReceivableSheet(await fetchSheet(SHEET_NAME_RECEIVABLE));

      // 목표
      const targets = USE_MOCK_TARGET
        ? MOCK_TARGETS
        : parseTargetSheet(await fetchSheet(SHEET_NAME_TARGET));

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
