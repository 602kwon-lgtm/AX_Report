// 한성대 AX 플랫폼 서버
// 1) 빌드된 React 앱(dist/)을 정적 서빙
// 2) /api/claude 경로로 Anthropic API를 안전하게 중계 (API 키는 서버 환경변수에만 보관)
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '8mb' }));

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
const HAIKU_MODEL = process.env.CLAUDE_HAIKU_MODEL || 'claude-haiku-4-5-20251001';

// ── Anthropic API 호출 (자동 재시도 포함) ──
// 529(과부하)·429(속도제한)·5xx(서버오류)·네트워크 오류는 "일시적"이므로,
// 점점 더 길게 기다리며 최대 5번까지 자동으로 다시 시도한다(지수 백오프).
const RETRYABLE = new Set([429, 500, 502, 503, 504, 529]);
const RETRY_WAITS_MS = [2000, 5000, 10000, 20000, 30000];   // 재시도 사이 대기시간
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callAnthropic(apiKey, payload) {
  let lastInfo = '연결 실패';
  for (let attempt = 0; attempt <= RETRY_WAITS_MS.length; attempt++) {
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
      if (attempt < RETRY_WAITS_MS.length) {
        console.warn(`[Anthropic 재시도 ${attempt + 1}/${RETRY_WAITS_MS.length}] ${lastInfo}`);
        await sleep(RETRY_WAITS_MS[attempt]);
        continue;
      }
      return { ok: false, status: 503, data: { error: { message: lastInfo } } };
    }
    const data = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true, status: r.status, data };

    // 일시적 오류면 재시도, 그 외(400·401 등 영구 오류)는 즉시 반환한다.
    if (RETRYABLE.has(r.status) && attempt < RETRY_WAITS_MS.length) {
      const retryAfter = Number(r.headers.get('retry-after'));   // 429는 서버 권고 대기시간(초)
      const wait = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : RETRY_WAITS_MS[attempt];
      console.warn(`[Anthropic 재시도 ${attempt + 1}/${RETRY_WAITS_MS.length}] HTTP ${r.status} — ${Math.round(wait / 1000)}초 후 다시 시도`);
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
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const messages = [{ role: 'user', content: prompt || '' }];
      if (assistantSoFar) {
        messages.push({ role: 'assistant', content: assistantSoFar.replace(/\s+$/, '') });
        messages.push({
          role: 'user',
          content: '직전 응답이 출력 길이 제한으로 중간에 끊겼습니다. 새로운 인사말·설명·재시작 없이, 끊긴 바로 그 지점부터 나머지 내용을 그대로 이어서 출력하세요.',
        });
      }
      const result = await callAnthropic(apiKey, {
        model: chosenModel,
        max_tokens: PER_ROUND,
        temperature: 0,
        system: system || '',
        messages,
      });
      if (!result.ok) {
        // 자동 재시도까지 했는데도 실패. 529(과부하)·429(속도제한)는
        // 사용자가 알아볼 수 있는 안내문으로 바꿔 전달한다.
        if (result.status === 529 || result.status === 429) {
          return res.status(529).json({
            error: 'AI 서버(Anthropic)가 지금 매우 혼잡합니다. 자동으로 여러 번 다시 시도했지만 계속 실패했습니다. 5~10분 후 다시 실행해 주세요.',
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

// ── 빌드된 React 앱 정적 서빙 ──
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('한성대 AX 플랫폼 서버 실행 · 포트 ' + port + ' · 모델 ' + MODEL);
});
