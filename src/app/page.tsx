"use client";

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useData } from "@/lib/dataContext";
import { fmt, fmtKrw } from "@/lib/format";
import KpiCard from "@/components/KpiCard";
import InsightBanner from "@/components/InsightBanner";
import { PageHeader, ChartCard, LoadingState, ErrorState, CHART_COLORS, TOOLTIP_STYLE } from "@/components/ui";
import { useMemo } from "react";

function extractCategory(p: string): string {
  return (p.split(" ")[0] || "기타");
}

function dateToYmd(s: string): string {
  return s.replace(/[^0-9]/g, "").slice(0, 8);
}

export default function HomePage() {
  const { filtered, loading, error, reload, customerMap } = useData();

  const kpi = useMemo(() => {
    const totalAmt = filtered.reduce((s, r) => s + r.supplyAmount + r.taxAmount, 0);
    const totalQty = filtered.reduce((s, r) => s + r.quantity, 0);
    const custCount = new Set(filtered.map((r) => r.customer)).size;
    const supply = filtered.reduce((s, r) => s + r.supplyAmount, 0);
    const profitRate = totalAmt > 0 ? ((totalAmt - supply) / totalAmt) * 100 : 0;
    return { totalAmt, totalQty, custCount, txCount: filtered.length, profitRate };
  }, [filtered]);

  const monthly = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => {
      const ymd = dateToYmd(r.saleDate);
      if (ymd.length < 6) return;
      const ym = ymd.slice(0, 6);
      m.set(ym, (m.get(ym) || 0) + r.supplyAmount + r.taxAmount);
    });
    return [...m.entries()].sort().map(([ym, amt]) => ({
      name: `${ym.slice(4, 6)}월`,
      금액: Math.round(amt / 10000),
    }));
  }, [filtered]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => {
      const c = extractCategory(r.product);
      m.set(c, (m.get(c) || 0) + r.supplyAmount + r.taxAmount);
    });
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, v]) => ({ name, 금액: Math.round(v / 10000) }));
  }, [filtered]);

  const topCustomers = useMemo(() => {
    const m = new Map<string, { amt: number; qty: number }>();
    filtered.forEach((r) => {
      const e = m.get(r.customer) || { amt: 0, qty: 0 };
      e.amt += r.supplyAmount + r.taxAmount;
      e.qty += r.quantity;
      m.set(r.customer, e);
    });
    return [...m.entries()]
      .sort((a, b) => b[1].amt - a[1].amt)
      .slice(0, 10)
      .map(([customer, v]) => {
        const info = customerMap.get(customer);
        return { customer, amt: v.amt, qty: v.qty, region: info?.region || "-", staff: info?.staff || "-" };
      });
  }, [filtered, customerMap]);

  const productRank = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => {
      m.set(r.product, (m.get(r.product) || 0) + r.supplyAmount + r.taxAmount);
    });
    const sorted = [...m.entries()].sort((a, b) => b[1] - a[1]);
    return {
      top: sorted.slice(0, 5),
      worst: sorted.slice(-5).reverse(),
    };
  }, [filtered]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="전체 개요"
        subtitle="BEX 유통영업본부 · 실시간 영업 현황"
      />

      <InsightBanner sales={filtered} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="총 매출" value={fmtKrw(kpi.totalAmt)} icon="💰" />
        <KpiCard label="총 수량" value={fmt(kpi.totalQty)} unit="개" icon="📦" />
        <KpiCard label="거래처" value={fmt(kpi.custCount)} unit="곳" icon="🏢" />
        <KpiCard label="거래 건수" value={fmt(kpi.txCount)} unit="건" icon="📊" />
      </div>

      {/* Main Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="월별 매출 추이" subtitle="매출금액(만원)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickFormatter={(v) => fmt(v)} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v) => [fmt(Number(v)) + "만원", "매출"]}
              />
              <Line type="monotone" dataKey="금액" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, fill: "#3B82F6" }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="유종별 매출" subtitle="만원">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickFormatter={(v) => fmt(v)} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#d1d5db", fontSize: 11 }} axisLine={false} width={70} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v) => [fmt(Number(v)) + "만원", "매출"]}
              />
              <Bar dataKey="금액" radius={[0, 4, 4, 0]}>
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Customers */}
        <ChartCard title="TOP 거래처" subtitle="매출금액 기준 상위 10곳">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">#</th>
                  <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">거래처</th>
                  <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">담당자</th>
                  <th className="text-right py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">매출</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c, i) => (
                  <tr key={c.customer} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 px-2 text-xs text-gray-500">{i + 1}</td>
                    <td className="py-2 px-2 text-xs text-white font-medium max-w-[140px] truncate">{c.customer}</td>
                    <td className="py-2 px-2 text-xs text-gray-400">{c.staff}</td>
                    <td className="py-2 px-2 text-xs text-blue-400 font-medium text-right whitespace-nowrap">{fmtKrw(c.amt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        {/* Top / Worst Products */}
        <div className="grid grid-cols-1 gap-4">
          <ChartCard title="TOP 상품" subtitle="매출 TOP 5">
            <div className="space-y-2">
              {productRank.top.map(([name, amt], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-[11px] w-5 h-5 rounded-full bg-emerald-400/10 text-emerald-400 flex items-center justify-center font-semibold">{i + 1}</span>
                  <span className="text-xs text-gray-300 flex-1 truncate">{name}</span>
                  <span className="text-xs text-emerald-400 font-medium whitespace-nowrap">{fmtKrw(amt)}</span>
                </div>
              ))}
            </div>
          </ChartCard>
          <ChartCard title="WORST 상품" subtitle="매출 하위 5">
            <div className="space-y-2">
              {productRank.worst.map(([name, amt], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-[11px] w-5 h-5 rounded-full bg-red-400/10 text-red-400 flex items-center justify-center font-semibold">{i + 1}</span>
                  <span className="text-xs text-gray-300 flex-1 truncate">{name}</span>
                  <span className="text-xs text-red-400 font-medium whitespace-nowrap">{fmtKrw(amt)}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

