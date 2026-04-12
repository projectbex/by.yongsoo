"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart,
} from "recharts";

interface RevenueData {
  summary: {
    totalCount: number;
    totalAmount: number;
    supplyAmount: number;
    taxAmount: number;
    totalQuantity: number;
  };
  weeklySales: { week: number | null; totalAmount: number; totalQuantity: number; count: number }[];
  monthlySales: { month: string | null; totalAmount: number; totalQuantity: number; count: number }[];
  staffRevenue: { staff: { name: string }; totalAmount: number; supplyAmount: number; totalQuantity: number }[];
  productRevenue: { product: { name: string }; totalAmount: number; totalQuantity: number }[];
  regionSales: { region: string; count: number; totalAmount: number; totalQuantity: number }[];
}

function fmt(num: number) { return new Intl.NumberFormat("ko-KR").format(Math.round(num)); }
function fmtAmt(num: number) {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + "억";
  if (num >= 10000) return (num / 10000).toFixed(0) + "만";
  return fmt(num);
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1"];
const REGIONS = ["전체", "수도권", "충남/충북", "경남/경북", "강원도", "호남"] as const;

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [month, setMonth] = useState("");
  const [region, setRegion] = useState("전체");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "staff" | "products">("overview");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (region !== "전체") params.set("region", region);
    fetch(`/api/revenue?${params}`)
      .then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [month, region]);

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">매출 현황</h1>
          <p className="text-xs text-gray-400 mt-0.5">매출 분석 및 지역별 통계</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
          {data && (
            <div className="flex gap-2 text-xs">
              <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">{fmt(data.summary.totalCount)}건</span>
              <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">{fmt(data.summary.totalQuantity)}개</span>
            </div>
          )}
        </div>
      </div>

      {/* 지역 탭 */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {REGIONS.map((r) => (
          <button key={r} onClick={() => setRegion(r)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${region === r ? "bg-white text-gray-900 shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"}`}>
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">로딩 중...</div>
      ) : !data || data.summary.totalCount === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-2">매출 데이터가 없습니다</p>
          <p className="text-gray-400 text-sm">{region !== "전체" ? `"${region}" 지역의 데이터가 없습니다. 거래처에 지역 정보를 등록해주세요.` : "엑셀 업로드 후 데이터가 표시됩니다"}</p>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            <SummaryCard label="총 매출금액" value={fmtAmt(data.summary.totalAmount)} unit="원" color="text-blue-600" bg="bg-blue-50" big />
            <SummaryCard label="공급가액" value={fmtAmt(data.summary.supplyAmount)} unit="원" color="text-green-600" bg="bg-green-50" />
            <SummaryCard label="부가세액" value={fmtAmt(data.summary.taxAmount)} unit="원" color="text-amber-600" bg="bg-amber-50" />
            <SummaryCard label="총 출고건수" value={fmt(data.summary.totalCount)} unit="건" color="text-purple-600" bg="bg-purple-50" />
            <SummaryCard label="총 출고수량" value={fmt(data.summary.totalQuantity)} unit="개" color="text-pink-600" bg="bg-pink-50" />
          </div>

          {/* 서브탭 */}
          <div className="flex gap-1 mb-5 bg-gray-50 rounded-xl p-1 w-fit border border-gray-100">
            {([["overview", "전체 개요"], ["staff", "담당자 분석"], ["products", "상품 분석"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${tab === key ? "bg-white text-gray-900 shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* 주차별 매출 추이 - 꺾은선 차트 */}
                <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-1">주차별 매출 추이</h2>
                  <p className="text-[11px] text-gray-400 mb-4">금액 및 수량 기준</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.weeklySales.map((w) => ({ name: w.week + "주차", 금액: Math.round((w.totalAmount || 0) / 10000), 수량: w.totalQuantity }))}>
                      <defs>
                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickFormatter={(v) => fmtAmt(v)} />
                      <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                        formatter={(value, name) => [String(name) === "금액" ? fmt(Number(value)) + "만원" : fmt(Number(value)) + "개", String(name)]} />
                      <Area type="monotone" dataKey="금액" stroke="#3b82f6" strokeWidth={2} fill="url(#colorAmt)" dot={{ r: 4, fill: "#3b82f6" }} />
                      <Area type="monotone" dataKey="수량" stroke="#22c55e" strokeWidth={2} fill="url(#colorQty)" dot={{ r: 4, fill: "#22c55e" }} />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* 지역별 매출 비중 - 도넛 차트 */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-1">지역별 매출 비중</h2>
                  <p className="text-[11px] text-gray-400 mb-2">매출금액 기준</p>
                  {data.regionSales.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={data.regionSales.map((r) => ({ name: r.region, value: r.totalAmount }))} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" stroke="none" paddingAngle={2}>
                          {data.regionSales.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                          formatter={(value) => [fmtAmt(Number(value)) + "원", "매출금액"]} />
                        <Legend formatter={(value) => <span style={{ color: "#64748b", fontSize: "11px" }}>{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
                      지역 데이터가 없습니다
                    </div>
                  )}
                </div>
              </div>

              {/* 주차별 상세 + 지역별 상세 */}
              <div className="grid grid-cols-2 gap-4">
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
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">지역별 매출 상세</h2>
                  <table className="w-full text-xs">
                    <thead><tr className="text-gray-400 border-b border-gray-100">
                      <th className="text-left py-2">지역</th><th className="text-right py-2">건수</th><th className="text-right py-2">수량</th><th className="text-right py-2">금액</th><th className="text-right py-2">비중</th>
                    </tr></thead>
                    <tbody>
                      {data.regionSales.map((r, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              {r.region}
                            </div>
                          </td>
                          <td className="text-right text-gray-500">{fmt(r.count)}</td>
                          <td className="text-right text-gray-500">{fmt(r.totalQuantity)}</td>
                          <td className="text-right text-green-600 font-medium">{fmtAmt(r.totalAmount)}원</td>
                          <td className="text-right text-amber-600">{data.summary.totalAmount > 0 ? ((r.totalAmount / data.summary.totalAmount) * 100).toFixed(1) : 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === "staff" && (
            <div className="grid grid-cols-2 gap-4">
              {/* 담당자별 매출 바 차트 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">담당자별 매출 TOP 10</h2>
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={data.staffRevenue.map((s) => ({ name: s.staff.name, 금액: Math.round(s.totalAmount / 10000) }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickFormatter={(v) => fmtAmt(v) + "만"} />
                    <YAxis dataKey="name" type="category" tick={{ fill: "#374151", fontSize: 12 }} axisLine={false} width={60} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value) => [fmt(Number(value)) + "만원", "매출금액"]} />
                    <Bar dataKey="금액" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 담당자별 매출 비중 - 도넛 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">담당자별 매출 비중</h2>
                <p className="text-[11px] text-gray-400 mb-2">매출금액 기준</p>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={data.staffRevenue.map((s) => ({ name: s.staff.name, value: s.totalAmount }))} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" stroke="none" paddingAngle={2}>
                      {data.staffRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value) => [fmtAmt(Number(value)) + "원", "매출금액"]} />
                    <Legend formatter={(value) => <span style={{ color: "#64748b", fontSize: "11px" }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 담당자별 상세 테이블 */}
              <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">담당자별 매출 상세</h2>
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left py-2">#</th><th className="text-left py-2">담당자</th><th className="text-right py-2">수량</th><th className="text-right py-2">공급가액</th><th className="text-right py-2">합계금액</th><th className="text-right py-2">비중</th>
                  </tr></thead>
                  <tbody>
                    {data.staffRevenue.map((s, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2.5 text-gray-400">{i + 1}</td>
                        <td className="py-2.5 font-medium text-gray-900">{s.staff.name}</td>
                        <td className="text-right text-gray-500">{fmt(s.totalQuantity)}개</td>
                        <td className="text-right text-gray-500">{fmtAmt(s.supplyAmount)}원</td>
                        <td className="text-right text-green-600 font-medium">{fmtAmt(s.totalAmount)}원</td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(100, data.summary.totalAmount > 0 ? (s.totalAmount / data.summary.totalAmount) * 100 : 0)}%` }} />
                            </div>
                            <span className="text-amber-600 w-10 text-right">{data.summary.totalAmount > 0 ? ((s.totalAmount / data.summary.totalAmount) * 100).toFixed(1) : 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "products" && (
            <div className="grid grid-cols-3 gap-4">
              {/* 상품별 수량 추이 - 꺾은선 */}
              <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">상위 판매 상품 TOP 10</h2>
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left py-2">순위</th><th className="text-left py-2">상품명</th><th className="text-right py-2">수량</th><th className="text-right py-2">매출금액</th><th className="text-right py-2">비중</th>
                  </tr></thead>
                  <tbody>
                    {data.productRevenue.map((p, i) => {
                      const pct = data.summary.totalAmount > 0 ? ((p.totalAmount / data.summary.totalAmount) * 100).toFixed(1) : "0";
                      return (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5"><span className={`inline-block w-5 h-5 rounded text-center text-[10px] leading-5 font-bold ${i < 3 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>{i + 1}</span></td>
                          <td className="py-2.5 font-medium text-gray-900">{p.product.name}</td>
                          <td className="text-right text-gray-500">{fmt(p.totalQuantity)}개</td>
                          <td className="text-right text-green-600 font-medium">{fmtAmt(p.totalAmount)}원</td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(100, Number(pct))}%` }} />
                              </div>
                              <span className="text-amber-600 w-10 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 상품별 매출 비중 - 도넛 차트 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">상품별 매출 비중</h2>
                <p className="text-[11px] text-gray-400 mb-2">매출금액 기준 TOP 10</p>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={data.productRevenue.map((p) => ({ name: p.product.name, value: p.totalAmount }))} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" stroke="none" paddingAngle={2}>
                      {data.productRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value) => [fmtAmt(Number(value)) + "원", "매출금액"]} />
                    <Legend formatter={(value) => <span style={{ color: "#64748b", fontSize: "11px" }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, unit, color, bg, big }: { label: string; value: string; unit: string; color: string; bg: string; big?: boolean }) {
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
