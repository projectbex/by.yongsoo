# 벡스인터코퍼레이션 SCM 대시보드 — 윈도우 개발 환경 셋업 가이드

> 신용수 | 2026-04-10

---

## 0. 사전 준비: GitHub 계정 만들기

1. https://github.com 접속
2. **Sign up** 클릭 → 이메일, 비밀번호, 사용자명 입력하여 가입
3. 이메일 인증 완료

> 사용자명은 영문으로 간단하게 (예: `yongsoo-shin`, `bex-yongsoo` 등)

---

## 1. Node.js 설치 (v20 LTS)

1. https://nodejs.org 접속
2. **LTS** 버전 클릭하여 다운로드
3. 설치 파일 실행 → 모든 옵션 기본값으로 **다음 > 다음 > 설치**
4. 설치 확인: PowerShell 열고 아래 입력

```
node -v
npm -v
```

둘 다 버전 번호가 나오면 성공.

---

## 2. Git 설치

1. https://git-scm.com/download/win 접속
2. **64-bit Git for Windows Setup** 다운로드
3. 설치 시 옵션:
   - **기본 에디터**: `Use Visual Studio Code as Git's default editor` 선택
   - 나머지는 전부 기본값으로 진행
4. 설치 확인:

```
git --version
```

5. Git 사용자 정보 설정:

```
git config --global user.name "신용수"
git config --global user.email "본인이메일주소"
```

> 회사 이메일 도메인이 있으면 그걸 쓰고, 없으면 GitHub 가입 시 사용한 이메일을 쓰면 됩니다.

---

## 3. VS Code 설치

1. https://code.visualstudio.com 접속 → 다운로드 후 설치
2. 설치 후 확장(Extensions) 설치 (좌측 사이드바 블록 아이콘 클릭):

| 확장 이름 | 검색어 | 용도 |
|-----------|--------|------|
| ESLint | `eslint` | 코드 품질 검사 |
| Tailwind CSS IntelliSense | `tailwindcss` | CSS 자동완성 |
| Prisma | `prisma` | DB 스키마 하이라이팅 |

---

## 4. Claude Code 설치 (AI 코딩 도구)

> 클로드 유료 구독이 되어 있으므로 Claude Code를 활용하여 프로젝트를 만들 수 있습니다.

1. PowerShell을 **관리자 권한**으로 실행
2. 아래 명령어 입력:

```
npm install -g @anthropic-ai/claude-code
```

3. 설치 확인:

```
claude --version
```

버전 번호가 나오면 성공.

---

## 5. 새 프로젝트 생성

### 5-1. GitHub 저장소 만들기

1. https://github.com 로그인
2. 우측 상단 **+** → **New repository** 클릭
3. 설정:
   - **Repository name**: `bex-scm` (원하는 이름으로 변경 가능)
   - **Description**: `벡스인터코퍼레이션 SCM 대시보드`
   - **Private** 선택 (회사 프로젝트이므로 비공개)
   - ✅ **Add a README file** 체크
   - **.gitignore**: `Node` 선택
4. **Create repository** 클릭

### 5-2. 프로젝트 클론

PowerShell에서:

```bash
cd C:\Users\본인유저명\Documents
git clone https://github.com/본인깃허브사용자명/bex-scm.git
cd bex-scm
```

> GitHub 로그인 팝업이 뜨면 본인 GitHub 계정으로 로그인

### 5-3. Next.js 프로젝트 초기화

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

> 이미 폴더가 있다는 경고가 나오면 **Yes** 선택

---

## 6. Supabase 설정 (데이터베이스)

1. https://supabase.com 접속 → **Start your project** → GitHub 계정으로 로그인
2. **New project** 클릭
3. 설정:
   - **Name**: `bex-scm`
   - **Database Password**: 안전한 비밀번호 입력 (꼭 메모해두기!)
   - **Region**: `Northeast Asia (Seoul)` 선택
4. 프로젝트 생성 완료 후 **Settings** → **API** 에서 아래 값 복사:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` 키 → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role` 키 → SUPABASE_SERVICE_ROLE_KEY
5. **Settings** → **Database** 에서:
   - `Connection string` (URI) → DATABASE_URL / DIRECT_URL

---

## 7. 환경변수 파일 생성

프로젝트 폴더(bex-scm/) 안에 `.env` 파일을 새로 만듭니다.

**방법:** VS Code에서 프로젝트 폴더 열기 → 루트에 `.env` 파일 생성 → 아래 내용 붙여넣기

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=위에서_복사한_Project_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=위에서_복사한_anon_key
SUPABASE_SERVICE_ROLE_KEY=위에서_복사한_service_role_key

# Prisma (Supabase PostgreSQL)
DATABASE_URL=위에서_복사한_Connection_String
DIRECT_URL=위에서_복사한_Connection_String
```

> ⚠️ `.env` 파일은 절대 GitHub에 올리면 안 됩니다!
>
> `.gitignore` 파일을 열어서 `.env`가 포함되어 있는지 확인하세요. 없으면 맨 아래에 `.env` 한 줄 추가.

---

## 8. Prisma 설정 (DB 연결)

```bash
npm install prisma @prisma/client
npm install @supabase/supabase-js
npx prisma init
```

`prisma/schema.prisma` 파일이 생성됩니다. 이후 Claude Code를 활용하여 SCM에 필요한 테이블(상품, 재고, 발주 등)을 설계할 수 있습니다.

---

## 9. 실행 확인

```bash
npm run dev
```

브라우저에서 **http://localhost:3000** 접속 → 사이트가 뜨면 성공!

---

## 10. Claude Code로 SCM 대시보드 만들기

프로젝트 폴더에서 Claude Code를 실행합니다:

```bash
cd C:\Users\본인유저명\Documents\bex-scm
claude
```

Claude Code가 실행되면, 아래처럼 대화하듯이 요청하세요:

```
"SCM 상품관리 대시보드를 만들어줘.
- 상품 목록 조회/등록/수정/삭제
- Supabase 연동
- 사이드바 네비게이션
- Tailwind CSS 사용"
```

Claude Code가 파일을 자동으로 생성하고 수정해줍니다.

---

## 11. 작업 흐름 (매일 반복)

### 작업 시작 전

```bash
git checkout main
git pull origin main
```

### 새 기능 작업

```bash
git checkout -b feature/기능명
```

예시: `git checkout -b feature/scm-product-list`

### 작업 후 커밋 & 푸시

```bash
git add .
git commit -m "SCM 상품 목록 페이지 구현"
git push origin feature/기능명
```

---

## 문제 발생 시

| 증상 | 해결 |
|------|------|
| `node`가 인식 안 됨 | PowerShell 재시작, 안 되면 Node.js 재설치 |
| `npm install` 에러 | `npm cache clean --force` 후 재시도 |
| localhost:3000 안 뜸 | `.env` 파일 확인, 터미널 에러 메시지 캡처해서 공유 |
| `claude` 명령어 안 됨 | `npm install -g @anthropic-ai/claude-code` 재실행 |
| Supabase 연결 에러 | `.env`의 URL/키 값이 정확한지 확인 |
| git push 에러 | GitHub 로그인 상태 확인 |

---

## 프로젝트 구조 (완성 후 예상)

```
bex-scm/
├── src/
│   ├── app/           ← 페이지들 (Next.js App Router)
│   ├── components/    ← UI 컴포넌트
│   └── lib/           ← Supabase/Prisma 연결
├── prisma/
│   └── schema.prisma  ← DB 스키마
├── public/            ← 이미지 등 정적 파일
├── .env               ← 환경변수 (비공개)
└── package.json       ← 의존성 목록
```
