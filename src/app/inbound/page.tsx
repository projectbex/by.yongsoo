"use client";

import { useState } from "react";

export default function InboundPage() {
  const [month, setMonth] = useState("");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">입고 현황</h1>
          <p className="text-xs text-gray-400 mt-0.5">입고 데이터 관리</p>
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
      </div>

      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
          <span className="text-3xl">📥</span>
        </div>
        <p className="text-gray-500 text-lg mb-2">입고 기능 준비 중</p>
        <p className="text-gray-400 text-sm">입고 데이터 업로드 및 관리 기능이 곧 추가됩니다.</p>
        <p className="text-gray-300 text-xs mt-4">입고 엑셀 파일 양식이 확정되면 업로드 기능을 연동합니다.</p>
      </div>
    </div>
  );
}
