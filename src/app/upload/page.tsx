"use client";

import { useState, useRef, useEffect } from "react";

interface UploadRecord {
  id: string;
  fileName: string;
  month: string;
  sheetName: string;
  rowCount: number;
  createdAt: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [history, setHistory] = useState<UploadRecord[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    const res = await fetch("/api/upload");
    const data = await res.json();
    setHistory(data);
  };

  useEffect(() => { loadHistory(); }, []);

  const handleUpload = async () => {
    if (!file || !month) { setResult({ error: "파일과 월을 모두 선택해주세요." }); return; }
    setUploading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("month", month);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: data.message });
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        loadHistory();
      } else {
        setResult({ error: data.error });
      }
    } catch {
      setResult({ error: "업로드 중 오류가 발생했습니다." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900">엑셀 업로드</h1>
        <p className="text-xs text-gray-400 mt-0.5">출고현황 파일을 업로드하여 데이터를 등록합니다</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">출고현황 파일 업로드</h2>
        <p className="text-xs text-gray-400 mb-5">
          주차별 출고현황 엑셀 파일(.xlsx)을 업로드하면 1주차~5주차 시트의 데이터를 자동 등록합니다.
        </p>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-[11px] text-gray-400 mb-1">엑셀 파일</label>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 file:cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">대상 월</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading || !file || !month}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            {uploading ? "업로드 중..." : "업로드"}
          </button>
        </div>

        {result && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${result.success ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-500 border border-red-200"}`}>
            {result.success ? result.message : result.error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">업로드 이력</h2>
        {history.length === 0 ? (
          <p className="text-gray-400 text-sm">아직 업로드 이력이 없습니다.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left py-2">파일명</th>
                <th className="text-left py-2">대상 월</th>
                <th className="text-left py-2">시트</th>
                <th className="text-right py-2">데이터 수</th>
                <th className="text-right py-2">업로드 일시</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-gray-50">
                  <td className="py-2.5 text-gray-700">{h.fileName}</td>
                  <td className="py-2.5 text-gray-500">{h.month}</td>
                  <td className="py-2.5 text-gray-500">{h.sheetName}</td>
                  <td className="text-right text-blue-600">{h.rowCount}건</td>
                  <td className="text-right text-gray-400">{new Date(h.createdAt).toLocaleString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
