"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface StaffSale {
  staffName: string;
  department: string;
  customers: { name: string; quantity: number; amount: number }[];
  totalQuantity: number;
  totalAmount: number;
}

function formatNumber(num: number) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(num));
}

function formatAmount(num: number) {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + "억";
  if (num >= 10000) return (num / 10000).toFixed(0) + "만";
  return formatNumber(num);
}

export default function StaffPage() {
  const [data, setData] = useState<StaffSale[]>([]);
  const [month, setMonth] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    const res = await fetch(`/api/staff?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const selectedData = data.find((d) => d.staffName === selected);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">담당자별 매출 현황</h1>
          <p className="text-xs text-gray-400 mt-0.5">담당자별 매출 및 거래처 상세</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">로딩 중...</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* 담당자별 매출 차트 */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">담당자별 매출금액</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.map((d) => ({ name: d.staffName, 금액: Math.round(d.totalAmount / 10000), 수량: d.totalQuantity }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickFormatter={(v) => formatAmount(v) + "만"} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#374151", fontSize: 12 }} axisLine={false} width={60} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value, name) => [String(name) === "금액" ? formatNumber(Number(value)) + "만원" : formatNumber(Number(value)) + "개", String(name)]}
                />
                <Bar dataKey="금액" fill="#3b82f6" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(d) => setSelected(d.name ?? null)} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 담당자 목록 테이블 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">담당자 상세</h2>
            <div className="space-y-1 max-h-[420px] overflow-y-auto">
              {data.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(d.staffName === selected ? null : d.staffName)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all ${
                    selected === d.staffName
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium">{d.staffName}</span>
                    <span className="text-green-600 font-semibold">{formatAmount(d.totalAmount)}원</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-gray-400">
                    <span>수량 {formatNumber(d.totalQuantity)}개</span>
                    <span>거래처 {d.customers.length}곳</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 선택된 담당자의 거래처별 상세 */}
          {selectedData && (
            <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                <span className="text-blue-600">{selectedData.staffName}</span> 거래처별 매출 상세
              </h2>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left py-2">#</th>
                    <th className="text-left py-2">거래처명</th>
                    <th className="text-right py-2">수량</th>
                    <th className="text-right py-2">금액</th>
                    <th className="text-right py-2">비중</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedData.customers.map((c, i) => {
                    const pct = selectedData.totalAmount > 0 ? ((c.amount / selectedData.totalAmount) * 100).toFixed(1) : "0";
                    return (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2.5 text-gray-400">{i + 1}</td>
                        <td className="py-2.5 text-gray-700">{c.name}</td>
                        <td className="text-right text-gray-500">{formatNumber(c.quantity)}</td>
                        <td className="text-right text-green-600 font-medium">{formatAmount(c.amount)}원</td>
                        <td className="text-right text-amber-600">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
