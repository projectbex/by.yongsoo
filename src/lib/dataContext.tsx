"use client";

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import { fetchSheet, parseSalesSheet, parseCustomerSheet, SaleRow, CustomerInfo, toBroadRegion } from "./sheets";

// ── Filters ──
export interface Filters {
  staff: string;      // 담당자 (전체="")
  team: string;       // 팀 (전체="")
  category: string;   // 유종 (전체="")
  product: string;    // 품목 검색어
  customer: string;   // 거래처 검색어
}

const defaultFilters: Filters = {
  staff: "", team: "", category: "", product: "", customer: "",
};

// ── Context ──
interface DataContextType {
  raw: SaleRow[];                // 원본 (매출 필터 적용 완료)
  filtered: SaleRow[];           // 필터 적용 후
  customers: CustomerInfo[];
  customerMap: Map<string, CustomerInfo>;
  filters: Filters;
  setFilters: (f: Filters) => void;
  loading: boolean;
  error: string | null;
  reload: () => void;
  // 파생 유틸
  staffList: string[];
  teamList: string[];
  categoryList: string[];
}

const Ctx = createContext<DataContextType | null>(null);

export function useData(): DataContextType {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be inside DataProvider");
  return ctx;
}

// ── 유종 추출 ──
function extractCategory(productName: string): string {
  // "WD-40 450ML" → "WD-40", "BW-100 225G" → "BW-100", "DCHA" → "DCHA"
  const first = productName.split(" ")[0];
  return first || "기타";
}

// ── Provider ──
export function DataProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<SaleRow[]>([]);
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [customerMap, setCustomerMap] = useState<Map<string, CustomerInfo>>(new Map());
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [salesRows, custRows] = await Promise.all([
        fetchSheet("매출데이터"),
        fetchSheet("거래처정보"),
      ]);
      const sales = parseSalesSheet(salesRows);   // 이미 매출 필터 적용됨
      const custs = parseCustomerSheet(custRows);
      const map = new Map<string, CustomerInfo>();
      custs.forEach((c) => map.set(c.customer, c));

      setRaw(sales);
      setCustomers(custs);
      setCustomerMap(map);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // 필터 적용
  const filtered = useMemo(() => {
    let data = raw;
    if (filters.staff) data = data.filter((s) => s.staff === filters.staff);
    if (filters.team) {
      data = data.filter((s) => {
        const info = customerMap.get(s.customer);
        return info?.team === filters.team;
      });
    }
    if (filters.category) {
      data = data.filter((s) => extractCategory(s.product) === filters.category);
    }
    if (filters.product) {
      const q = filters.product.toLowerCase();
      data = data.filter((s) => s.product.toLowerCase().includes(q));
    }
    if (filters.customer) {
      const q = filters.customer.toLowerCase();
      data = data.filter((s) => s.customer.toLowerCase().includes(q));
    }
    return data;
  }, [raw, filters, customerMap]);

  // 유틸 리스트
  const staffList = useMemo(() => [...new Set(raw.map((s) => s.staff))].sort(), [raw]);
  const teamList = useMemo(() => [...new Set(customers.map((c) => c.team).filter(Boolean))].sort(), [customers]);
  const categoryList = useMemo(() => {
    const cats = new Set(raw.map((s) => extractCategory(s.product)));
    return [...cats].sort();
  }, [raw]);

  return (
    <Ctx.Provider value={{
      raw, filtered, customers, customerMap,
      filters, setFilters,
      loading, error, reload: load,
      staffList, teamList, categoryList,
    }}>
      {children}
    </Ctx.Provider>
  );
}
