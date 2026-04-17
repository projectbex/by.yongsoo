# BEX SCM BI Dashboard

> 벡스인터코퍼레이션 유통영업본부 영업 성과 관리 대시보드

**라이브 주소:** https://projectbex.github.io/by.yongsoo/

---

## 개요

ERP 익스포트 데이터를 기반으로 매출·영업이익·미수금을 실시간으로 시각화하는 B2B 유통 BI 대시보드입니다.
Google Sheets API 없이 정적 CSV를 번들링하여 GitHub Pages에서 서빙합니다.

---

## 주요 기능

### 메인 대시보드 (`/`)
- 연도 탭: **올해 누적(YTD) / 2026 / 2025 / 2024 / 2023 / 전체**
- 6개 KPI 카드: 총매출 · 목표매출 · 목표대비실적 · 동기비 · 영업이익 · 현재 미수금
- 유종별 매출 도넛 차트 (WD-40 / 케이블타이 / 방진복 / 기타)
- 일별 매출 추이 — 당기 vs 전년 동기
- 담당자별 매출 바 차트
- 거래처 순위 테이블 (전수)

### 영업이익 분석 (`/profit`)
- 유종별 · 담당자별 · 거래처별 3탭
- 매출 · 원가 · 영업이익 · 이익률 집계

### 미수현황 (`/receivables`)
- 거래처별 잔액 테이블
- 담당자별 미수 바 차트 (구매팀 제외 토글)
- 월별 미수 발생 추이

### 분석 페이지
- `/analysis/category` — 유종별 심화 분석
- `/analysis/product` — 품목별 분석
- `/analysis/region` — 지역별 분석
- `/sales-team/staff` — 담당자별 분석
- `/sales-team/customer` — 거래처별 분석

---

## 데이터 구조

```
public/data/
├── profits.csv       # 영업이익 데이터 (2023-01 ~ 2026-03, 15,332행)
├── targets.csv       # 월별 목표 (전체/담당자/유종/거래처, 4,573행)
└── receivables.csv   # 미수현황 (141행, 96거래처, 총 33.3억원)
```

### 데이터 갱신 절차

```bash
# 1. 최신 ERP xlsx를 C:/Users/BWC-MASTER/Downloads/ 에 저장
# 2. 추출
npm install --no-save xlsx
node scripts/extract-data.js

# 3. 빌드 & 배포
npx next build
git add -A
git commit -m "data: YYYY-MM ERP 데이터 갱신"
git push
```

---

## 연도별 총매출 (공급가 + 부가세 기준)

| 연도 | 총매출 |
|---|---:|
| 2023 | 23,312,859,097원 |
| 2024 | 23,610,235,118원 |
| 2025 | 23,534,430,607원 |
| 2026 (1~3월) | 5,695,161,495원 |
| **전체** | **76,152,686,317원** |

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 프레임워크 | Next.js 16.2.3 (App Router, Static Export) |
| 언어 | TypeScript (strict) |
| 스타일 | Tailwind CSS v4 |
| 차트 | Recharts |
| 배포 | GitHub Pages (`basePath: /by.yongsoo`) |
| 데이터 | ERP 정적 CSV 번들 (Google Sheets 미사용) |

---

## 로컬 개발

```bash
npm install
npm run dev
# http://localhost:3000 에서 확인
```

```bash
# 프로덕션 빌드
npx next build
```

---

## 접근 제어

`/login` 페이지에서 SHA-256 기반 토큰 검증 후 진입.
토큰은 KST 날짜 + 시크릿 키로 일별 갱신됩니다.

---

## 레포지토리

- GitHub: https://github.com/projectbex/by.yongsoo
- 라이브: https://projectbex.github.io/by.yongsoo/

---

_BEX SCM BI v3.1 · 벡스인터코퍼레이션 유통영업본부 · 2026_
