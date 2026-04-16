"use client";

import { useState } from "react";

const SITE_PASSWORD = "yongsoo2026!";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password === SITE_PASSWORD) {
      localStorage.setItem("bex-auth", "authenticated");
      // 정적 export 환경에서 router.push 는 RSC payload fetch 가 불안정하므로
      // 풀 리로드로 홈 이동. 현재 URL 의 'login/' 부분을 잘라 basePath 자동 보존.
      const home = window.location.pathname.replace(/login\/?$/, "") || "/";
      window.location.assign(home);
    } else {
      setError("비밀번호가 올바르지 않습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md border border-slate-200 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">B</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">BEX SCM</h1>
          <p className="text-slate-500 text-xs mt-1">유통영업본부 BI 대시보드</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-600 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {loading ? "확인 중..." : "로그인"}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          벡스인터코퍼레이션 내부용
        </p>
      </div>
    </div>
  );
}
