# BEX SCM 대시보드

벡스인터코퍼레이션 유통영업본부 BI 대시보드

> 실시간 매출/출고/영업 데이터 시각화 · KPI 시뮬레이터 · SCM 운영 관리
>
> 신용수 (마케팅팀장) · 2026-04

---

## 📑 목차

1. [프로젝트 개요](#-프로젝트-개요)
2. [핵심 기능](#-핵심-기능)
3. [기술 스택](#-기술-스택)
4. [디자인 시스템](#-디자인-시스템)
5. [페이지 구조 (IA)](#-페이지-구조-ia)
6. [KPI 시뮬레이터](#-kpi-시뮬레이터)
7. [SCM 운영](#-scm-운영)
8. [데이터 파이프라인](#-데이터-파이프라인)
9. [컴포넌트 구조](#-컴포넌트-구조)
10. [배포 워크플로우](#-배포-워크플로우)
11. [보안 / 접근 제어](#-보안--접근-제어)
12. [개발 환경 셋업 가이드](#-개발-환경-셋업-가이드)
13. [일일 작업 흐름](#-일일-작업-흐름)
14. [문제 해결 FAQ](#-문제-해결-faq)
15. [설계 결정 / 변경 이력](#-설계-결정--변경-이력)

---

## 📌 프로젝트 개요

| 항목 | 내용 |
|---|---|
| **제품명** | BEX SCM (Supply Chain Management) |
| **대상 조직** | 벡스인터코퍼레이션 유통영업본부 |
| **담당** | 신용수 (마케팅팀장) |
| **배포 URL** | https://boxerdydtn7.github.io/bex-scm/ |
| **데이터 소스** | Google Sheets (실시간 연동) |
| **접근 방식** | 비밀번호 보호 (`yongsoo2026!`) |
| **시작일** | 2026-04-10 (초기 셋업) |
| **v2.0 리디자인** | 2026-04-14 (BI 다크 리디자인) |

---

## 🎯 핵심 기능

- 📊 **실시간 데이터 연동** — Google Sheets 업데이트 시 자동 반영
- 🔐 **비밀번호 보호** — 사내 임직원 전용
- 📱 **모바일 반응형** — 데스크톱 사이드바 + 모바일 하단 탭
- 🎨 **SaaS급 UI** — 상용 BI 수준의 디자인 시스템
- 🔍 **전역 필터** — 팀/담당자/유종/품목/거래처 검색 (모든 페이지 공통)
- ⭐ **KPI 시뮬레이터** — 범우연합 KPI 산식 기반 점수 산출 + 인터랙티브 시뮬레이션
- 🏷️ **SCM 운영** — 상품마스터·거래처·BOM·소모품·발주 관리 (더미 데이터 UI)
- 🚀 **무료 호스팅** — GitHub Pages + GitHub Actions 자동 배포

---

## 🏗️ 기술 스택

| 계층 | 기술 |
|---|---|
| Framework | Next.js 16.2.3 (App Router, Turbopack, Static Export) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts (Bar, Line, Area, Pie) |
| State | React Context (DataProvider) |
| Data | Google Sheets gviz/tq CSV API |
| Deploy | GitHub Pages + GitHub Actions |
| AI 도구 | Claude Code |

---

## 🎨 디자인 시스템

### 컬러 팔레트

| 용도 | 색상 |
|---|---|
| Sidebar | `#0B0F14` |
| Background | `#111827` |
| Card | `#1F2937` |
| Primary | `#3B82F6` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |
| Text (main) | `#E5E7EB` |
| Text (muted) | `#9CA3AF` |

### 레이아웃 구조

```
┌──────────┬────────────────────────────────────────┐
│          │  Topbar (전역 필터)                     │
│ Sidebar  ├────────────────────────────────────────┤
│ 220px    │                                        │
│          │  Main Content                          │
│          │  (InsightBanner / KPI / Charts)        │
│          │                                        │
└──────────┴────────────────────────────────────────┘
        모바일: 하단 탭 바 (개요/분석/영업/출고)
```

---

## 📂 페이지 구조 (IA)

```
/                           전체 개요 (대시보드 홈)
├─ /analysis
│   ├─ /category            유종별 분석
│   ├─ /product             품목별 분석 (정렬 가능 테이블)
│   └─ /region              팀별 분석
├─ /sales-team
│   ├─ /staff               팀별 성과
│   └─ /customer            거래처 분석 (검색)
├─ /profit                  영업이익 분석
├─ /receivables             미수 관리
├─ /shipment                출고 현황 (거래 내역)
├─ /kpi
│   ├─ /                    KPI 종합 (범우연합 산식 점수)
│   └─ /simulator           산식 시뮬레이터
├─ /scm
│   ├─ /products            상품마스터
│   ├─ /vendors             거래처 관리
│   ├─ /boms                BOM 관리
│   ├─ /supply-items        소모품
│   └─ /purchase-orders
│       ├─ /                발주 목록
│       ├─ /[id]            발주 상세 (SSG)
│       └─ /new             신규 발주서 작성
└─ /login                   로그인 (비밀번호)
```

### 메뉴 구성

| 섹션 | 메뉴 | 아이콘 |
|---|---|---|
| 대시보드 | 전체 개요 | 📊 |
| 매출 분석 | 유종별 / 품목별 / 팀별 | 📈 |
| 영업 분석 | 팀별 성과 / 거래처 분석 | 👤 |
| 수익성 | 영업이익 분석 | 💰 |
| 재무 | 미수 관리 | ⚠️ |
| 출고/물류 | 출고 현황 | 📦 |
| KPI 시뮬레이터 | KPI 종합 / 산식 시뮬레이터 | ⭐ |
| SCM 운영 | 상품마스터 / 거래처 / BOM 관리 / 소모품 / 발주 관리 | 🏷️ |

---

## ⭐ KPI 시뮬레이터

범우연합 KPI 산식을 기반으로 실시간 점수를 산출하고, 인터랙티브 시뮬레이션을 제공합니다.

### KPI 산식 (범우연합 기준)

```
총점 = 매출성장점수(50%) + 영업이익점수(50%)

매출성장점수 = DRUM성장률 × DRUM비중 + EA성장률 × EA비중
  - DRUM/EA 분류: 상품명에 "드럼/DRUM/DRM/DR" 포함 여부
  - 비중 = 해당 유형 매출 / 전체 매출
  - 성장률 = (당기 수량 / 전기 수량) × 100

영업이익점수 = (실적 / 계획) × 100
```

### 검증 기준값 (2025 데이터)

| 항목 | 값 |
|---|---|
| DRUM 전기/당기 | 2,945 / 3,095 |
| EA 전기/당기 | 5,995,813 / 5,741,006 |
| DRUM 매출 | 1,779,178,400원 |
| EA 매출 | 21,769,535,619원 |
| 영업이익 계획/실적 | 2,651,297,264 / 4,404,050,777원 |
| **산출 점수** | **131.3점 (S등급)** |

### 등급 기준

| 등급 | 점수 |
|---|---|
| S | 110점 초과 |
| A | 100~110점 |
| B | 90~100점 |
| C | 80~90점 |
| D | 80점 미만 |

### 페이지 구성

- `/kpi` — KPI 종합: 현재 데이터 기반 점수 카드 + DRUM/EA 상세 분석표 + 등급 기준표 + 월별 추이 차트
- `/kpi/simulator` — 산식 시뮬레이터: 좌측 입력 패널(수량/매출/이익) + 우측 결과 패널, "현재 BEX 값 불러오기" / "예시값 채우기" / "초기화" 버튼

---

## 🏷️ SCM 운영

상품·거래처·BOM·소모품·발주 관리를 위한 UI 스켈레톤입니다. 현재는 더미 데이터로 동작하며, 향후 실데이터 연동 예정입니다.

### 더미 데이터 구성

| 데이터 | 건수 | 주요 항목 |
|---|---|---|
| 상품 (Product) | 5건 | WD-40 100ml/191ml, 케이블타이, 방진복, 베지아쿠아 |
| 거래처 (Vendor) | 4건 | WD-40 Korea, 툴스피아, 반월공장, ㈜대영포장 |
| BOM | 3건 | WD-40 100ml/191ml, 케이블타이 (MOQ별 가격표) |
| 소모품 (SupplyItem) | 5건 | 택배박스 소/중/대, 에어캡, OPP테이프 |
| 발주서 (PurchaseOrder) | 3건 | 각 라인아이템 + 입고 기록 포함 |

### 페이지 구성

| 경로 | 화면 | 주요 기능 |
|---|---|---|
| `/scm/products` | 상품마스터 | 분할뷰 (좌: 목록 테이블, 우: 4탭 상세 패널) |
| `/scm/vendors` | 거래처 | 확장형 행 (담당자 목록), 역할 뱃지 |
| `/scm/boms` | BOM 관리 | 상품별 카드 + BOM 버전 + MOQ 가격표 |
| `/scm/supply-items` | 소모품 | 필터링 테이블, 활성/비활성 토글 |
| `/scm/purchase-orders` | 발주 목록 | PO별 라인아이템 플랫 테이블, 상태/거래처 필터 |
| `/scm/purchase-orders/[id]` | 발주 상세 | 발주/거래처 정보 카드 + 확장형 품목 (입고 기록) |
| `/scm/purchase-orders/new` | 신규 발주 | 거래처/날짜/장소 입력 + 완제품/소모품 검색 추가 |

### 공통 컴포넌트

- `ScmFilterBar` — 검색 + 필터 슬롯 + 액션 버튼 조합형 필터바
- `ScmBadge` — 상태별 색상 뱃지 (진행/종결/취소/활성/비활성 등)

---

## 📊 데이터 파이프라인

### 1. 원본 데이터
- **Google Sheets** (Sheet ID: `17sG8OuMbf_wqnoqekVcdKO8B8o1u5Rn6Kuyhv_LmlME`)
  - `매출데이터` 시트 — 거래 내역 (원본)
  - `거래처정보` 시트 — 거래처 메타 (팀/담당/지역/등급)

### 2. 필터링 로직 (`parseSalesSheet`)
```ts
r.staff                         // 담당자 존재
&& r.customer                   // 거래처 존재
&& r.saleType.includes("매출")   // 매출구분 "매출"만 (견본 제외)
```

### 3. 검증된 지표 (2026-03 기준)

| 지표 | 값 |
|---|---|
| 총 매출금액 | **2,045,991,150원** (≈ 20.5억) |
| 총 판매수량 | **483,339개** |
| 거래처 수 | **90곳** (DISTINCT) |
| 거래 건수 | **714건** |

---

## 🧩 컴포넌트 구조

```
src/
├── app/
│   ├── layout.tsx              # 루트 + viewport
│   ├── globals.css             # 테마
│   ├── page.tsx                # / (전체 개요)
│   ├── login/page.tsx
│   ├── analysis/{category,product,region}/page.tsx
│   ├── sales-team/{staff,customer}/page.tsx
│   ├── profit/page.tsx
│   ├── receivables/page.tsx
│   ├── shipment/page.tsx
│   ├── kpi/
│   │   ├── page.tsx            # KPI 종합 (점수카드 + 차트)
│   │   └── simulator/page.tsx  # 산식 시뮬레이터
│   └── scm/
│       ├── products/page.tsx   # 상품마스터 (분할뷰)
│       ├── vendors/page.tsx    # 거래처 (확장형 행)
│       ├── boms/page.tsx       # BOM 관리 (카드 + MOQ)
│       ├── supply-items/page.tsx # 소모품
│       └── purchase-orders/
│           ├── page.tsx        # 발주 목록
│           ├── new/page.tsx    # 신규 발주서
│           └── [id]/
│               ├── page.tsx              # 서버 컴포넌트 (generateStaticParams)
│               └── PurchaseOrderDetail.tsx # 클라이언트 상세 컴포넌트
│
├── components/
│   ├── LayoutShell.tsx         # AuthGate + DataProvider + 레이아웃
│   ├── Sidebar.tsx             # 데스크톱 사이드바 + 모바일 하단탭
│   ├── Topbar.tsx              # 전역 필터 (팀/담당/유종/검색)
│   ├── KpiCard.tsx             # KPI 카드 (label/value/delta)
│   ├── InsightBanner.tsx       # 상단 인사이트 배너
│   ├── ui.tsx                  # PageHeader, ChartCard, LoadingState, ErrorState
│   └── scm/
│       ├── ScmFilterBar.tsx    # SCM 공통 필터바
│       └── ScmBadge.tsx        # 상태 뱃지 (색상 매핑)
│
└── lib/
    ├── sheets.ts               # Google Sheets fetch + parse
    ├── dataContext.tsx          # DataProvider (단일 데이터 소스)
    ├── format.ts               # fmt, fmtKrw, fmtPct, deltaColor
    ├── kpi.ts                  # KPI 산식 (범우연합 BwKpi + 등급)
    ├── scm-types.ts            # SCM 타입 정의
    └── scm-mock-data.ts        # SCM 더미 데이터
```

### 단일 데이터 소스 (DataProvider)
- 페이지 로드 시 Sheets 2개 병렬 fetch (1회)
- 전역 필터 적용한 `filtered` 배열을 모든 페이지에서 `useData()`로 공유
- 필터 변경 시 리렌더만, 재호출 없음

---

## 🚀 배포 워크플로우

1. **코드 푸시** → GitHub main 브랜치
2. **GitHub Actions** 자동 실행 (`next build` → static export)
3. **GitHub Pages** 배포 → `https://boxerdydtn7.github.io/bex-scm/`
4. **데이터 갱신** → Google Sheets 수정만으로 즉시 반영 (빌드 불필요)

---

## 🔐 보안 / 접근 제어

- `localStorage` 기반 클라이언트 인증 (`bex-auth` 키)
- `AuthGate` 컴포넌트가 `/login` 외 모든 페이지 진입 차단
- 비밀번호: `yongsoo2026!`
- Google Sheets는 "링크가 있는 모든 사용자 — 뷰어" 공유
- 데이터는 저장소에 포함 없음 (URL만 코드에 상수)

---

## 🛠️ 개발 환경 셋업 가이드

> 윈도우 환경에서 처음 개발 시작할 때 참고 (2026-04-10 기준)
>
> ℹ️ **중요**: 초기 가이드는 Supabase + Prisma 스택이었으나, 이후 Google Sheets + GitHub Pages로 피벗했습니다. 현재는 **Supabase/Prisma 불필요** — [설계 결정](#-설계-결정--변경-이력) 참고.

### 0. 사전 준비: GitHub 계정

1. https://github.com 접속 → **Sign up**
2. 이메일, 비밀번호, 사용자명 입력
3. 사용자명은 영문으로 간단하게 (예: `yongsoo-shin`, `bex-yongsoo`)

### 1. Node.js 설치 (v20 LTS)

1. https://nodejs.org → **LTS** 다운로드
2. 모든 옵션 기본값으로 설치
3. 확인:
   ```powershell
   node -v
   npm -v
   ```

### 2. Git 설치

1. https://git-scm.com/download/win → 64-bit 설치
2. 기본 에디터: `Use Visual Studio Code as Git's default editor`
3. 나머지 기본값
4. 사용자 정보:
   ```powershell
   git config --global user.name "신용수"
   git config --global user.email "본인이메일주소"
   ```

### 3. VS Code 설치 + 확장

1. https://code.visualstudio.com
2. 필수 확장:

| 확장 이름 | 검색어 | 용도 |
|---|---|---|
| ESLint | `eslint` | 코드 품질 검사 |
| Tailwind CSS IntelliSense | `tailwindcss` | CSS 자동완성 |

### 4. Claude Code 설치

1. PowerShell을 **관리자 권한**으로 실행
2. ```powershell
   npm install -g @anthropic-ai/claude-code
   ```
3. 확인: `claude --version`

### 5. 프로젝트 클론 & 의존성 설치

```powershell
cd C:\Users\본인유저명\Documents
git clone https://github.com/boxerdydtn7/bex-scm.git
cd bex-scm
npm install
```

### 6. 로컬 실행

```powershell
npm run dev
```

→ 브라우저에서 http://localhost:3000/bex-scm/ 접속

> ℹ️ `basePath: /bex-scm` 설정 때문에 URL 끝에 `/bex-scm/`이 필요합니다.

### 7. Claude Code로 개발

```powershell
cd C:\Users\본인유저명\Documents\bex-scm
claude
```

대화형으로 요청:
```
"담당자별 성과 페이지에 월별 추이 차트 추가해줘"
```

---

## 🔁 일일 작업 흐름

### 작업 시작 전
```powershell
git checkout main
git pull origin main
```

### 새 기능 작업
```powershell
git checkout -b feature/기능명
# 예시: git checkout -b feature/staff-monthly-trend
```

### 작업 후 커밋 & 푸시
```powershell
git add .
git commit -m "담당자별 월별 추이 차트 추가"
git push origin feature/기능명
```

### 배포 반영
- `main` 브랜치에 머지 → GitHub Actions 자동 빌드/배포
- 약 1~2분 후 https://boxerdydtn7.github.io/bex-scm/ 반영

---

## 🧯 문제 해결 FAQ

| 증상 | 해결 |
|---|---|
| `node`가 인식 안 됨 | PowerShell 재시작, 안 되면 Node.js 재설치 |
| `npm install` 에러 | `npm cache clean --force` 후 재시도 |
| `localhost:3000` 안 뜸 | 터미널 에러 메시지 확인, 포트 충돌 시 `netstat -ano \| findstr :3000` |
| 로컬에서 404 | URL 끝에 `/bex-scm/` 붙이기 (basePath) |
| `claude` 명령어 안 됨 | `npm install -g @anthropic-ai/claude-code` 재실행 |
| 데이터 안 보임 | Google Sheets 공유 설정 확인 (링크 있는 모든 사용자 → 뷰어) |
| `git push` 에러 | GitHub 로그인 상태 확인, PAT 재발급 |
| Sheets 값이 콤마로 들어옴 | `parseSalesSheet`에서 `replace(/,/g, "")` 적용됨 — 신규 컬럼 추가 시 동일 처리 |
| 빌드 시 stale 캐시 에러 | `rm -rf .next` 후 `npx next build` |

---

## ✅ 검증 완료 체크리스트

- [x] `next build` 성공 (24개 static route, SSG 3개 포함)
- [x] 프리뷰 렌더 확인: 총매출 20.5억 / 수량 483,339개 / 거래처 90곳 / 714건
- [x] 콘솔 에러 0건
- [x] 전역 필터 연동 (팀/담당/유종/품목/거래처)
- [x] 모바일 반응형 (768px 분기)
- [x] 비밀번호 인증 (AuthGate)
- [x] KPI 종합: 131.3점(S등급) 산출 정확성 검증
- [x] KPI 시뮬레이터: 입력값 변경 → 실시간 점수 반영
- [x] SCM 5개 화면 렌더링 정상 (상품/거래처/BOM/소모품/발주)
- [x] 발주 상세 동적 라우트 SSG 생성 (po1, po2, po3)

---

## 📝 설계 결정 / 변경 이력

### 왜 Google Sheets? (Supabase/Prisma → Sheets 피벗)
- 초기 계획: Supabase + Prisma + PostgreSQL (전통적 DB 스택)
- 피벗 이유:
  - 데이터 입력 주체가 **비개발자(영업팀)** → 스프레드시트가 가장 익숙
  - DB 인프라 운영 부담 제거 (무료 플랜 한계, 백업 등)
  - 기존 엑셀 업무 워크플로우와 자연스럽게 통합
  - Sheets 수정 → 대시보드 즉시 반영 (빌드 불필요)

### 왜 GitHub Pages? (Vercel → GitHub Pages 피벗)
- 초기: Vercel 시도 → 한국어 컴퓨터 이름으로 HTTP 헤더 오류
- 전환 이유:
  - 완전 무료 + 안정적
  - Public repo + Private 데이터 분리 (데이터는 Sheets에)
  - 사용자 고정 URL (`*.github.io/bex-scm`)

### 왜 Context + 단일 소스?
- 7개 페이지가 같은 원본 데이터 사용
- 페이지 전환마다 fetch 재호출 방지
- 전역 필터를 모든 페이지에서 일관되게 적용

### 왜 다크 테마 BI 리디자인 (v2.0)?
- v1.x 라이트 테마는 아마추어 대시보드 느낌
- 상용 SaaS BI (Metabase, Redash, Superset) 수준의 전문성 요구
- 영업 현장에서 장시간 응시 → 다크 테마가 눈 피로 적음

---

## 📅 버전 히스토리

| 버전 | 날짜 | 내용 |
|---|---|---|
| v0.1 | 2026-04-10 | 셋업 가이드 작성, Next.js 프로젝트 초기화 (Supabase 계획) |
| v1.0 | 2026-04-11 | Google Sheets 연동, 라이트 테마 단일 페이지 |
| v1.5 | 2026-04-12 | 모바일 반응형, 매출 필터 로직 확정 |
| v2.0 | 2026-04-14 | SaaS급 BI 다크 리디자인, 페이지 IA 재구성, DataContext 도입 |
| v2.5 | 2026-05 | 수익성·미수 관리 페이지 추가, 라이트 테마 전환 |
| **v3.0** | **2026-05-13** | **KPI 시뮬레이터 (범우연합 산식) + SCM 운영 모듈 (5개 화면) 추가** |

---

_벡스인터코퍼레이션 내부용 · Last updated 2026-05-13_
