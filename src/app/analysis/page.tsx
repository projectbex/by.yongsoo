"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface StatItem {
  name: string;
  customerCount: number;
  totalQuantity: number;
  totalAmount: number;
  percentage?: number;
}

interface AnalysisData {
  summary: { totalCustomers: number; totalQuantity: number; totalAmount: number };
  regionStats: StatItem[];
  gradeStats: StatItem[];
  marketStats: StatItem[];
  categoryStats: StatItem[];
  customersByRegion: Record<string, string[]>;
}

function fmt(n: number) { return new Intl.NumberFormat("ko-KR").format(Math.round(n)); }
function fmtAmt(n: number) {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
  if (n >= 10000) return (n / 10000).toFixed(0) + "만";
  return fmt(n);
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1", "#a855f7", "#64748b"];
const TABS = [
  { key: "region", label: "지역별", icon: "📍" },
  { key: "grade", label: "등급별", icon: "⭐" },
  { key: "market", label: "유통시장별", icon: "🏪" },
  { key: "category", label: "상품분류별", icon: "📦" },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function AnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [month, setMonth] = useState("");
  const [tab, setTab] = useState<TabKey>("region");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analysis${month ? `?month=${month}` : ""}`)
      .then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [month]);

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/import-metadata", { method: "POST" });
      const d = await res.json();
      if (res.ok) {
        setImportResult(`거래처 메타데이터 업데이트 완료: ${d.updatedCount}건 업데이트, ${d.notFoundCount}건 미매칭`);
        // 리로드
        const r2 = await fetch(`/api/analysis${month ? `?month=${month}` : ""}`);
        setData(await r2.json());
      } else {
        setImportResult(`오류: ${d.error}`);
      }
    } catch { setImportResult("가져오기 실패"); }
    setImporting(false);
  };

  const getStats = (): StatItem[] => {
    if (!data) return [];
    switch (tab) {
      case "region": return data.regionStats;
      case "grade": return data.gradeStats;
      case "market": return data.marketStats;
      case "category": return data.categoryStats;
    }
  };

  const stats = getStats();
  const tabLabel = TABS.find((t) => t.key === tab)?.label || "";

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900">데이터 분석</h1>
          <p className="text-xs text-gray-400 mt-0.5">지역별 · 등급별 · 유통시장별 · 상품분류별 분석</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
          <button onClick={handleImport} disabled={importing}
            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 disabled:bg-gray-300">
            {importing ? "가져오는 중..." : "거래처 정보 동기화"}
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${importResult.includes("오류") || importResult.includes("실패") ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
          {importResult}
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5 ${tab === t.key ? "bg-white text-gray-900 shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"}`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">로딩 중...</div>
      ) : !data || stats.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-2">데이터가 없습니다</p>
          <p className="text-gray-400 text-sm">거래처 정보 동기화 버튼을 눌러 CSV 데이터를 가져와주세요</p>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            <SummaryCard label={`${tabLabel} 분류 수`} value={String(stats.length)} unit="개" color="text-blue-600" bg="bg-blue-50" />
            <SummaryCard label="거래처 수" value={fmt(data.summary.totalCustomers)} unit="곳" color="text-green-600" bg="bg-green-50" />
            <SummaryCard label="총 출고수량" value={fmt(data.summary.totalQuantity)} unit="개" color="text-purple-600" bg="bg-purple-50" />
            <SummaryCard label="총 매출금액" value={fmtAmt(data.summary.totalAmount)} unit="원" color="text-amber-600" bg="bg-amber-50" />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* 바 차트 */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">{tabLabel} 매출금액</h2>
              <p className="text-[11px] text-gray-400 mb-4">금액 기준 상위 항목</p>
              <ResponsiveContainer width="100%" height={Math.max(300, stats.length * 35)}>
                <BarChart data={stats.map((s) => ({ name: s.name, 금액: Math.round(s.totalAmount / 10000), 수량: s.totalQuantity }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickFormatter={(v) => fmtAmt(v) + "만"} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#374151", fontSize: 11 }} axisLine={false} width={100} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value, name) => [String(name) === "금액" ? fmt(Number(value)) + "만원" : fmt(Number(value)) + "개", String(name)]} />
                  <Bar dataKey="금액" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 도넛 차트 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">{tabLabel} 매출 비중</h2>
              <p className="text-[11px] text-gray-400 mb-2">매출금액 기준</p>
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie data={stats.slice(0, 10).map((s) => ({ name: s.name, value: s.totalAmount }))} cx="50%" cy="50%" innerRadius={55} outerRadius={100} dataKey="value" stroke="none" paddingAngle={2}>
                    {stats.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value) => [fmtAmt(Number(value)) + "원", "매출금액"]} />
                  <Legend formatter={(value) => <span style={{ color: "#64748b", fontSize: "10px" }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 상세 테이블 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">{tabLabel} 상세 현황</h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-2.5 px-3">#</th>
                  <th className="text-left py-2.5 px-3">{tabLabel.replace("별", "")}</th>
                  <th className="text-right py-2.5 px-3">거래처 수</th>
                  <th className="text-right py-2.5 px-3">출고수량</th>
                  <th className="text-right py-2.5 px-3">매출금액</th>
                  <th className="text-right py-2.5 px-3">비중</th>
                  <th className="text-right py-2.5 px-3">비중 그래프</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => {
                  const pct = data.summary.totalAmount > 0 ? (s.totalAmount / data.summary.totalAmount * 100) : 0;
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3">
                        <span className={`inline-block w-5 h-5 rounded text-center text-[10px] leading-5 font-bold ${i < 3 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>{i + 1}</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          {s.name}
                        </div>
                      </td>
                      <td className="text-right py-2.5 px-3 text-gray-500">{fmt(s.customerCount)}곳</td>
                      <td className="text-right py-2.5 px-3 text-gray-500">{fmt(s.totalQuantity)}개</td>
                      <td className="text-right py-2.5 px-3 text-green-600 font-medium">{fmtAmt(s.totalAmount)}원</td>
                      <td className="text-right py-2.5 px-3 text-amber-600 font-medium">{pct.toFixed(1)}%</td>
                      <td className="py-2.5 px-3">
                        <div className="w-24 bg-gray-100 rounded-full h-2 ml-auto">
                          <div className="h-2 rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td className="py-2.5 px-3" colSpan={2}><span className="font-semibold text-gray-900">합계</span></td>
                  <td className="text-right py-2.5 px-3 font-semibold">{fmt(stats.reduce((a, s) => a + s.customerCount, 0))}곳</td>
                  <td className="text-right py-2.5 px-3 font-semibold">{fmt(data.summary.totalQuantity)}개</td>
                  <td className="text-right py-2.5 px-3 font-semibold text-green-600">{fmtAmt(data.summary.totalAmount)}원</td>
                  <td className="text-right py-2.5 px-3 font-semibold">100%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 지역별 탭일 때 거래처 분포 표시 */}
          {tab === "region" && data.customersByRegion && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">📍 지역별 거래처 분포</h2>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(data.customersByRegion).map(([region, customers]) => (
                  <div key={region} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-900">{region}</h3>
                      <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">{(customers as string[]).length}곳</span>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {(customers as string[]).map((c, i) => (
                        <div key={i} className="text-[11px] text-gray-500 py-0.5 border-b border-gray-50 last:border-0">
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

function SummaryCard({ label, value, unit, color, bg }: { label: string; value: string; unit: string; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl border border-gray-100 p-4`}>
      <p className="text-[11px] text-gray-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${color}`}>{value}</span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
    </div>
  );
}
