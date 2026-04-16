"use client";

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import {
  fetchLocalCsv,
  parseSalesSheet, parseReceivableSheet, parseTargetSheet,
  SaleRow, ReceivableRow, TargetRow,
} from "./sheets";
import { inRange } from "./kpi";

// 로컬 CSV 파일명 (public/data/)
const LOCAL_FILE_SALES = "sales.csv";
const LOCAL_FILE_RECEIVABLE = "receivables.csv";
const LOCAL_FILE_TARGET = "targets.csv";

// ─────────────────────────────────────────
// Filters
// ─────────────────────────────────────────
export interface Filters {
  from: string;        // YYYYMMDD
  to: string;          // YYYYMMDD
  team: string;
  category: string;
  product: string;
  customer: string;
}

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
  team: "",
  category: "",
  product: "",
  customer: "",
};

// ─────────────────────────────────────────
// Context
// ─────────────────────────────────────────
interface DataContextType {
  sales: SaleRow[];
  receivables: ReceivableRow[];
  targets: TargetRow[];
  filtered: SaleRow[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  teamList: string[];
  categoryList: string[];
  loading: boolean;
  error: string | null;
  reload: () => void;
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
  const [receivables, setReceivables] = useState<ReceivableRow[]>([]);
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [salesRaw, recRaw, tgtRaw] = await Promise.all([
        fetchLocalCsv(LOCAL_FILE_SALES),
        fetchLocalCsv(LOCAL_FILE_RECEIVABLE).catch(() => [] as string[][]),
        fetchLocalCsv(LOCAL_FILE_TARGET),
      ]);

      setSales(parseSalesSheet(salesRaw));
      setReceivables(parseReceivableSheet(recRaw));
      setTargets(parseTargetSheet(tgtRaw));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return sales.filter((r) => {
      if (!inRange(r.date, filters.from, filters.to)) return false;
      if (filters.team && r.team !== filters.team) return false;
      if (filters.category && r.category !== filters.category) return false;
      if (filters.product && !r.product.toLowerCase().includes(filters.product.toLowerCase())) return false;
      if (filters.customer && !r.customer.toLowerCase().includes(filters.customer.toLowerCase())) return false;
      return true;
    });
  }, [sales, filters]);

  const teamList = useMemo(
    () => [...new Set(sales.map((s) => s.team))].filter(Boolean).sort(),
    [sales],
  );

  const categoryList = useMemo(
    () => {
      const map = new Map<string, number>();
      sales.forEach((s) => map.set(s.category, (map.get(s.category) || 0) + s.revenue));
      return [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([c]) => c)
        .filter(Boolean);
    },
    [sales],
  );

  return (
    <Ctx.Provider value={{
      sales, receivables, targets,
      filtered,
      filters, setFilters,
      teamList, categoryList,
      loading, error, reload: load,
    }}>
      {children}
    </Ctx.Provider>
  );
}
