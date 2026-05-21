# 한성대학교 AX 통합 사업관리 플랫폼

> 2026 AX 프런티어 챌린지 본선 데모 · 한성대학교 AX 보고혁신팀

정부 재정지원사업의 **발굴 → 계획 → 운영** 전 과정을 AI로 지원하는 대학 기획처용 통합 플랫폼입니다.

## 주요 기능

| 메뉴 | 설명 |
|---|---|
| **대시보드** | 진행 사업·신규 공고 현황, 6영역 성과 요약 |
| **모색 (Discovery)** | 정부·지자체 공고문을 AI가 분석해 한성대 지원 자격 자동 검증 |
| **계획 (Planning)** | ① 공고 기반 사업계획서 작성 보조 ② 보고서 수치 더블체크 |
| **운영 (Operations)** | 사업계획서 의무사항 체크리스트 추출 + 6영역 성과 AI 컨설팅 |

### 수치 더블체크 — 2가지 데이터 소스
- **대학정보공시**: 공공데이터포털 대학알리미 OpenAPI로 수집한 한성대 2024 공시 데이터와 대조
- **대학 자체 업로드**: 부서별 원본 엑셀(.xlsx/.csv)을 가공 없이 올리면 AI가 파일별로 자동 집계(합계·평균·건수)한 뒤 대조

## 기술 구조

- **프런트엔드**: React 18 + Vite · Tailwind CSS(CDN) · Recharts · lucide-react · SheetJS(xlsx)
- **백엔드**: Node.js + Express — 빌드된 React 앱을 서빙하고, `/api/claude`로 Anthropic API를 안전하게 중계
- **배포**: Render (Web Service)

```
브라우저 → React 앱 → /api/claude → Express 서버 → Anthropic API
                                     (ANTHROPIC_API_KEY는 서버에만 보관)
```

## 배포 방법 (Render)

### 1단계 · Anthropic API 키 발급
[console.anthropic.com](https://console.anthropic.com) 가입 → **Billing**에서 결제수단/크레딧 등록 → **API Keys → Create Key** → 키 복사 (`sk-ant-...`)

### 2단계 · GitHub에 업로드
이 폴더를 GitHub 저장소에 올립니다.
**`.env.txt`·`.env`는 올리지 마세요** (API 키 노출). `.gitignore`가 막아주지만, GitHub 웹 업로드 시에는 직접 제외해야 합니다.

### 3단계 · Render Web Service 생성
[render.com](https://render.com) → **New + → Web Service** → GitHub 저장소 연결 후:

| 항목 | 값 |
|---|---|
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Environment | `ANTHROPIC_API_KEY` = 발급받은 키 |
| Environment | `CLAUDE_MODEL` = `claude-sonnet-4-6` *(선택)* |

**Create Web Service** → 빌드 완료 후 `https://....onrender.com` 주소 생성.
저장소에 `render.yaml`이 포함되어 있어 **Blueprint** 방식으로도 배포할 수 있습니다.

### ⚠️ 무료 플랜 참고
Render 무료 Web Service는 15분간 접속이 없으면 잠자기 상태가 되며, 다음 접속 시 깨어나는 데 ~1분이 걸립니다. **발표 직전 미리 주소에 접속해 깨워두세요.**

## 로컬 개발 (선택 · Node.js 18+ 필요)

```bash
npm install
npm run build      # React 앱 빌드 → dist/
npm start          # http://localhost:3000
```

AI 기능을 로컬에서 테스트하려면 프로젝트 루트에 `.env` 파일을 만들고 `ANTHROPIC_API_KEY=...`를 넣으세요 (`.env.example` 참고).

## 데이터 출처

- **공공데이터포털(data.go.kr) — 한국대학교육협의회 대학알리미 OpenAPI**
- 대상: 한성대학교(schlId `0000200`) · 2024학년도 대학정보공시 · 6개 서비스 47개 지표
- 수집 결과: `hansung_disclosure.json`

## 파일 구성

| 파일 | 설명 |
|---|---|
| `hansung_ax_platform.jsx` | 메인 React 컴포넌트 (플랫폼 전체 UI/로직) |
| `src/main.jsx` | React 진입점 |
| `server.js` | Express 서버 (정적 서빙 + AI 중계) |
| `index.html` · `vite.config.js` · `package.json` | Vite 빌드 설정 |
| `render.yaml` | Render 배포 설정 |
| `hansung_disclosure.json` | 대학알리미 OpenAPI 수집 데이터 |
| `.env.example` | 환경변수 예시 (실제 키 파일은 저장소 미포함) |
