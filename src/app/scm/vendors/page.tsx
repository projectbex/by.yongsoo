"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui";
import ScmFilterBar from "@/components/scm/ScmFilterBar";
import ScmBadge from "@/components/scm/ScmBadge";
import { mockVendors } from "@/lib/scm-mock-data";
import type { Vendor } from "@/lib/scm-types";

export default function VendorsPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return mockVendors.filter((v) => {
      if (!showInactive && !v.active) return false;
      if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (roleFilter && !v.roles.includes(roleFilter as Vendor["roles"][number])) return false;
      return true;
    });
  }, [search, roleFilter, showInactive]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="거래처" subtitle="제조사·부자재·소모품 업체 통합 관리" />

      <ScmFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="거래처명 검색"
        filters={
          <>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700">
              <option value="">전체 역할</option>
              <option value="제조">🏭 제조</option>
              <option value="부자재">📦 부자재</option>
              <option value="소모품">📮 소모품</option>
            </select>
            <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded border-slate-300" />
              비활성 포함
            </label>
          </>
        }
        actions={
          <>
            <button onClick={() => console.log("추가")} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">+ 추가</button>
            <button onClick={() => console.log("엑셀 다운로드")} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">엑셀↓</button>
          </>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200">
              <th className="w-10 px-4 py-2.5" />
              <th className="text-left px-4 py-2.5 font-medium">거래처명</th>
              <th className="text-left px-4 py-2.5 font-medium">역할</th>
              <th className="text-left px-4 py-2.5 font-medium">사업자번호</th>
              <th className="text-left px-4 py-2.5 font-medium">담당자</th>
              <th className="text-left px-4 py-2.5 font-medium">메모</th>
              <th className="text-center px-4 py-2.5 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.flatMap((v) => {
              const isOpen = expanded.has(v.id);
              const activeContacts = v.contacts.filter((c) => c.active);
              const first = activeContacts[0];
              const rows = [
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => toggle(v.id)}>
                  <td className="px-4 py-2.5 text-slate-400">{isOpen ? "▼" : "▶"}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {v.name}
                    {v.contacts.length > 1 && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                        담당 {v.contacts.length}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 flex-wrap">
                      {v.roles.map((r) => <ScmBadge key={r} label={r} showIcon />)}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{v.bizNumber}</td>
                  <td className="px-4 py-2.5 text-slate-600">{first?.name || "—"}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs max-w-[200px] truncate">{v.memo}</td>
                  <td className="px-4 py-2.5 text-center"><ScmBadge label={v.active ? "활성" : "비활성"} /></td>
                </tr>,
              ];
              if (isOpen) {
                v.contacts.forEach((c) => {
                  rows.push(
                    <tr key={c.id} className="bg-slate-50/50 border-b border-slate-100">
                      <td />
                      <td className="px-4 py-2 pl-10 text-slate-700">
                        {c.name} <span className="text-slate-400 text-xs">({c.role})</span>
                        {!c.active && <span className="ml-1 text-[10px] text-red-400">(비활성)</span>}
                      </td>
                      <td />
                      <td />
                      <td className="px-4 py-2 text-xs text-slate-500">{c.email}</td>
                      <td className="px-4 py-2 text-xs text-slate-500">{c.phone}</td>
                      <td />
                    </tr>
                  );
                });
              }
              return rows;
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center">결과 없음</p>
        )}
      </div>
    </div>
  );
}
