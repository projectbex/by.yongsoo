# Claude Code 사용 가능 Skills

> 현재 세션에서 Skill 도구로 호출 가능한 스킬 목록.
> 호출 예: `Skill(skill: "loop", args: "5m /foo")`

---

## 일반 / 설정

### `update-config`
Claude Code harness를 `settings.json`으로 설정.
자동화 동작 ("from now on when X", "each time X", "whenever X", "before/after X")은 hooks로 설정해야 함 — harness가 실행하는 것이지 Claude가 아님.

### `keybindings-help`
키보드 단축키 커스터마이즈, 키 재바인딩, 코드 바인딩 추가, `~/.claude/keybindings.json` 수정.
- 예: "rebind ctrl+s", "add a chord shortcut", "change the submit key", "customize keybindings"

### `simplify`
변경된 코드를 재사용성·품질·효율성 측면에서 리뷰하고 발견된 문제를 수정.

---

## 스케줄 / 반복 실행

### `loop`
프롬프트나 슬래시 커맨드를 일정 주기로 반복 실행.
- 예: `/loop 5m /foo` → 5분마다 `/foo` 실행
- interval 생략 → 모델이 self-pace
- 트리거: "check the status every X", 폴링, 반복 작업

### `schedule`
cron 스케줄로 실행되는 원격 에이전트(트리거) 생성·수정·조회·실행.
- 트리거: 정기적 원격 에이전트 스케줄, 자동화 작업, Claude Code용 cron job 만들기

---

## API / SDK

### `claude-api`
Claude API / Anthropic SDK 앱 빌드·디버깅·최적화.
- **prompt caching 포함 필수**
- 트리거: `anthropic` / `@anthropic-ai/sdk` import, Claude API · Anthropic SDK · Managed Agents (`/v...`) 사용 요청

---

## 문서 / Office (anthropic-skills 묶음)

### `anthropic-skills:docx`
Word 문서(.docx) 생성·읽기·편집·조작.
- 트리거: 'Word doc', 'word document', '.docx' 언급, 표·서식이 있는 전문 문서 생성 요청

### `anthropic-skills:pptx`
.pptx 파일 관련 모든 작업 (입력·출력 양쪽).
- 슬라이드 덱·피치 덱·프레젠테이션 생성
- .pptx 파일 읽기·파싱·텍스트 추출 (추출 결과를 다른 곳에 쓸 때도 포함)

### `anthropic-skills:pdf`
PDF 파일 관련 모든 작업.
- PDF 텍스트·표 추출
- 여러 PDF 병합·분할
- 페이지 회전·워터마크 추가
- 신규 PDF 생성

### `anthropic-skills:xlsx`
스프레드시트(.xlsx, .xlsm, .csv, .tsv) 입출력.
- 열 추가, 수식 계산, 서식, 차트
- 기존 파일 열기·읽기·편집·수정

---

## 메타 / Cowork

### `anthropic-skills:skill-creator`
새 스킬 생성, 기존 스킬 편집·최적화, evals 실행, 성능 벤치마킹·분산분석.

### `anthropic-skills:setup-cowork`
Cowork 설정 가이드 — 매칭되는 plugin 설치, 스킬 시도, 도구 연결.

### `anthropic-skills:schedule`
온디맨드 또는 일정 주기로 실행되는 scheduled task 생성.

---

## 빠른 참조

| 카테고리 | 스킬 |
|---|---|
| 설정 | `update-config`, `keybindings-help` |
| 코드 품질 | `simplify` |
| 반복/스케줄 | `loop`, `schedule`, `anthropic-skills:schedule` |
| API | `claude-api` |
| 문서 | `anthropic-skills:docx`, `anthropic-skills:pptx`, `anthropic-skills:pdf`, `anthropic-skills:xlsx` |
| 메타 | `anthropic-skills:skill-creator`, `anthropic-skills:setup-cowork` |

---

_저장일: 2026-04-14_
