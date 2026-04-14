"use client";

import { SaleRow } from "@/lib/sheets";
import { fmtKrw, fmt } from "@/lib/format";

interface Props {
  sales: SaleRow[];
}

export default function InsightBanner({ sales }: Props) {
  if (sales.length === 0) return null;

  // 상위 상품 찾기
  const prodMap = new Map<string, number>();
  sales.forEach((s) => {
    const n = s.product || "기타";
    prodMap.set(n, (prodMap.get(n) || 0) + s.supplyAmount + s.taxAmount);
  });
  const sorted = [...prodMap.entries()].sort((a, b) => b[1] - a[1]);
  const topProduct = sorted[0]?.[0] || "";
  const topAmount = sorted[0]?.[1] || 0;

  // 하위 상품
  const bottomProduct = sorted.length > 1 ? sorted[sorted.length - 1]?.[0] : "";

  const totalAmt = sales.reduce((s, d) => s + d.supplyAmount + d.taxAmount, 0);

  return (
    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-xl p-4 mb-5">
      <div className="flex items-start gap-3">
        <span className="text-xl">💡</span>
        <div className="space-y-1">
          <p className="text-sm text-white font-medium">
            총 매출 {fmtKrw(totalAmt)} 달성 ·
            <span className="text-blue-400"> {topProduct}</span>이 {fmtKrw(topAmount)}으로 최고 매출
          </p>
          {bottomProduct && (
            <p className="text-xs text-gray-400">
              ⚠️ {bottomProduct} 매출 저조 → 프로모션 검토 필요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
