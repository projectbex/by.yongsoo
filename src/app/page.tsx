"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts";

interface DashboardData {
  summary: {
    totalSales: number;
    totalQuantity: number;
    totalAmount: number;
    productCount: number;
    customerCount: number;
  };
  staffSales: { staff: { name: string }; totalAmount: number; totalQuantity: number }[];
  weeklySales: { week: number; totalAmount: number; totalQuantity: number; count: number }[];
  topProducts: { product: { name: string }; totalAmount: number; totalQuantity: number }[];
}

function fmt(num: number) { return new Intl.NumberFormat("ko-KR").format(Math.round(num)); }
function fmtAmt(num: number) {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + "억";
  if (num >= 10000) return (num / 10000).toFixed(0) + "만";
  return fmt(num);
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1"];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard${month ? `?month=${month}` : ""}`)
      .then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [month]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">BEX 유통영업본부 출고 대시보드</h1>
          <p className="text-xs text-gray-400 mt-0.5">벡스인터코퍼레이션 SCM</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
          {data && (
            <div className="flex gap-2 text-xs">
              <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">SKU {data.summary.productCount}</span>
              <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">거래처 {data.summary.customerCount}</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">로딩 중...</div>
      ) : !data || data.summary.totalSales === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-2">아직 데이터가 없습니다</p>
          <p className="text-gray-400 text-sm">엑셀 업로드 메뉴에서 출고현황 파일을 업로드해주세요</p>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            <Card label="총 출고건수" value={fmt(data.summary.totalSales)} unit="건" color="text-blue-600" bg="bg-blue-50" />
            <Card label="총 출고수량" value={fmt(data.summary.totalQuantity)} unit="개" color="text-green-600" bg="bg-green-50" />
            <Card label="총 매출금액" value={fmtAmt(data.summary.totalAmount)} unit="원" color="text-amber-600" bg="bg-amber-50" big />
            <Card label="등록 상품수" value={String(data.summary.productCount)} unit="개" color="text-purple-600" bg="bg-purple-50" />
            <Card label="거래처 수" value={String(data.summary.customerCount)} unit="곳" color="text-pink-600" bg="bg-pink-50" />
          </div>

          {/* 차트 영역 */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* 주차별 출고 추이 - 꺾은선 */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">주차별 출고 추이</h2>
              <p className="text-[11px] text-gray-400 mb-4">수량 및 금액 기준</p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.weeklySales.map((w) => ({ name: w.week + "주차", 수량: w.totalQuantity, 금액: Math.round(w.totalAmount / 10000) }))}>
                  <defs>
                    <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickFormatter={(v) => fmtAmt(v)} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value, name) => [String(name) === "금액" ? fmt(Number(value)) + "만원" : fmt(Number(value)) + "개", String(name)]} />
                  <Area type="monotone" dataKey="수량" stroke="#3b82f6" strokeWidth={2} fill="url(#gradBlue)" dot={{ r: 4, fill: "#3b82f6" }} />
                  <Area type="monotone" dataKey="금액" stroke="#22c55e" strokeWidth={2} fill="url(#gradGreen)" dot={{ r: 4, fill: "#22c55e" }} />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* 상품별 판매 비중 - 도넛 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">상품별 판매 비중</h2>
              <p className="text-[11px] text-gray-400 mb-2">매출금액 기준 TOP 10</p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={data.topProducts.map((p) => ({ name: p.product.name, value: p.totalAmount }))} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value" stroke="none" paddingAngle={2}>
                    {data.topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value) => [fmtAmt(Number(value)) + "원", "매출금액"]} />
                  <Legend formatter={(value) => <span style={{ color: "#64748b", fontSize: "11px" }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 하단: 담당자별 + 주차별 상세 + 상품 TOP 10 */}
          <div className="grid grid-cols-3 gap-4">
            {/* 담당자별 매출 TOP 10 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">담당자별 매출 TOP 10</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.staffSales.map((s) => ({ name: s.staff.name, 금액: Math.round(s.totalAmount / 10000) }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickFormatter={(v) => fmtAmt(v) + "만"} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#374151", fontSize: 12 }} axisLine={false} width={60} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value) => [fmt(Number(value)) + "만원", "매출금액"]} />
                  <Bar dataKey="금액" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 주차별 상세 테이블 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">주차별 상세</h2>
              <table className="w-full text-xs">
                <thead><tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left py-2">주차</th><th className="text-right py-2">건수</th><th className="text-right py-2">수량</th><th className="text-right py-2">금액</th>
                </tr></thead>
                <tbody>
                  {data.weeklySales.map((w) => (
                    <tr key={w.week} className="border-b border-gray-50">
                      <td className="py-2.5">{w.week}주차</td>
                      <td className="text-right text-gray-500">{fmt(w.count)}</td>
                      <td className="text-right text-gray-500">{fmt(w.totalQuantity)}</td>
                      <td className="text-right text-green-600 font-medium">{fmtAmt(w.totalAmount)}원</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t border-gray-200">
                  <td className="py-2.5 font-semibold">합계</td>
                  <td className="text-right font-semibold">{fmt(data.weeklySales.reduce((a, w) => a + w.count, 0))}</td>
                  <td className="text-right font-semibold">{fmt(data.summary.totalQuantity)}</td>
                  <td className="text-right text-green-600 font-semibold">{fmtAmt(data.summary.totalAmount)}원</td>
                </tr></tfoot>
              </table>
            </div>

            {/* 상품 TOP 10 테이블 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">상위 판매 상품</h2>
              <table className="w-full text-xs">
                <thead><tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left py-2">#</th><th className="text-left py-2">상품명</th><th className="text-right py-2">수량</th><th className="text-right py-2">금액</th>
                </tr></thead>
                <tbody>
                  {data.topProducts.map((p, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2"><span className={`inline-block w-5 h-5 rounded text-center text-[10px] leading-5 font-bold ${i < 3 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>{i + 1}</span></td>
                      <td className="py-2 font-medium text-gray-900 max-w-[120px] truncate">{p.product.name}</td>
                      <td className="text-right text-gray-500">{fmt(p.totalQuantity)}</td>
                      <td className="text-right text-green-600 font-medium">{fmtAmt(p.totalAmount)}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ label, value, unit, color, bg, big }: { label: string; value: string; unit: string; color: string; bg: string; big?: boolean }) {
  return (
    <div className={`${bg} rounded-xl border border-gray-100 p-4`}>
      <p className="text-[11px] text-gray-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`${big ? "text-2xl" : "text-xl"} font-bold ${color}`}>{value}</span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
    </div>
  );
}
