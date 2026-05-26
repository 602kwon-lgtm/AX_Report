// 한성대 AX 플랫폼 서버
// 1) 빌드된 React 앱(dist/)을 정적 서빙
// 2) /api/claude 경로로 Anthropic API를 안전하게 중계 (API 키는 서버 환경변수에만 보관)
// 3) 공공데이터포털 「과학기술정보통신부_사업공고」를 매일 1회 자동 수집하여 announcements.json에 저장
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '8mb' }));

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
const HAIKU_MODEL = process.env.CLAUDE_HAIKU_MODEL || 'claude-haiku-4-5-20251001';

// ── Anthropic API 호출 (자동 재시도 포함) ──
// 529(과부하)·429(속도제한)·5xx(서버오류)·네트워크 오류는 "일시적"이므로,
// 점점 더 길게 기다리며 자동으로 다시 시도한다(지수 백오프).
const RETRYABLE = new Set([429, 500, 502, 503, 504, 529]);
const RETRY_WAITS_MS = [2000, 5000, 10000, 20000, 30000];   // 기본 재시도 대기시간(최대 5회)
const FAST_RETRY_MS = [2000, 5000];                          // 모델 전환 전 1차 모델용(빠르게 2회)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callAnthropic(apiKey, payload, retryWaits = RETRY_WAITS_MS) {
  let lastInfo = '연결 실패';
  for (let attempt = 0; attempt <= retryWaits.length; attempt++) {
    let r;
    try {
      r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      lastInfo = '네트워크 오류: ' + String(e);   // fetch 자체 실패 → 재시도 대상
      if (attempt < retryWaits.length) {
        console.warn(`[Anthropic 재시도 ${attempt + 1}/${retryWaits.length}] ${lastInfo}`);
        await sleep(retryWaits[attempt]);
        continue;
      }
      return { ok: false, status: 503, data: { error: { message: lastInfo } } };
    }
    const data = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true, status: r.status, data };

    // 일시적 오류면 재시도, 그 외(400·401 등 영구 오류)는 즉시 반환한다.
    if (RETRYABLE.has(r.status) && attempt < retryWaits.length) {
      const retryAfter = Number(r.headers.get('retry-after'));   // 429는 서버 권고 대기시간(초)
      const wait = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : retryWaits[attempt];
      console.warn(`[Anthropic 재시도 ${attempt + 1}/${retryWaits.length}] HTTP ${r.status} — ${Math.round(wait / 1000)}초 후 다시 시도`);
      await sleep(wait);
      lastInfo = `HTTP ${r.status}`;
      continue;
    }
    return { ok: false, status: r.status, data };
  }
  return { ok: false, status: 529, data: { error: { message: lastInfo } } };
}

// ── 관리자 비밀번호 검증 라우트 ──
app.post('/api/verify', (req, res) => {
  const ok = !!process.env.password && !!req.body && req.body.password === process.env.password;
  res.json({ ok });
});

// ── AI 중계 라우트 ──
// 브라우저는 이 서버의 /api/claude 만 호출하고, 실제 Anthropic 호출은 서버가 수행한다.
app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다. Render 대시보드 > Environment 에서 설정하세요.',
    });
  }
  // 관리자 비밀번호 확인 — API 키 무단 소모 방지
  if (!process.env.password || !req.body || req.body.password !== process.env.password) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다. 비밀번호가 올바르지 않거나 서버에 설정되지 않았습니다.' });
  }
  try {
    const { system, prompt, model } = req.body || {};
    const chosenModel = model === 'haiku' ? HAIKU_MODEL : MODEL;
    const PER_ROUND = 16000;  // 라운드당 최대 출력 토큰 (넉넉히 잡아 잘림 자체를 방지)
    const MAX_ROUNDS = 12;    // 안전 상한 (무한루프 방지)

    // 응답이 max_tokens로 잘리면, 부분응답을 assistant로 넣고 "이어쓰기"를
    // 요청하는 user 메시지로 대화를 마무리해 다음 라운드를 호출한다.
    // (일부 모델은 assistant 메시지로 끝나는 prefill을 지원하지 않으므로
    //  대화는 반드시 user 메시지로 끝나야 한다.)
    let assistantSoFar = '';
    let lastStop = '';
    let activeModel = chosenModel;   // 라운드 도중 모델이 대체되면 이후 라운드도 그 모델을 유지한다.
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const messages = [{ role: 'user', content: prompt || '' }];
      if (assistantSoFar) {
        messages.push({ role: 'assistant', content: assistantSoFar.replace(/\s+$/, '') });
        messages.push({
          role: 'user',
          content: '직전 응답이 출력 길이 제한으로 중간에 끊겼습니다. 새로운 인사말·설명·재시작 없이, 끊긴 바로 그 지점부터 나머지 내용을 그대로 이어서 출력하세요.',
        });
      }
      const payloadBase = {
        max_tokens: PER_ROUND,
        temperature: 0,
        system: system || '',
        messages,
      };
      // 1차: 요청받은 모델로 호출. 기본 모델이 아니면(예: haiku) 빠르게 몇 번만 시도한다.
      let result = await callAnthropic(
        apiKey,
        { ...payloadBase, model: activeModel },
        activeModel === MODEL ? RETRY_WAITS_MS : FAST_RETRY_MS,
      );
      // 1차 모델이 과부하(529)·속도제한(429)이면 — Anthropic 모델별 장애 대응 —
      // 정상 동작 중인 기본 모델(MODEL)로 자동 전환해 다시 시도한다.
      if (!result.ok && (result.status === 529 || result.status === 429) && activeModel !== MODEL) {
        console.warn(`[모델 대체] ${activeModel} 응답 실패(${result.status}) → ${MODEL}로 전환`);
        activeModel = MODEL;
        result = await callAnthropic(apiKey, { ...payloadBase, model: MODEL }, RETRY_WAITS_MS);
      }
      if (!result.ok) {
        // 자동 재시도·모델 전환까지 했는데도 실패. 529·429는
        // 사용자가 알아볼 수 있는 안내문으로 바꿔 전달한다.
        if (result.status === 529 || result.status === 429) {
          return res.status(529).json({
            error: 'AI 서버(Anthropic)가 지금 전체적으로 혼잡합니다. 자동 재시도와 다른 모델 전환까지 시도했지만 계속 실패했습니다. 5~10분 후 다시 실행해 주세요.',
          });
        }
        return res.status(result.status).json(result.data);
      }
      const data = result.data;
      const text = (data.content || [])
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('');
      assistantSoFar += text;
      lastStop = data.stop_reason;
      if (data.stop_reason !== 'max_tokens') break;   // 완성됨
    }
    return res.json({ content: [{ type: 'text', text: assistantSoFar }], stop_reason: lastStop });
  } catch (e) {
    return res.status(500).json({ error: 'AI 호출 실패: ' + String(e) });
  }
});

// ── 페이지 문구 저장/불러오기 라우트 ──
// 관리자가 편집한 페이지 문구를 서버 파일(texts.json)에 보관한다.
// GET 은 누구나 호출(화면 표시용), POST(저장)는 관리자 비밀번호가 필요하다.
const TEXTS_FILE = path.join(__dirname, 'texts.json');

app.get('/api/texts', (req, res) => {
  try {
    if (fs.existsSync(TEXTS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(TEXTS_FILE, 'utf-8'));
      return res.json({ texts: saved });
    }
  } catch (e) {
    console.error('texts.json 읽기 실패:', e);
  }
  return res.json({ texts: null });   // 저장된 문구 없음 → 프런트가 기본값 사용
});

app.post('/api/texts', (req, res) => {
  // 관리자 비밀번호 확인 — 무단 수정 방지
  if (!process.env.password || !req.body || req.body.password !== process.env.password) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다. 비밀번호가 올바르지 않습니다.' });
  }
  const { texts } = req.body || {};
  if (!texts || typeof texts !== 'object' || Array.isArray(texts)) {
    return res.status(400).json({ error: '저장할 문구 데이터가 올바르지 않습니다.' });
  }
  try {
    fs.writeFileSync(TEXTS_FILE, JSON.stringify(texts, null, 2), 'utf-8');
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: '문구 저장 실패: ' + String(e) });
  }
});

// ─────────────────────────────────────────────
// ── 공공데이터포털「과학기술정보통신부_사업공고」자동 수집 ──
// 매일 06:00 KST에 1회 호출 → announcements.json에 저장
// 프론트의 '모색(Discovery)' 화면이 이 파일을 읽어 공고 목록을 표시한다.
// ─────────────────────────────────────────────
const ANNOUNCEMENTS_FILE = path.join(__dirname, 'announcements.json');
const DATA_API_BASE = 'http://apis.data.go.kr/1721000/msitannouncementinfo/businessAnnouncMentList';
const DATA_API_ROWS = 100;   // 한 번에 받아올 공고 수 (최신 N건)

// 사업공고 API의 viewUrl에서 nttSeqNo를 추출해 안정적인 id로 사용한다.
function extractNttSeqNo(viewUrl) {
  if (!viewUrl) return null;
  const m = String(viewUrl).match(/nttSeqNo=(\d+)/);
  return m ? m[1] : null;
}

// API 응답의 한 항목을 프론트가 쓰는 형식으로 변환한다.
// (UI는 MOCK_ANNOUNCEMENTS의 필드를 그대로 기대하므로 같은 키 이름을 맞춰준다.)
function mapApiItem(item, index) {
  const seq = extractNttSeqNo(item.viewUrl) || `idx-${index}`;
  // files도 응답 구조가 변종이 많아 안전하게 정규화한다:
  //   배열 그대로 | {file: [...]} | {file: {...}} | 항목별 fileName/fileUrl 단일
  //   또한 각 항목이 {file: {...}}로 한번 더 감싸진 경우(공공데이터포털 특유)도 풀어준다.
  let filesRaw = Array.isArray(item.files) ? item.files
              : (item.files && item.files.file)
                  ? (Array.isArray(item.files.file) ? item.files.file : [item.files.file])
                  : (item.fileName ? [{ fileName: item.fileName, fileUrl: item.fileUrl }] : []);
  const files = filesRaw.map((f) => (f && f.file) ? f.file : f).filter(Boolean);
  const fileLines = files
    .filter((f) => f && f.fileName)
    .map((f) => `  - ${f.fileName}${f.fileUrl ? `\n    ${f.fileUrl}` : ''}`)
    .join('\n');
  const summary = [item.deptName, item.managerName].filter(Boolean).join(' · ') || '담당부서 정보 없음';
  const fullText =
`[게시물 제목] ${item.subject || '(제목 없음)'}
[게시일] ${item.pressDt || '-'}
[담당부서] ${item.deptName || '-'}
[담당자] ${item.managerName || '-'}${item.managerTel ? ` (${item.managerTel})` : ''}
[상세 페이지] ${item.viewUrl || '-'}
${fileLines ? `[첨부파일]\n${fileLines}` : '[첨부파일] 없음'}

※ 이 정보는 공공데이터포털 「과학기술정보통신부_사업공고」 API에서 자동 수집된 메타데이터입니다.
   상세 공고 본문(지원자격·예산·일정 등)은 위 상세 페이지 또는 첨부파일에서 확인해주세요.`;

  return {
    id: `msit-${seq}`,
    title: item.subject || '(제목 없음)',
    agency: '과학기술정보통신부',
    deadline: '상세 페이지 확인',
    budget: '상세 페이지 확인',
    tag: '신규',
    summary,
    fullText,
    // 추가 메타 (UI에서 부분적으로 활용)
    pressDt: item.pressDt || '',
    viewUrl: item.viewUrl || '',
    deptName: item.deptName || '',
    files,
  };
}

// 공공데이터포털 게이트웨이는 간헐적으로 502/503/504를 뱉는다 (특히 해외 클라우드에서 호출 시).
// 5xx·네트워크 오류는 일시적이라고 보고 점점 더 길게 기다리며 자동 재시도한다.
const DATA_API_RETRYABLE = new Set([429, 500, 502, 503, 504]);
const DATA_API_RETRY_WAITS_MS = [2000, 5000, 10000, 20000];

async function fetchAnnouncementsFromAPI() {
  const key = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!key) throw new Error('DATA_GO_KR_SERVICE_KEY 환경변수가 비어있습니다.');
  // 가이드 문서 b) 요청 메시지 명세 기준: 소문자 serviceKey, URL Encode 적용
  const url = `${DATA_API_BASE}?serviceKey=${encodeURIComponent(key)}&pageNo=1&numOfRows=${DATA_API_ROWS}&returnType=json`;

  let lastInfo = '연결 실패';
  let r = null;
  let text = '';
  for (let attempt = 0; attempt <= DATA_API_RETRY_WAITS_MS.length; attempt++) {
    try {
      r = await fetch(url);
      text = await r.text();
    } catch (e) {
      lastInfo = '네트워크 오류: ' + (e.message || String(e));
      if (attempt < DATA_API_RETRY_WAITS_MS.length) {
        console.warn(`[공고 동기화 재시도 ${attempt + 1}/${DATA_API_RETRY_WAITS_MS.length}] ${lastInfo}`);
        await sleep(DATA_API_RETRY_WAITS_MS[attempt]);
        continue;
      }
      throw new Error(`공공데이터포털 연결 실패 (${DATA_API_RETRY_WAITS_MS.length + 1}회 시도). ${lastInfo}`);
    }
    if (r.ok) break;
    // 일시적 오류면 재시도, 그 외(400·401 등 영구 오류)는 즉시 던진다.
    if (DATA_API_RETRYABLE.has(r.status) && attempt < DATA_API_RETRY_WAITS_MS.length) {
      lastInfo = `HTTP ${r.status} ${r.statusText}`;
      console.warn(`[공고 동기화 재시도 ${attempt + 1}/${DATA_API_RETRY_WAITS_MS.length}] ${lastInfo} — ${Math.round(DATA_API_RETRY_WAITS_MS[attempt] / 1000)}초 후 재시도`);
      await sleep(DATA_API_RETRY_WAITS_MS[attempt]);
      continue;
    }
    // 영구 오류 또는 재시도 한도 초과
    const body = (text || '').slice(0, 200);
    throw new Error(`공공데이터포털 일시 장애 — HTTP ${r.status} ${r.statusText}${body ? ` (${body})` : ''}. 잠시 후 다시 시도하거나 06시 자동 동기화를 기다려주세요.`);
  }

  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`JSON 파싱 실패. 응답 앞 300자: ${text.slice(0, 300)}`); }

  // 실제 응답 구조 (공공데이터포털 특유의 XML→JSON 변환 결과):
  //   { "response": [ {"header": {...}}, {"body": {"items": [{"item": {...}}, ...], "totalCount": N}} ] }
  // header/body가 배열 안에 들어있고, 각 item은 {item: {...}}로 한 번 더 감싸져 있다.
  // 일부 환경에서는 object 형태({response:{header,body}})로 올 수도 있어 둘 다 지원한다.
  let header = {}, body = {};
  const resp = data.response;
  if (Array.isArray(resp)) {
    for (const part of resp) {
      if (part && part.header) header = part.header;
      if (part && part.body) body = part.body;
    }
  } else if (resp && typeof resp === 'object') {
    header = resp.header || {};
    body = resp.body || {};
  }
  if (header.resultCode && header.resultCode !== '00') {
    throw new Error(`API 오류 ${header.resultCode}: ${header.resultMsg || ''}`);
  }

  // items도 다양한 형태로 올 수 있다 — 배열, 단일 객체, {item: [...]}, {item: {...}}
  let rawItems = body.items;
  if (rawItems && rawItems.item) rawItems = rawItems.item;
  if (!rawItems) rawItems = [];
  if (!Array.isArray(rawItems)) rawItems = [rawItems];

  // 각 항목이 {item: {...}}로 감싸진 경우 한 단계 벗긴다.
  const unwrapped = rawItems.map((x) => (x && x.item) ? x.item : x);

  const mapped = unwrapped.map((it, i) => mapApiItem(it, i));
  return {
    items: mapped,
    totalCount: Number(body.totalCount) || mapped.length,
    fetchedAt: new Date().toISOString(),
  };
}

function readAnnouncementsFile() {
  try {
    if (fs.existsSync(ANNOUNCEMENTS_FILE)) {
      return JSON.parse(fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('announcements.json 읽기 실패:', e);
  }
  return null;
}

function writeAnnouncementsFile(data) {
  try {
    fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('announcements.json 쓰기 실패:', e);
    return false;
  }
}

let lastSyncError = null;
async function runSync(label = 'manual') {
  try {
    const result = await fetchAnnouncementsFromAPI();
    writeAnnouncementsFile({
      lastSyncedAt: result.fetchedAt,
      source: 'data.go.kr · msitannouncementinfo',
      totalCount: result.totalCount,
      count: result.items.length,
      items: result.items,
    });
    lastSyncError = null;
    console.log(`[공고 동기화 · ${label}] ${result.items.length}건 저장 (전체 ${result.totalCount}건 중 최신)`);
    return { ok: true, count: result.items.length, totalCount: result.totalCount };
  } catch (e) {
    lastSyncError = { message: String(e.message || e), at: new Date().toISOString() };
    console.error(`[공고 동기화 실패 · ${label}]`, e.message || e);
    return { ok: false, error: lastSyncError.message };
  }
}

// ── 공개 라우트: 저장된 공고 목록 조회 ──
app.get('/api/announcements', (req, res) => {
  const data = readAnnouncementsFile();
  if (!data) {
    return res.json({
      items: [],
      lastSyncedAt: null,
      lastSyncError,
      message: '아직 수집된 공고가 없습니다. 잠시 후 다시 확인해주세요.',
    });
  }
  return res.json({
    items: data.items || [],
    lastSyncedAt: data.lastSyncedAt || null,
    totalCount: data.totalCount || (data.items || []).length,
    source: data.source || null,
    lastSyncError,
  });
});

// ── 관리자 라우트: 즉시 동기화 (cron을 기다리지 않고 수동 실행) ──
app.post('/api/announcements/sync', async (req, res) => {
  if (!process.env.password || !req.body || req.body.password !== process.env.password) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다. 비밀번호가 올바르지 않습니다.' });
  }
  const result = await runSync('manual-admin');
  if (!result.ok) return res.status(502).json({ error: result.error });
  return res.json(result);
});

// 매일 06:00 KST 자동 동기화
cron.schedule('0 6 * * *', () => { runSync('cron-daily-06KST'); }, { timezone: 'Asia/Seoul' });

// 서버 부팅 시: announcements.json이 없으면 즉시 1회 수집 (실패해도 서버 가동에는 영향 없음)
// 키가 비어있으면 시도조차 하지 않고 안내 로그만 남긴다.
if (!process.env.DATA_GO_KR_SERVICE_KEY) {
  console.warn('[공고 자동수집] DATA_GO_KR_SERVICE_KEY 미설정 — 수집을 건너뜁니다. .env에 키를 설정하세요.');
} else if (!fs.existsSync(ANNOUNCEMENTS_FILE)) {
  runSync('boot-initial');
}

// ── 빌드된 React 앱 정적 서빙 ──
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('한성대 AX 플랫폼 서버 실행 · 포트 ' + port + ' · 모델 ' + MODEL);
});
