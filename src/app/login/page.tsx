"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SITE_PASSWORD = "yongsoo2026!";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password === SITE_PASSWORD) {
      localStorage.setItem("bex-auth", "authenticated");
      router.push("/");
    } else {
      setError("비밀번호가 올바르지 않습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center p-4">
      <div className="bg-[#1F2937] rounded-2xl p-8 w-full max-w-md border border-white/5">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">B</span>
          </div>
          <h1 className="text-xl font-bold text-white">BEX SCM</h1>
          <p className="text-gray-500 text-xs mt-1">유통영업본부 BI 대시보드</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 bg-[#111827] border border-white/10 text-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {loading ? "확인 중..." : "로그인"}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-600 mt-6">
          벡스인터코퍼레이션 내부용
        </p>
      </div>
    </div>
  );
}
