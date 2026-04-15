// xlsx → public/data/*.csv 추출
// 실행: node scripts/extract-data.js
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const SRC = "C:/Users/BWC-MASTER/Downloads/BEX_dashboard_변환데이터_2023-01_to_2026-03.xlsx";
const SRC_RECEIVABLE = "C:/Users/BWC-MASTER/Downloads/BEX 유통영업본부 관리항목표 3월 (0213).xlsx";
const OUT = path.resolve(__dirname, "..", "public", "data");

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCsv(rows) {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}

function extract(sheetName, outName) {
  const wb = XLSX.readFile(SRC);
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    console.warn(`[skip] ${sheetName}: sheet not found`);
    return;
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
  const csv = toCsv(rows);
  const outPath = path.join(OUT, outName);
  fs.writeFileSync(outPath, csv, "utf8");
  console.log(`[ok] ${sheetName} → ${outPath}  (${rows.length} rows, ${(csv.length / 1024).toFixed(1)} KB)`);
}

extract("영업이익데이터", "profits.csv");
extract("목표", "targets.csv");

// ─────────────────────────────────────────
// 미수현황: 관리항목표 xlsx → receivables.csv
// ─────────────────────────────────────────
//
// 원본 시트 컬럼 (BEX 유통영업본부 관리항목표 3월):
//   0:영업소 1:담당자 2:거래처명 3:여신한도 4:수금예정일자
//   5:총미수잔액
//   6:'26년01월 7:'25년12월 8:'25년11월 9:악성미수(skip)
//   10:'25년10월 11:'25년09월 12:'25년08월 13:6개월초과(skip)
//   14~19:'25년07~02월 20:이전계
//
// 전략: 각 거래처 × 월별 cell 중 금액 > 0 인 것마다 한 행 생성.
//   → 총미수잔액은 월 셀의 합과 일치하므로 다중 행으로 쪼개도 총합 동일.
//   → occurredDate = 각 월의 1일.
//   → amount = remaining (현재 잔액 자체가 해당 월 잔여분).
//   → status = "outstanding" (수금완료분은 원본에 없음).
//
// 이전계는 정확한 월 미상이므로 2025-01-01로 매핑.
function extractReceivable() {
  const wb = XLSX.readFile(SRC_RECEIVABLE);
  const sheet = wb.Sheets["미수현황"];
  if (!sheet) {
    console.warn("[skip] 미수현황: sheet not found");
    return;
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
  // 헤더 행: rows[0], 합계 행: rows[1] (영업소 빈값), 데이터 시작: rows[2]
  const monthCols = [
    { idx: 6, period: "2026-01" },
    { idx: 7, period: "2025-12" },
    { idx: 8, period: "2025-11" },
    { idx: 10, period: "2025-10" },
    { idx: 11, period: "2025-09" },
    { idx: 12, period: "2025-08" },
    { idx: 14, period: "2025-07" },
    { idx: 15, period: "2025-06" },
    { idx: 16, period: "2025-05" },
    { idx: 17, period: "2025-04" },
    { idx: 18, period: "2025-03" },
    { idx: 19, period: "2025-02" },
    { idx: 20, period: "2025-01" }, // 이전계
  ];
  // 출력 CSV 헤더 (src/lib/sheets.ts parseReceivableSheet 순서)
  //   A:거래처코드 B:거래처명 C:담당자 D:팀 E:발생일
  //   F:미수금액   G:잔액     H:경과일 I:상태   J:비고
  const out = [[
    "거래처코드", "거래처명", "담당자", "팀", "발생일",
    "미수금액", "잔액", "경과일", "상태", "비고",
  ]];
  const today = new Date("2026-04-15"); // 스냅샷 기준일
  const parseNum = (v) => {
    const n = parseFloat(String(v || "0").replace(/[,\s]/g, ""));
    return isNaN(n) ? 0 : n;
  };
  let total = 0;
  const customerSet = new Set();
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    const team = String(r[0] || "").trim();
    const staff = String(r[1] || "").trim();
    const customer = String(r[2] || "").trim();
    if (!customer || !team) continue;
    customerSet.add(customer);
    for (const mc of monthCols) {
      const amt = parseNum(r[mc.idx]);
      if (amt <= 0) continue;
      const occurredDate = mc.period + "-01";
      const occurred = new Date(occurredDate);
      const days = Math.max(0, Math.floor((today - occurred) / 86400000));
      out.push([
        "",                  // 거래처코드 (원본 없음)
        customer,
        staff,
        team,
        occurredDate,
        String(amt),         // 미수금액 (발생액)
        String(amt),         // 잔액
        String(days),        // 경과일
        "",                  // 상태 (공란 → outstanding)
        "",                  // 비고
      ]);
      total += amt;
    }
  }
  const csv = toCsv(out);
  const outPath = path.join(OUT, "receivables.csv");
  fs.writeFileSync(outPath, csv, "utf8");
  console.log(
    `[ok] 미수현황 → ${outPath}  (${out.length - 1} rows, ` +
      `거래처 ${customerSet.size}곳, 총 ${total.toLocaleString()}원)`,
  );
}

extractReceivable();
