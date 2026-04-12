"use client";

import { useEffect, useState, useCallback } from "react";

interface Product {
  id: string;
  code: string | null;
  name: string;
  category: string | null;
  volume: string | null;
  unit: string | null;
  price: number | null;
  isActive: boolean;
}

const inputClass = "border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-blue-500 placeholder:text-gray-300";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", name: "", category: "", volume: "", unit: "EA", price: "" });

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products);
    setTotal(data.total);
  }, [page, search]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleSubmit = async () => {
    if (!form.name) return alert("상품명을 입력해주세요.");
    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setShowForm(false);
      setEditingId(null);
      setForm({ code: "", name: "", category: "", volume: "", unit: "EA", price: "" });
      loadProducts();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ code: p.code || "", name: p.name, category: p.category || "", volume: p.volume || "", unit: p.unit || "EA", price: p.price ? String(p.price) : "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 상품을 비활성화 하시겠습니까?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadProducts();
  };

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">상품관리</h1>
          <p className="text-xs text-gray-400 mt-0.5">총 <span className="text-blue-600">{total}</span>개 상품</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm({ code: "", name: "", category: "", volume: "", unit: "EA", price: "" }); setShowForm(true); }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
        >
          + 신규 상품 등록
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="상품명, 품목코드, 분류로 검색..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className={inputClass + " !w-80"}
        />
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">{editingId ? "상품 수정" : "신규 상품 등록"}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-[11px] text-gray-400 mb-1">품목코드</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} placeholder="400019" /></div>
            <div><label className="block text-[11px] text-gray-400 mb-1">상품명 *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="WD-40 360ML" /></div>
            <div><label className="block text-[11px] text-gray-400 mb-1">분류</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} placeholder="WD-40" /></div>
            <div><label className="block text-[11px] text-gray-400 mb-1">용량</label><input value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} className={inputClass} placeholder="360ml" /></div>
            <div><label className="block text-[11px] text-gray-400 mb-1">포장단위</label><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[11px] text-gray-400 mb-1">단가</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} placeholder="3450" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">{editingId ? "수정" : "등록"}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm hover:bg-gray-200">취소</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100 bg-gray-50">
              <th className="text-left py-3 px-4">품목코드</th>
              <th className="text-left py-3 px-4">상품명</th>
              <th className="text-left py-3 px-4">분류</th>
              <th className="text-left py-3 px-4">용량</th>
              <th className="text-left py-3 px-4">단위</th>
              <th className="text-right py-3 px-4">단가</th>
              <th className="text-center py-3 px-4">상태</th>
              <th className="text-center py-3 px-4">관리</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5 px-4 text-gray-400">{p.code || "-"}</td>
                <td className="py-2.5 px-4 text-gray-900 font-medium">{p.name}</td>
                <td className="py-2.5 px-4 text-gray-500">{p.category || "-"}</td>
                <td className="py-2.5 px-4 text-gray-500">{p.volume || "-"}</td>
                <td className="py-2.5 px-4 text-gray-500">{p.unit || "-"}</td>
                <td className="py-2.5 px-4 text-right text-green-600">{p.price ? new Intl.NumberFormat("ko-KR").format(p.price) + "원" : "-"}</td>
                <td className="py-2.5 px-4 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${p.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                    {p.isActive ? "활성" : "비활성"}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-center">
                  <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700 mr-3 text-[11px]">수정</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600 text-[11px]">삭제</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">상품이 없습니다</td></tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded text-xs ${p === page ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
