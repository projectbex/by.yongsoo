"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { mockVendors, mockProducts, mockBoms, mockSupplyItems } from "@/lib/scm-mock-data";
import { fmt } from "@/lib/format";

interface OrderLine {
  id: string;
  type: "상품" | "소모품";
  name: string;
  bomVersion: string;
  moq: string;
  quantity: number;
  unitPrice: number;
}

let lineCounter = 0;

export default function NewPurchaseOrderPage() {
  const [vendor, setVendor] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState("본사");
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [tab, setTab] = useState<"상품" | "소모품">("상품");
  const [itemSearch, setItemSearch] = useState("");

  const total = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0), [lines]);

  const addProduct = (productId: string) => {
    const product = mockProducts.find((p) => p.id === productId);
    if (!product) return;
    const bom = mockBoms.find((b) => b.productId === productId);
    const activeBom = bom?.versions.find((v) => v.active);
    setLines((prev) => [...prev, {
      id: `line-${++lineCounter}`,
      type: "상품",
      name: product.name,
      bomVersion: activeBom?.version || "—",
      moq: activeBom?.moqLevels[0]?.toString() || "—",
      quantity: activeBom?.moqLevels[0] || 1,
      unitPrice: product.unitCost,
    }]);
    setItemSearch("");
  };

  const addSupply = (supplyId: string) => {
    const supply = mockSupplyItems.find((s) => s.id === supplyId);
    if (!supply) return;
    setLines((prev) => [...prev, {
      id: `line-${++lineCounter}`,
      type: "소모품",
      name: supply.name,
      bomVersion: "—",
      moq: "—",
      quantity: 100,
      unitPrice: supply.unitPrice,
    }]);
    setItemSearch("");
  };

  const updateLine = (id: string, field: keyof OrderLine, value: number) => {
    setLines((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSave = () => {
    const poNumber = `PO${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(Math.floor(Math.random() * 999999)).padStart(6, "0")}`;
    console.log("저장:", { poNumber, vendor, orderDate, location, memo, lines, total });
    alert(`발주서 ${poNumber} 생성됨 (더미)\n합계: ₩${fmt(total)}`);
  };

  const searchResults = useMemo(() => {
    if (!itemSearch) return [];
    const q = itemSearch.toLowerCase();
    if (tab === "상품") {
      return mockProducts.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)).slice(0, 5);
    }
    return mockSupplyItems.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 5);
  }, [itemSearch, tab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="신규 발주서 작성" />
        <div className="flex gap-2">
          <Link href="/scm/purchase-orders" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">취소</Link>
          <button onClick={handleSave} disabled={!vendor || lines.length === 0} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed">저장</button>
        </div>
      </div>

      {/* 발주 기본 정보 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">거래처</label>
            <select value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900">
              <option value="">선택하세요</option>
              {mockVendors.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">발주일</label>
            <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">납품장소</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">메모</label>
            <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="선택사항" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900" />
          </div>
        </div>
      </div>

      {/* 품목 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">품목</h3>

        {/* 탭 + 검색 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex gap-1">
            {(["상품", "소모품"] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setItemSearch(""); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${tab === t ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {t === "상품" ? "완제품 (BOM)" : "소모품"}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder={tab === "상품" ? "상품 검색..." : "소모품 검색..."}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => tab === "상품" ? addProduct(item.id) : addSupply(item.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-slate-100 last:border-0"
                  >
                    <span className="font-medium text-slate-900">{item.name}</span>
                    {"code" in item && <span className="text-xs text-slate-400 ml-2">{(item as { code: string }).code}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 품목 테이블 */}
        {lines.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200">
                  <th className="text-center px-3 py-2 font-medium">#</th>
                  <th className="text-left px-3 py-2 font-medium">품목</th>
                  <th className="text-center px-3 py-2 font-medium">BOM</th>
                  <th className="text-right px-3 py-2 font-medium">수량</th>
                  <th className="text-right px-3 py-2 font-medium">단가</th>
                  <th className="text-right px-3 py-2 font-medium">합계</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={line.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium text-slate-900">{line.name}</td>
                    <td className="px-3 py-2 text-center text-xs text-slate-500">{line.bomVersion}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.id, "quantity", parseInt(e.target.value) || 0)}
                        className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-sm text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.id, "unitPrice", parseInt(e.target.value) || 0)}
                        className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-sm text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-slate-900">₩{fmt(line.quantity * line.unitPrice)}</td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => removeLine(line.id)} className="text-red-400 hover:text-red-600">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50">
                  <td colSpan={5} className="px-3 py-3 text-right text-sm font-semibold text-slate-900">합계</td>
                  <td className="px-3 py-3 text-right text-base font-bold text-blue-600">₩{fmt(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-6 text-center">위 검색에서 품목을 추가하세요</p>
        )}
      </div>
    </div>
  );
}
