# 실데이터 시트 준비 체크리스트

> Google Sheets 실데이터를 연결하기 위한 3개 시트 스키마.
> 시트 ID: `17sG8OuMbf_wqnoqekVcdKO8B8o1u5Rn6Kuyhv_LmlME`
> 준비가 끝나면 `src/lib/dataContext.tsx` 상단의 `USE_MOCK_*` 플래그를 `false`로 변경.

---

## 1. `영업이익데이터` 시트

**목적**: 매출 + 원가를 한 시트에 담아 영업이익·이익률·동기비·목표대비 실적을 계산.
**플래그**: `USE_MOCK_PROFIT` (현재 `true`)
**파서**: `parseProfitSheet()` in `src/lib/sheets.ts`

### 컬럼 순서

| 열 | 필드 | 예시 |
|---|---|---|
| A | 거래일자 | `2026-03-05` 또는 `20260305` |
| B | 담당자 | `강병국` |
| C | 거래처코드 | `C001` |
| D | 거래처명 | `㈜한국공구` |
| E | 매출구분 | `매출` (필수: "매출" 포함 문자열만 집계) |
| F | 품목코드 | `P-WD40-360` |
| G | 품목명 | `WD-40 360ML` |
| H | 수량 | `10` |
| I | 단가 | `15,000` |
| J | 공급가 | `150,000` |
| K | 부가세 | `15,000` |
| L | **원가** | `82,500` |

### ⚠️ 매칭 규칙

매출데이터 시트와 **`거래일자 + 거래처명 + 품목명`** 이 **정확히 일치**해야 매칭됨.
(공백·괄호·약어 주의 — 예: `㈜한국공구` ≠ `(주)한국공구`)

---

## 2. `미수현황` 시트

**목적**: 현재 남은 미수 잔액 관리. 월별 누적은 발생월 기준, KPI는 현재 잔액 기준.
**플래그**: `USE_MOCK_RECEIVABLE` (현재 `true`)
**파서**: `parseReceivableSheet()` in `src/lib/sheets.ts`

### 컬럼 순서

| 열 | 필드 | 예시 |
|---|---|---|
| A | 거래처코드 | `C001` |
| B | 거래처명 | `㈜한국공구` |
| C | 담당자 | `강병국` |
| D | 팀 | `유통1팀` |
| E | 발생일 | `2025-10-15` |
| F | 미수금액 | `3,500,000` (최초 발생액) |
| G | **잔액** | `1,500,000` (현재 남은 금액) |
| H | 경과일 | `182` |
| I | 상태 | `수금완료` 또는 공란 |
| J | 비고 | `할인 협의중` |

### 자동 처리 규칙

- **상태 = `수금완료`** 또는 **잔액 ≤ 0** → 자동 `paid` 처리 (KPI에서 제외)
- **팀 = `구매팀`** → 미수 관리 페이지 "담당자별" 차트에서 자동 제외 (토글로 on/off)

---

## 3. `목표` 시트

**목적**: 기간별 목표매출 · 목표영업이익. 없는 행은 "목표 없음"으로 안전하게 표시.
**플래그**: `USE_MOCK_TARGET` (현재 `true`)
**파서**: `parseTargetSheet()` in `src/lib/sheets.ts`

### 컬럼 순서

| 열 | 필드 | 예시 |
|---|---|---|
| A | 년월 | `2026-03` (YYYY-MM) |
| B | 구분 | `전체` / `담당자` / `유종` / `거래처` |
| C | 키 | 구분에 따라 다름 (아래 표) |
| D | 목표매출 | `280,000,000` |
| E | 목표영업이익 | `70,000,000` |

### 구분별 키 값

| 구분 | 키 예시 |
|---|---|
| `전체` | `-` (하이픈 고정) |
| `담당자` | `강병국`, `김세하`, `이구` … |
| `유종` | `WD-40`, `케이블타이`, `방진복`, `기타` (4개 고정) |
| `거래처` | `㈜한국공구`, `대성산업` … |

### Fallback

일부 구분/기간만 있어도 됨. 목표가 없는 항목은 UI에서 "목표 없음" 또는 `—` 로 표시되며 KPI는 깨지지 않음.

---

## 실데이터 전환 절차

1. 위 3개 시트를 동일 스프레드시트 (`17sG8OuMbf_wqnoqekVcdKO8B8o1u5Rn6Kuyhv_LmlME`)에 추가
2. 시트명이 다를 경우 `src/lib/dataContext.tsx` 상단 상수 수정:
   ```ts
   const SHEET_NAME_PROFIT = "영업이익데이터";
   const SHEET_NAME_RECEIVABLE = "미수현황";
   const SHEET_NAME_TARGET = "목표";
   ```
3. 컬럼 순서가 다를 경우 `src/lib/sheets.ts`의 `parseProfitSheet` / `parseReceivableSheet` / `parseTargetSheet`의 인덱스(`r[0]`, `r[1]` 등)만 수정
4. 플래그 3개를 `false`로:
   ```ts
   const USE_MOCK_PROFIT = false;
   const USE_MOCK_RECEIVABLE = false;
   const USE_MOCK_TARGET = false;
   ```
5. `npx next build` → `git push` → 끝

---

## 대분류 (유종) 자동 분류 규칙

`src/lib/category.ts` — 품목명 기준:

| 품목명에 포함 | 대분류 |
|---|---|
| `WD` (대소문자 무관) | `WD-40` |
| `케이블타이` | `케이블타이` |
| `방진복` | `방진복` |
| 그 외 | `기타` |

목표 시트 `유종` 키 값도 위 4개와 **정확히 일치**해야 목표대비 실적 계산됨.

---

---

## v3.1 전환 (실데이터 정적 번들)

2026-04-15 이후 구조 변경:
- 3개 데이터 소스(`영업이익 / 미수 / 목표`)를 Google Sheets가 아닌 **`public/data/*.csv`** 로 번들
- ERP 익스포트 xlsx → `scripts/extract-data.js` 로 CSV 추출 → 빌드에 포함 → GitHub Pages에서 정적 서빙
- `src/lib/sheets.ts` 의 `fetchLocalCsv()` 가 basePath(`/bex-scm`) 고려해서 fetch
- `USE_MOCK_*` = `false` → 로컬 CSV 사용, `true` → mockData 사용

데이터 갱신 절차:
1. 최신 ERP xlsx를 `C:/Users/BWC-MASTER/Downloads/` 에 저장
2. `scripts/extract-data.js` 의 `SRC` 경로 확인 후:
   ```bash
   npm install --no-save xlsx
   node scripts/extract-data.js
   ```
3. `public/data/profits.csv`, `targets.csv`, `receivables.csv` 갱신됨
4. `npx next build` → `git commit` → `git push`

## 데이터 특성 (2026-04 기준)

- **영업이익데이터** 15,332 행 (2023-01 ~ 2026-03, 월별 집계)
  - 거래일자: 각 월의 1일로 통일
  - 담당자: 개인명이 아닌 **팀명** (영업지원팀 / 유통1~3팀 …)
  - 원가: `실적금액 − 실적영업이익` 로 역산
- **목표** 4,573 행 (전체/담당자/유종/거래처 4종 × 39개월)
- **미수현황** 0 행 (빈 시트, 페이지는 "데이터 없음"으로 안전 표시)

---

_저장일: 2026-04-15 · v3.1 BEX SCM BI_
