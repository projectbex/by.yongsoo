// xlsx → public/data/*.csv 추출
// 실행: node scripts/extract-data.js
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const SRC = "C:/Users/BWC-MASTER/Downloads/BEX_dashboard_변환데이터_2023-01_to_2026-03.xlsx";
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
extract("미수현황", "receivables.csv");
