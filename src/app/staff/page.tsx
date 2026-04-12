"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { fetchSheet, parseSalesSheet, SaleRow } from "@/lib/sheets";

const COLORS = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4","#F97316"];

function fmt(n: number) { return new Intl.NumberFormat("ko-KR").format(Math.round(n)); }
function fmtAmt(n: number) {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
  if (n >= 10000) return (n / 10000).toFixed(0) + "만원";
  return fmt(n) + "원";
}

interface StaffStat {
  name: string;
  totalAmount: number;
  totalQuantity: number;
  customerCount: number;
  customers: { name: string; amount: number; quantity: number }[];
}

export default function StaffPage() {
  const [staffStats, setStaffStats] = useState<StaffStat[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const salesRows = await fetchSheet("매출데이터");
        const sales = parseSalesSheet(salesRows);
        const map = new Map<string, { customers: Map<string, { amount: number; quantity: number }>; totalAmt: number; totalQty: number }>();
        for (const s of sales) {
          if (!s.staff) continue;
          let bucket = map.get(s.staff);
          if (!bucket) { bucket = { customers: new Map(), totalAmt: 0, totalQty: 0 }; map.set(s.staff, bucket); }
          const amt = s.supplyAmount + s.taxAmount;
          bucket.totalAmt += amt;
          bucket.totalQty += s.quantity;
          const cust = bucket.customers.get(s.customer) || { amount: 0, quantity: 0 };
          cust.amount += amt;
          cust.quantity += s.quantity;
          bucket.customers.set(s.customer, cust);
        }
        const stats: StaffStat[] = Array.from(map.entries())
          .map(([name, b]) => ({
            name, totalAmount: b.totalAmt, totalQuantity: b.totalQty,
            customerCount: b.customers.size,
            customers: Array.from(b.customers.entries())
              .map(([n, c]) => ({ name: n, amount: c.amount, quantity: c.quantity }))
              .sort((a, b) => b.amount - a.amount),
          }))
          .sort((a, b) => b.totalAmount - a.totalAmount);
        setStaffStats(stats);
        if (stats.length > 0) setSelected(stats[0].name);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="inline-block w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  const selectedStaff = staffStats.find(s => s.name === selected);
  const chartData = staffStats.slice(0, 10).map(s => ({ name: s.name, 매출금액: s.totalAmount }));

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-900">담당자별 매출 현황</h1>
        <p className="text-xs text-gray-400 mt-0.5">담당자별 매출 및 거래처 상세</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">담당자별 매출금액</h2>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={(v) => fmtAmt(v)} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [fmt(Number(v)) + "원", "매출금액"]} />
              <Bar dataKey="매출금액" fill="#3B82F6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">담당자 상세</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {staffStats.map((s) => (
              <button key={s.name} onClick={() => setSelected(s.name)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${selected === s.name ? "bg-blue-500 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {s.name}
              </button>
            ))}
          </div>
          {selectedStaff && (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-blue-600">{fmtAmt(selectedStaff.totalAmount)}</p>
                  <p className="text-xs text-gray-500">매출금액</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-green-600">{fmt(selectedStaff.totalQuantity)}</p>
                  <p className="text-xs text-gray-500">수량</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-purple-600">{selectedStaff.customerCount}</p>
                  <p className="text-xs text-gray-500">거래처</p>
                </div>
              </div>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">거래처</th>
                      <th className="text-right py-2 px-3 text-gray-600 font-medium">수량</th>
                      <th className="text-right py-2 px-3 text-gray-600 font-medium">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStaff.customers.slice(0, 15).map((c, i) => (
                      <tr key={c.name} className={i % 2 ? "bg-gray-50/50" : ""}>
                        <td className="py-1.5 px-3 text-gray-700 truncate max-w-[200px]">{c.name}</td>
                        <td className="py-1.5 px-3 text-right text-gray-600">{fmt(c.quantity)}</td>
                        <td className="py-1.5 px-3 text-right font-medium text-gray-800">{fmtAmt(c.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
