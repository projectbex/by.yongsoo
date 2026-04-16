"use client";

import { SaleRow } from "@/lib/sheets";
import { fmtKrw } from "@/lib/format";

interface Props {
  sales: SaleRow[];
}

export default function InsightBanner({ sales }: Props) {
  if (sales.length === 0) return null;

  // 상위 상품 찾기
  const prodMap = new Map<string, number>();
  sales.forEach((s) => {
    const n = s.product || "기타";
    prodMap.set(n, (prodMap.get(n) || 0) + s.revenue);
  });
  const sorted = [...prodMap.entries()].sort((a, b) => b[1] - a[1]);
  const topProduct = sorted[0]?.[0] || "";
  const topAmount = sorted[0]?.[1] || 0;

  // 하위 상품
  const bottomProduct = sorted.length > 1 ? sorted[sorted.length - 1]?.[0] : "";

  const totalAmt = sales.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-100 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl">💡</span>
        <div className="space-y-1">
          <p className="text-sm text-slate-800 font-medium">
            총 매출 {fmtKrw(totalAmt)} 달성 ·
            <span className="text-blue-600"> {topProduct}</span>이 {fmtKrw(topAmount)}으로 최고 매출
          </p>
          {bottomProduct && (
            <p className="text-xs text-slate-500">
              ⚠️ {bottomProduct} 매출 저조 → 프로모션 검토 필요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
