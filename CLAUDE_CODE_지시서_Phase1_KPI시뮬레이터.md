# BEX KPI Dashboard Enterprise Specification — Phase 1

> **작업 의뢰자**: 신용수 (마케팅팀장)
> **작업 도구**: Claude Code
> **대상 프로젝트**: bex-scm (BEX SCM BI v3.1)
> **작업일**: 2026-05-13
> **문서 버전**: v2.0 (v1 구현 상세 + v2 엔터프라이즈 규격 통합)
> **목적**: 9월 KPI 재정의 회의 대비 — BEX 대시보드에 범우연합 KPI 시뮬레이터 모듈 추가
> **우선순위**: 데이터 무결성 > 계산 재현성 > 디자인 완성도 > 기능 추가

---

## 1. 프로젝트 목표

본 프로젝트는 단순 KPI 화면 제작이 아니다.
BEX 실적 데이터를 기반으로 실시간 KPI 계산, 경영 성과 분석, KPI 시뮬레이션, 임원 보고용 시각화, 평가 산식 검증을 수행하는 **경영 데이터 대시보드 시스템** 구축이 목적이다.

**Phase 1 목표**: 기존 BEX 대시보드에 KPI 종합 페이지 및 산식 시뮬레이터 페이지를 추가하여, 현행 범우연합 KPI 산식을 BEX 실시간 데이터로 자동 계산한다.

### 배경

벡스인터코퍼레이션이 속한 범우연합은 매년 KPI 평가를 진행하고 있으나, 평가 결과를 사전에 확인할 수 있는 시스템이 없음. 평가 산식이 엑셀로만 관리되어 다음 문제 존재:

1. 평가 시점(11월말)까지 본인 점수를 예측할 수 없음
2. 산식 개선안(Track A/B 2트랙 체계)을 시뮬레이션할 도구가 없음
3. 사업 본질이 다른 BEX(소비재/브랜드)는 현행 산식상 불리한 평가

### 품질 기준 (우선순위 순)

1. 데이터 정확성
2. 계산 재현성
3. 검증 가능성
4. UI 신뢰감
5. 반응 속도
6. 기능 확장성

모든 구현은 **"이 숫자를 임원 앞에서 설명할 수 있는가?"** 기준으로 판단한다.

---

## 2. 핵심 원칙

### 2-1. 숫자는 절대 추정하지 않는다

다음 상황에서는 KPI 계산을 중단한다:
- 컬럼 누락 / 월 데이터 누락
- 잘못된 숫자 포맷 / 음수 실적 오류
- 중복 데이터 / 제품 분류 실패 / 목표값 누락

오류 발생 시:
- fallback 계산 금지
- 임의 보정 금지
- 추정값 표시 금지
- 대시보드에 명확한 오류 상태 표시

### 2-2. UI보다 데이터 검증이 우선

차트가 예쁘더라도 계산이 틀리면 실패로 간주한다.
모든 KPI는 원본 데이터 → 계산 로직 → 계산 결과를 역추적 가능해야 한다.

### 2-3. 기존 페이지 보호

기존 페이지 절대 수정 최소화. 신규 KPI 기능은 독립 모듈 구조로 추가한다.

---

## 3. 현재 시스템 (변경 없음)

```
프로젝트: bex-scm
라이브: https://projectbex.github.io/by.yongsoo/
기술: Next.js 16.2.3 (App Router, Static Export) + TypeScript + Tailwind v4 + Recharts
데이터: public/data/{profits.csv, targets.csv, receivables.csv}
배포: GitHub Pages + GitHub Actions
basePath: /by.yongsoo
```

**기존 페이지 (수정 안 함)**:
- `/` (전체 개요), `/profit`, `/receivables`
- `/analysis/{category,product,region}`
- `/sales-team/{staff,customer}`
- `/shipment`, `/login`

---

## 4. 시스템 아키텍처

```text
Raw Excel / CSV
     ↓
Validation Layer      ← 데이터 무결성 검증
     ↓
Normalization Layer   ← 포맷 정규화
     ↓
Product Master Mapping ← 품목 분류
     ↓
Aggregation Layer     ← 집계
     ↓
KPI Engine            ← 산식 계산
     ↓
Presentation Layer    ← UI 표시
     ↓
Dashboard UI
```

---

## 5. 데이터 구조 규격 (Data Contract)

### 5-1. Profit Data Schema

```ts
export interface ProfitRow {
  date: string;        // YYYY-MM-DD 형식 강제
  year: number;
  month: number;
  productCode: string;
  productName: string;
  unitType: "DRUM" | "EA";
  quantity: number;    // >= 0
  revenue: number;     // >= 0
  operatingProfit: number; // >= 0
  customerCode?: string;
  customerName?: string;
}
```

### 5-2. 필수 규칙

**숫자 타입**: 모든 계산 필드는 number 타입만 허용. `null`, `undefined`, `NaN`, 문자열 숫자, 빈 문자열 금지.

**금액 규칙**: `revenue >= 0`, `operatingProfit >= 0`, `quantity >= 0`. 음수 발견 시 Validation Error.

**날짜 규칙**: `YYYY-MM-DD` 형식 강제.

---

## 6. Product Master

### 절대 품목명 문자열로 분류하지 않는다

다음 방식 금지:
```ts
// 금지
if (name.includes("DR"))
```

반드시 Product Master 사용:

```ts
export interface ProductMaster {
  productCode: string;
  productName: string;
  unitType: "DRUM" | "EA";
  category?: string;
  brand?: string;
  active: boolean;
}
```

### 매핑 실패 처리

productCode 매핑 실패 시:
- KPI 계산 중단
- 관리자 경고 표시
- fallback 금지

### 현실 대응 (profits.csv에 Product Master 없는 경우)

만약 profits.csv에 단위(DRUM/EA) 구분 컬럼이 없고 Product Master 파일도 없으면, 품목명 기반으로 분류 로직을 **임시** 적용하되 경고 표시:
- 품목명에 "드럼", "DR", "DRM" 포함 → DRUM
- 그 외 → EA (BEX는 EA 비중 99.95%)
- UI에 "Product Master 미적용 — 품목명 기반 임시 분류" 경고 표시

---

## 7. Validation Layer

### 필수 검증 항목

| 검증 | 처리 |
|---|---|
| 중복 row | 차단 |
| 누락 월 | 차단 |
| unitType 없음 | 차단 |
| 매출 음수 | 차단 |
| 목표값 없음 | 차단 |
| NaN | 차단 |
| 문자열 숫자 | 자동 변환 후 검증 |

### Validation Result

```ts
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

---

## 8. KPI Engine 설계

### 디렉토리 구조

```text
src/lib/kpi-engine/
├ validator.ts     ← 데이터 검증
├ normalizer.ts    ← 포맷 정규화
├ calculator.ts    ← 핵심 산식
├ formatter.ts     ← 표시 포맷
├ grade.ts         ← 등급 판정
├ anomaly.ts       ← 이상치 탐지
└ index.ts         ← 통합 export
```

### 계산 로직은 UI와 완전 분리

```tsx
// 금지 — UI에서 직접 계산
const score = revenue / target

// 허용 — 엔진 결과만 표시
const result = calculateKPI(data)
```

### 핵심 인터페이스

```ts
export interface KpiInput {
  drumPrevious: number;
  drumCurrent: number;
  eaPrevious: number;
  eaCurrent: number;
  drumRevenue: number;
  eaRevenue: number;
  profitPlan: number;
  profitActual: number;
}

export interface KpiResult {
  drumGrowth: number;
  eaGrowth: number;
  drumWeight: number;
  eaWeight: number;
  salesScore: number;
  profitAchievement: number;
  profitScore: number;
  totalScore: number;
  grade: "S" | "A" | "B" | "C" | "D";
}

export function calculateBexKPI(input: KpiInput): KpiResult { /* ... */ }
export function getGrade(score: number): KpiResult["grade"] { /* ... */ }
export function calculateBexKPIFromData(salesData, targetsData): KpiResult { /* ... */ }
```

---

## 9. KPI Formula Specification

### 9-1. 성장률

```ts
drumGrowth = drumCurrent / drumPrevious
eaGrowth = eaCurrent / eaPrevious
```

### 9-2. 금액 비중

```ts
totalRevenue = drumRevenue + eaRevenue
if (totalRevenue <= 0) throw Error()  // Divide by Zero 차단
drumWeight = drumRevenue / totalRevenue
eaWeight = eaRevenue / totalRevenue
```

### 9-3. 금액비중 반영 결과

```ts
drumWeighted = drumGrowth * drumWeight
eaWeighted = eaGrowth * eaWeight
totalWeighted = drumWeighted + eaWeighted
```

### 9-4. 판매수량 성장률 점수 (KPI 비중 50%)

```ts
salesScore = totalWeighted * 50  // 총점 100점 체계, 판매 파트 최대 기본점수 50점
```

### 9-5. 영업이익 달성률 점수 (KPI 비중 50%)

```ts
profitAchievement = profitActual / profitPlan
profitScore = profitAchievement * 50
```

### 9-6. 종합 점수

```ts
totalScore = salesScore + profitScore
```

### 9-7. 반올림 규칙

모든 KPI 계산: `round(value, 2)` — 소수점 둘째자리 고정.

### 9-8. Divide by Zero 처리

0으로 나누는 경우: 계산 중단, 오류 표시, Infinity 금지.

### 9-9. 등급 체계

| Grade | Score |
|---|---|
| S | > 110 |
| A | 100 ~ 110 |
| B | 90 ~ 100 |
| C | 80 ~ 90 |
| D | <= 80 |

### 9-10. 검증 데이터 (2025년 BEX 실적)

반드시 `131.28 ± 0.05` 범위 내 계산되어야 함. 오차 발생 시 rounding → aggregation → weighting 순서로 점검.

| 항목 | 값 |
|---|---|
| DRUM 전년 수량 | 2,945 |
| DRUM 당해 수량 | 3,095 |
| DRUM 성장률 | 1.0509 (5.09%) |
| EA 전년 수량 | 5,995,813 |
| EA 당해 수량 | 5,741,006 |
| EA 성장률 | 0.9575 (-4.25%) |
| DRUM 매출 | 1,779,178,400원 |
| EA 매출 | 21,769,535,619원 |
| 총 매출 | 23,548,714,019원 |
| DRUM 금액비중 | 7.56% |
| EA 금액비중 | 92.44% |
| 단위 합산 결과 | 0.9646 |
| 판매수량 성장률 점수 | 48.23점 |
| 영업이익 계획 | 2,651,297,264원 |
| 영업이익 실적 | 4,404,050,777원 |
| 영업이익 달성률 | 166.11% |
| 영업이익 점수 | 83.05점 |
| **종합 점수** | **131.28점** |
| **등급** | **S** |

---

## 10. 이상치 탐지 (Anomaly Detection)

### 자동 감지 규칙

| 조건 | 상태 |
|---|---|
| 전월 대비 +200% 이상 | Warning |
| 전월 대비 -50% 이하 | Warning |
| 영업이익 목표 미달 | Warning |
| 누락 월 발생 | Critical |
| unitType 불일치 | Critical |

---

## 11. Phase 1 추가 사항

### A. 사이드바 메뉴 신설

기존 메뉴 구조 유지하고, 마지막에 새 섹션 추가:

```
대시보드
├ 전체 개요
매출 분석
├ 유종별 / 품목별 / 지역별
영업 분석
├ 담당자별 / 거래처별
출고/물류
├ 출고 현황
⭐ KPI 시뮬레이터  ← 신규 섹션
├ 📐 KPI 종합 (/kpi)
└ 🧮 산식 시뮬레이터 (/kpi/simulator)
```

`src/components/Sidebar.tsx` 수정 — 기존 메뉴 구조 유지하면서 KPI 섹션 추가.

---

### B. `/kpi` — KPI 종합 페이지

#### B-1. 페이지 레이아웃

```
┌─────────────────────────────────────────────────────┐
│ 📐 KPI 종합 — 2026년 누적 기준                       │
│ 범우연합 현행 산식 기반 BEX 실시간 평가                │
├─────────────────────────────────────────────────────┤
│ ┌─ 종합 점수 카드 ──────────────────────────────────┐│
│ │  예상 점수: 131.3점   등급: S   (실시간 계산)      ││
│ │  ↑ 작년 동기 대비 +X.X점                           ││
│ └────────────────────────────────────────────────────┘│
│                                                       │
│ ┌─ KPI 구성 ─────────────┬─ 등급 기준 ──────────────┐│
│ │ 판매수량 성장률         │  S: 110점 초과            ││
│ │  - DRUM: ___ 점         │  A: 100~110              ││
│ │  - EA:   ___ 점         │  B: 90~100               ││
│ │  - 합계: ___ 점 (50%)   │  C: 80~90                ││
│ │                         │  D: 80점 이하             ││
│ │ 영업이익 달성률          │                          ││
│ │  - 계획: ___원          │                          ││
│ │  - 실적: ___원          │                          ││
│ │  - 달성률: ___% (50%)   │                          ││
│ └─────────────────────────┴───────────────────────────┘│
│                                                       │
│ ┌─ 월별 점수 추이 (차트) ──────────────────────────┐  │
│ │  Line chart — 1월~당월 누적 점수 변화             │  │
│ └──────────────────────────────────────────────────┘  │
│                                                       │
│ ┌─ 위험 요인 ───────────────────────────────────────┐│
│ │ ⚠ 이번 달 EA 출고량 전년比 -X% 하락                ││
│ │ ✓ 영업이익 계획 대비 +X% 초과 달성                  ││
│ └────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

#### B-2. 핵심 구성 요소

1. **Hero KPI Section** — 종합 점수 + 등급 + 전년 대비 증감
2. **KPI Breakdown** — 판매수량/영업이익 상세 내역
3. **Monthly Trend** — 월별 누적 점수 추이 차트
4. **Risk Alert** — 이상치 자동 감지 경고
5. **Operating Profit Status** — 영업이익 달성 현황
6. **Executive Summary** — 한줄 요약

한 화면에서 현재 상태, 위험 요소, 성장 추세, KPI 등급을 즉시 판단 가능해야 함.

#### B-3. 표시 데이터

**상단 종합 카드** (`KpiCard` 컴포넌트 활용):
- 예상 점수: `calculateBexKPI()` 결과
- 등급: 점수 → S/A/B/C/D 변환
- 작년 동기 대비 증감

**KPI 구성 박스** (좌측):

| 항목 | 표시 |
|---|---|
| DRUM 판매수량 (당해/전년) | 실제 수치 |
| EA 판매수량 (당해/전년) | 실제 수치 |
| DRUM 성장률, EA 성장률 | % |
| 단위별 금액비중 (DRUM/EA) | % |
| 판매수량 성장률 점수 (50% 가중) | 점수 |
| 영업이익 계획 vs 실적 | 원 |
| 영업이익 달성률 점수 (50% 가중) | 점수 |
| **종합 점수** | 강조 표시 |

**등급 기준 박스** (우측): 정적 표 표시

**월별 점수 추이 차트**: Recharts LineChart, 1월~당월 누적 점수

**위험 요인 박스**: 자동 감지 로직 (Section 10 참조)
- EA/DRUM 성장률 음수 → ⚠ 경고
- 영업이익 달성률 100% 미만 → ⚠ 경고
- 위 둘 다 양호 → ✓ 메시지

#### B-4. 데이터 소스

기존 `public/data/profits.csv`, `targets.csv` 활용:
- DRUM/EA 수량 → profits.csv의 수량 컬럼 (단위 구분)
- 영업이익 실적 → profits.csv의 영업이익 합계
- 영업이익 계획 → targets.csv의 영업이익 목표

---

### C. `/kpi/simulator` — 산식 시뮬레이터 페이지

#### C-1. 목적

단순 계산기가 아니다. **경영 시나리오 테스트 도구**.

#### C-2. 페이지 레이아웃

```
┌─────────────────────────────────────────────────────┐
│ 🧮 KPI 산식 시뮬레이터                                 │
│ 입력값을 변경해 점수 변화를 시뮬레이션                  │
├─────────────────────────────────────────────────────┤
│ ┌─ 입력 ─────────────────┬─ 결과 ───────────────────┐│
│ │                         │                          ││
│ │ ━ 판매수량 ━            │  종합 점수: ___ 점        ││
│ │ DRUM 전년: [ ___ ]      │  등급: ___                ││
│ │ DRUM 당해: [ ___ ]      │                          ││
│ │ EA 전년:   [ ___ ]      │  ━ 산출 과정 ━           ││
│ │ EA 당해:   [ ___ ]      │                          ││
│ │                         │  DRUM 성장률: ___%        ││
│ │ ━ 매출 금액 ━           │  EA 성장률: ___%          ││
│ │ DRUM 매출: [ ___ ]      │  단위별 금액비중:         ││
│ │ EA 매출:   [ ___ ]      │   DRUM ___% / EA ___%    ││
│ │                         │  판매수량 성장률 점수:    ││
│ │ ━ 영업이익 ━            │   ___ 점 (50% 가중)       ││
│ │ 계획: [ ___ ]           │                          ││
│ │ 실적: [ ___ ]           │  영업이익 달성률: ___%    ││
│ │                         │  영업이익 점수: ___ 점    ││
│ │ [현재 BEX 값 불러오기]  │   (50% 가중)              ││
│ │ [예시값 채우기]          │                          ││
│ │ [초기화]                 │  ━ 종합 ━                ││
│ │                         │  총점: ___                ││
│ │                         │  등급: ___                ││
│ └─────────────────────────┴───────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

#### C-3. 핵심 기능

- 입력 즉시 계산 (좌측 입력 필드 변경 → 우측 결과 실시간 재계산)
- "현재 BEX 값 불러오기" 버튼 → 실데이터로 입력값 자동 채움
- "예시값 채우기" → 2025년 BEX 실적 (DRUM 3,095 / EA 5,741,006 등)
- "초기화" → 모든 입력값 0으로
- 산출 과정 전체 표시 (역추적 가능)
- 결과 재현 가능

#### C-4. 절대 금지

입력값 변경 시 다음 발생 금지:
- 값 튐 / NaN 표시
- 차트 깨짐 / layout shift

---

## 12. 디자인 시스템

### 디자인 방향

"스타트업 느낌" 금지. 목표: SAP / Tableau / Power BI Executive Dashboard 수준의 안정감.

**대상 사용자**: 임원, 팀장, 영업 관리자, KPI 평가 담당자.
따라서 즉시 이해 가능, 숫자 신뢰감, 정보 밀도, 안정감 있는 UI가 핵심.

### 컬러 시스템

| Role | Color |
|---|---|
| Background | #111827 |
| Card | #1F2937 |
| Primary | #3B82F6 |
| Success | #10B981 |
| Warning | #F59E0B |
| Danger | #EF4444 |
| Text Primary | #F9FAFB |
| Text Secondary | #9CA3AF |

### Typography

임원이 멀리서 봐도 숫자가 바로 읽혀야 함.

- 폰트: Pretendard / Inter (혼합 가능)
- 숫자: `font-weight: 700` 이상, `font-variant-numeric: tabular-nums`, letter-spacing 최소화
- 핵심 KPI 숫자: `56px ~ 72px`
- 서브 설명: `14px ~ 16px`

### 카드 스타일

```
radius: 20~24px
shadow: soft
border: subtle
```

과도한 글로우 효과 금지.

### 컴포넌트 재사용

`KpiCard`, `ChartCard`, `PageHeader` 등 기존 컴포넌트 재사용.

---

## 13. 차트 전략

차트는 장식이 아니라 **의사결정 도구**.

### 허용 차트

| 차트 | 목적 |
|---|---|
| Line Chart | 추세 |
| Bar Chart | 비교 |
| Stacked Bar | 구성비 |
| Area Chart | 누적 흐름 |

Pie chart 최소화.

### 차트 규칙

- Grid 최소화
- 라벨 과밀 금지
- 애니메이션 과도 금지
- KPI 색상 체계 유지

---

## 14. 성능 전략

임원 보고 환경에서 즉시 로딩, 끊김 없는 인터랙션, 안정적인 렌더링 보장.

- 불필요한 re-render 금지
- memoization 적용
- chart data pre-processing
- heavy calculation `useMemo` 처리

---

## 15. 빌드 검증

### 필수 검증

```bash
npm run lint   # 에러 0
npm run build  # 에러 0
```

### KPI 검증값

반드시 `131.28 ± 0.05` 범위 내 계산. 오차 발생 시 rounding → aggregation → weighting 순서로 점검.

---

## 16. Phase 1 완료 체크리스트

- [ ] `/kpi` 페이지 정상 렌더링 (콘솔 에러 0)
- [ ] `/kpi/simulator` 페이지 정상 렌더링
- [ ] 사이드바에 "KPI 시뮬레이터" 섹션 표시
- [ ] 모바일 하단탭에 KPI 메뉴 표시 (필요 시)
- [ ] `/kpi`에서 BEX 실데이터로 131.28 ± 0.05 범위 내 계산
- [ ] `/kpi/simulator`에서 입력값 변경 시 실시간 재계산
- [ ] "예시값 채우기" 버튼으로 검증값 자동 입력
- [ ] Validation Layer 동작 — 오류 데이터 시 명확한 에러 표시
- [ ] 다크 테마 일관성 유지
- [ ] `npx next build` 성공
- [ ] 기존 페이지(/, /profit 등) 영향 없음 확인

---

## 17. Phase 1에서 하지 말 것 (Phase 2 이후 작업)

1. 신 KPI 산식 (Track A 환율 보정 / Track B 다이소식) — Phase 2
2. 신상품 18종 트래커 — Phase 2
3. VTPL SCM 데이터 연동 (협력사 등급제) — Phase 3
4. 외부 변수 입력 폼 (환율/품질/PR ROI) — Phase 4
5. 다른 법인(BWI/BW/KCC 등) 데이터 — 별도 데이터 소스 확보 후
6. 모바일 전용 별도 화면 — 반응형으로 충분
7. 예측 모델 / AI Forecast / 시나리오 추천 — Phase 4

---

## 18. Phase 로드맵

| Phase | 내용 |
|---|---|
| **Phase 1** (현재) | KPI 종합, KPI Simulator, KPI Engine, Validation Layer |
| Phase 2 | 신 KPI 체계, Track A/B, 환율 보정, 신상품 KPI |
| Phase 3 | 협력사 연동, SCM 연계, 법인 비교 |
| Phase 4 | 예측 모델, AI Forecast, 시나리오 추천 |

---

## 19. 작업 결과 보고 양식

작업 완료 후 다음 정보를 신용수 팀장에게 보고:

1. 추가/수정된 파일 목록
2. 추가된 패키지 (있다면)
3. 빌드 결과 (성공/실패, 정적 라우트 수)
4. 로컬 테스트 결과 — 검증값(131.28점)이 정확히 나오는지
5. Validation Layer 동작 확인 결과
6. 알려진 이슈/제한사항
7. Phase 2 시작 전 필요한 추가 데이터/결정사항

---

## 20. 참고 정보 (작업 시 참고용)

### 범우연합 2025년 KPI 평가 결과
- 범우연합 종합: 110.4점 / S등급
- BEX 유통영업본부: 131.3점 / S등급 (이번 검증 대상)
- 평가기간: 2024.12 ~ 2025.11

### 등급 기준
- S: 110점 초과
- A: 100점 초과 ~ 110점 이하
- B: 90점 초과 ~ 100점 이하
- C: 80점 초과 ~ 90점 이하
- D: 80점 이하

---

_본 문서는 Claude Code 작업 지시서이며, 작업 완료 후 BEX 대시보드 PROJECT.md에 KPI 섹션을 추가하여 영구 문서화한다._
