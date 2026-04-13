"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";
import {
  fetchSheet, parseSalesSheet, parseCustomerSheet, getWeekNumber,
  SaleRow, CustomerInfo,
} from "@/lib/sheets";

const PIE_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6B7280",
];

function fmt(num: number) {
  return num.toLocaleString();
}

function fmtEok(amount: number) {
  return (amount / 100000000).toFixed(1) + "억";
}

interface WeekData {
  name: string;
  금액: number;
  수량: number;
}

interface PieData {
  name: string;
  value: number;
}

interface StaffData {
  name: string;
  금액: number;
}

interface RecentSale {
  date: string;
  staff: string;
  customer: string;
  product: string;
  quantity: number;
  amount: number;
}

export default function Dashboard() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [customerMap, setCustomerMap] = useState<Map<string, CustomerInfo>>(new Map());
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

  // Summary calculations
  const totalCount = sales.length;
  const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);
  const totalAmount = sales.reduce((sum, s) => sum + s.supplyAmount + s.taxAmount, 0);
  const uniqueCustomers = new Set(sales.map((s) => s.customer)).size;

  // Weekly data
  const weekMap = new Map<number, { amount: number; quantity: number }>();
  for (const s of sales) {
    const week = getWeekNumber(s.saleDate);
    if (week === 0) continue;
    const existing = weekMap.get(week) || { amount: 0, quantity: 0 };
    existing.amount += s.supplyAmount + s.taxAmount;
    existing.quantity += s.quantity;
    weekMap.set(week, existing);
  }
  const weeklyData: WeekData[] = [1, 2, 3, 4, 5]
    .filter((w) => weekMap.has(w))
    .map((w) => ({
      name: `${w}주차`,
      금액: Math.round((weekMap.get(w)?.amount || 0) / 10000),
      수량: weekMap.get(w)?.quantity || 0,
    }));

  // Product pie data (top 8 + 기타)
  const productMap = new Map<string, number>();
  for (const s of sales) {
    const name = s.product || "기타";
    productMap.set(name, (productMap.get(name) || 0) + s.supplyAmount + s.taxAmount);
  }
  const sortedProducts = Array.from(productMap.entries()).sort((a, b) => b[1] - a[1]);
  const pieData: PieData[] = [];
  let etcAmount = 0;
  for (let i = 0; i < sortedProducts.length; i++) {
    if (i < 8) {
      pieData.push({ name: sortedProducts[i][0], value: sortedProducts[i][1] });
    } else {
      etcAmount += sortedProducts[i][1];
    }
  }
  if (etcAmount > 0) {
    pieData.push({ name: "기타", value: etcAmount });
  }
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  // Staff bar data (top 8)
  const staffMap = new Map<string, number>();
  for (const s of sales) {
    const name = s.staff || "미지정";
    staffMap.set(name, (staffMap.get(name) || 0) + s.supplyAmount + s.taxAmount);
  }
  const staffData: StaffData[] = Array.from(staffMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, amount]) => ({
      name,
      금액: Math.round(amount / 10000),
    }));

  // Recent transactions (last 10 by date)
  const recentSales: RecentSale[] = [...sales]
    .sort((a, b) => {
      const da = a.saleDate.replace(/[^0-9]/g, "");
      const db = b.saleDate.replace(/[^0-9]/g, "");
      return db.localeCompare(da);
    })
    .slice(0, 10)
    .map((s) => ({
      date: s.saleDate,
      staff: s.staff,
      customer: s.customer,
      product: s.product,
      quantity: s.quantity,
      amount: s.supplyAmount + s.taxAmount,
    }));

  return (
    <div className="min-h-screen bg-[#f8fafc] p-3 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">BEX 유통영업본부 출고 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">벡스인터코퍼레이션 SCM</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="총 출고건수"
          value={fmt(totalCount)}
          unit="건"
          borderColor="border-l-blue-500"
        />
        <SummaryCard
          label="총 출고수량"
          value={fmt(totalQuantity)}
          unit="개"
          borderColor="border-l-green-500"
        />
        <SummaryCard
          label="총 매출금액"
          value={fmtEok(totalAmount)}
          unit="원"
          borderColor="border-l-orange-500"
        />
        <SummaryCard
          label="거래처 수"
          value={fmt(uniqueCustomers)}
          unit="곳"
          borderColor="border-l-purple-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Weekly Area Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">주차별 출고 추이</h2>
          <p className="text-xs text-gray-500 mb-4">수량 및 금액(만원) 기준</p>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [
                  name === "금액" ? fmt(Number(value)) + "만원" : fmt(Number(value)) + "개",
                  String(name),
                ]}
              />
              <Area
                type="monotone"
                dataKey="금액"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fill="url(#gradBlue)"
                dot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="수량"
                stroke="#10B981"
                strokeWidth={2.5}
                fill="url(#gradGreen)"
                dot={{ r: 4, fill: "#10B981", strokeWidth: 0 }}
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Product Pie Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">상품별 매출 비중</h2>
          <p className="text-xs text-gray-500 mb-4">매출금액 기준 TOP 8</p>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                stroke="none"
                paddingAngle={2}
                label={({ name, value }) => {
                  const pct = ((value / pieTotal) * 100).toFixed(1);
                  return `${name} ${pct}%`;
                }}
                labelLine={{ stroke: "#94a3b8" }}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(value) => [fmt(Number(value)) + "원", "매출금액"]}
              />
              <Legend
                verticalAlign="bottom"
                formatter={(value: string) => (
                  <span style={{ color: "#6b7280", fontSize: "11px" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Staff Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">담당자별 매출 TOP 8</h2>
          <p className="text-xs text-gray-500 mb-4">매출금액(만원) 기준</p>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={staffData} layout="vertical">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickFormatter={(v: number) => fmt(v) + "만"}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "#374151", fontSize: 12 }}
                axisLine={false}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(value) => [fmt(Number(value)) + "만원", "매출금액"]}
              />
              <Bar dataKey="금액" fill="url(#barGrad)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">최근 거래 내역</h2>
          <p className="text-xs text-gray-500 mb-4">최근 10건</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500">일자</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500">담당자</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500">거래처</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500">품목</th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500">수량</th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500">금액</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-2.5 px-2 text-gray-700 text-xs whitespace-nowrap">
                      {sale.date}
                    </td>
                    <td className="py-2.5 px-2 text-gray-700 text-xs">{sale.staff}</td>
                    <td className="py-2.5 px-2 text-gray-900 text-xs font-medium max-w-[120px] truncate">
                      {sale.customer}
                    </td>
                    <td className="py-2.5 px-2 text-gray-700 text-xs max-w-[120px] truncate">
                      {sale.product}
                    </td>
                    <td className="py-2.5 px-2 text-right text-gray-700 text-xs">
                      {fmt(sale.quantity)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-blue-600 text-xs font-medium whitespace-nowrap">
                      {fmt(sale.amount)}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  borderColor,
}: {
  label: string;
  value: string;
  unit: string;
  borderColor: string;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-5 border-l-4 ${borderColor}`}>
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className="text-sm text-gray-400">{unit}</span>
      </div>
    </div>
  );
}
