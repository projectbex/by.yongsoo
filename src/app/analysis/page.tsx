"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  fetchSheet, parseSalesSheet, parseCustomerSheet, toBroadRegion,
  SaleRow, CustomerInfo,
} from "@/lib/sheets";

/* ────────── helpers ────────── */

function fmt(n: number) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(n));
}
function fmtAmt(n: number) {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
  if (n >= 10000) return (n / 10000).toFixed(0) + "만";
  return fmt(n);
}

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6B7280",
];

const TABS = [
  { key: "region", label: "지역별" },
  { key: "grade", label: "등급별" },
  { key: "market", label: "유통시장별" },
  { key: "category", label: "상품분류별" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ────────── stat types ────────── */

interface StatItem {
  name: string;
  customerCount: number;
  totalQuantity: number;
  totalAmount: number;
}

/* ────────── aggregation ────────── */

function aggregate(
  sales: SaleRow[],
  customerMap: Map<string, CustomerInfo>,
  groupFn: (sale: SaleRow, info: CustomerInfo | undefined) => string,
): StatItem[] {
  const map = new Map<string, { customers: Set<string>; qty: number; amt: number }>();

  for (const s of sales) {
    const info = customerMap.get(s.customer);
    const key = groupFn(s, info) || "미분류";
    let bucket = map.get(key);
    if (!bucket) {
      bucket = { customers: new Set(), qty: 0, amt: 0 };
      map.set(key, bucket);
    }
    bucket.customers.add(s.customer);
    bucket.qty += s.quantity;
    bucket.amt += s.supplyAmount + s.taxAmount;
  }

  return Array.from(map.entries())
    .map(([name, b]) => ({
      name,
      customerCount: b.customers.size,
      totalQuantity: b.qty,
      totalAmount: b.amt,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

/* ────────── main component ────────── */

export default function AnalysisPage() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [customerMap, setCustomerMap] = useState<Map<string, CustomerInfo>>(new Map());
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [tab, setTab] = useState<TabKey>("region");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const salesRows = await fetchSheet("매출데이터");
      const parsedSales = parseSalesSheet(salesRows);
      const customerRows = await fetchSheet("거래처정보");
      const parsedCustomers = parseCustomerSheet(customerRows);

      const map = new Map<string, CustomerInfo>();
      for (const c of parsedCustomers) {
        map.set(c.customer, c);
      }

      setSales(parsedSales);
      setCustomers(parsedCustomers);
      setCustomerMap(map);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ── compute stats for active tab ── */

  const getStats = (): StatItem[] => {
    if (sales.length === 0) return [];
    switch (tab) {
      case "region":
        return aggregate(sales, customerMap, (_s, info) => toBroadRegion(info?.region ?? ""));
      case "grade":
        return aggregate(sales, customerMap, (_s, info) => info?.grade || "미분류");
      case "market":
        return aggregate(sales, customerMap, (_s, info) => info?.market || "미분류");
      case "category":
        return aggregate(sales, customerMap, (s) => s.product.split(" ")[0] || "미분류");
    }
  };

  const stats = getStats();
  const tabLabel = TABS.find((t) => t.key === tab)?.label ?? "";

  const totalCustomers = new Set(sales.map((s) => s.customer)).size;
  const totalQuantity = stats.reduce((a, s) => a + s.totalQuantity, 0);
  const totalAmount = stats.reduce((a, s) => a + s.totalAmount, 0);

  /* ── customers by region (for 지역별 tab) ── */
  const customersByRegion: Record<string, string[]> = {};
  if (tab === "region") {
    for (const c of customers) {
      const broad = toBroadRegion(c.region);
      if (!customersByRegion[broad]) customersByRegion[broad] = [];
      if (!customersByRegion[broad].includes(c.customer)) {
        customersByRegion[broad].push(c.customer);
      }
    }
  }

  /* ────────── loading state ────────── */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-500 text-sm">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  /* ────────── error state ────────── */

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-sm p-8 max-w-md">
          <p className="text-red-500 text-lg font-semibold mb-2">오류 발생</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  /* ────────── main render ────────── */

  return (
    <div className="p-3 md:p-6 bg-[#f8fafc] min-h-screen">
      {/* 헤더 */}
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-900">데이터 분석</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          지역별 · 등급별 · 유통시장별 · 상품분류별 분석
        </p>
      </div>

      {/* 탭 */}
      <div className="flex flex-wrap gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {stats.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-2">데이터가 없습니다</p>
          <p className="text-gray-400 text-sm">
            Google Sheets에 매출 데이터를 확인해주세요
          </p>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <SummaryCard
              label={`${tabLabel} 분류 수`}
              value={String(stats.length)}
              unit="개"
              color="text-blue-600"
              bg="bg-blue-50"
            />
            <SummaryCard
              label="거래처 수"
              value={fmt(totalCustomers)}
              unit="곳"
              color="text-green-600"
              bg="bg-green-50"
            />
            <SummaryCard
              label="총 출고수량"
              value={fmt(totalQuantity)}
              unit="개"
              color="text-purple-600"
              bg="bg-purple-50"
            />
            <SummaryCard
              label="총 매출금액"
              value={fmtAmt(totalAmount)}
              unit="원"
              color="text-amber-600"
              bg="bg-amber-50"
            />
          </div>

          {/* 차트 영역 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 바 차트 (horizontal) */}
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm p-3 md:p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">
                {tabLabel} 매출금액
              </h2>
              <p className="text-[11px] text-gray-400 mb-4">금액 기준 상위 항목</p>
              <ResponsiveContainer width="100%" height={Math.max(300, stats.length * 35)}>
                <BarChart
                  data={stats.map((s) => ({
                    name: s.name,
                    금액: Math.round(s.totalAmount / 10000),
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickFormatter={(v: number) => fmtAmt(v) + "만"}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: "#374151", fontSize: 11 }}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [fmt(Number(value)) + "만원", "매출금액"]}
                  />
                  <Bar dataKey="금액" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 도넛 차트 */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">
                {tabLabel} 매출 비중
              </h2>
              <p className="text-[11px] text-gray-400 mb-2">매출금액 기준</p>
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie
                    data={stats.slice(0, 9).map((s) => ({
                      name: s.name,
                      value: s.totalAmount,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    stroke="none"
                    paddingAngle={2}
                  >
                    {stats.slice(0, 9).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [fmtAmt(Number(value)) + "원", "매출금액"]}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: "#64748b", fontSize: "10px" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 상세 테이블 */}
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              {tabLabel} 상세 현황
            </h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-2.5 px-3">#</th>
                  <th className="text-left py-2.5 px-3">
                    {tabLabel.replace("별", "")}
                  </th>
                  <th className="text-right py-2.5 px-3">거래처수</th>
                  <th className="text-right py-2.5 px-3">출고수량</th>
                  <th className="text-right py-2.5 px-3">매출금액</th>
                  <th className="text-right py-2.5 px-3">비중(%)</th>
                  <th className="py-2.5 px-3 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => {
                  const pct =
                    totalAmount > 0
                      ? (s.totalAmount / totalAmount) * 100
                      : 0;
                  return (
                    <tr
                      key={s.name}
                      className={`border-b border-gray-50 ${
                        i % 2 === 1 ? "bg-gray-50/50" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block w-5 h-5 rounded text-center text-[10px] leading-5 font-bold ${
                            i < 3
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                          {s.name}
                        </div>
                      </td>
                      <td className="text-right py-2.5 px-3 text-gray-500">
                        {fmt(s.customerCount)}곳
                      </td>
                      <td className="text-right py-2.5 px-3 text-gray-500">
                        {fmt(s.totalQuantity)}개
                      </td>
                      <td className="text-right py-2.5 px-3 text-green-600 font-medium">
                        {fmtAmt(s.totalAmount)}원
                      </td>
                      <td className="text-right py-2.5 px-3 text-amber-600 font-medium">
                        {pct.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-24 bg-gray-100 rounded-full h-2 ml-auto">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td className="py-2.5 px-3" colSpan={2}>
                    <span className="font-semibold text-gray-900">합계</span>
                  </td>
                  <td className="text-right py-2.5 px-3 font-semibold">
                    {fmt(stats.reduce((a, s) => a + s.customerCount, 0))}곳
                  </td>
                  <td className="text-right py-2.5 px-3 font-semibold">
                    {fmt(totalQuantity)}개
                  </td>
                  <td className="text-right py-2.5 px-3 font-semibold text-green-600">
                    {fmtAmt(totalAmount)}원
                  </td>
                  <td className="text-right py-2.5 px-3 font-semibold">100%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 지역별 탭 - 거래처 분포 */}
          {tab === "region" && Object.keys(customersByRegion).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                지역별 거래처 분포
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(customersByRegion)
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([region, custs]) => (
                    <div
                      key={region}
                      className="border border-gray-100 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-900">
                          {region}
                        </h3>
                        <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          {custs.length}곳
                        </span>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {custs.map((c, i) => (
                          <div
                            key={i}
                            className="text-[11px] text-gray-500 py-0.5 border-b border-gray-50 last:border-0"
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ────────── summary card ────────── */

function SummaryCard({
  label,
  value,
  unit,
  color,
  bg,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-2xl shadow-sm border border-gray-100 p-4`}>
      <p className="text-[11px] text-gray-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${color}`}>{value}</span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
    </div>
  );
}
