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
    const PER_ROUND = 8192;   // 라운드당 최대 출력 토큰
    const MAX_ROUNDS = 12;    // 안전 상한 (무한루프 방지)

    // 에이전트 방식: 응답이 max_tokens로 잘리면, 부분응답을 assistant로 넣어
    // 끊긴 지점부터 이어받기를 반복 → 완성된 전체 텍스트를 반환한다.
    let assistantSoFar = '';
    let lastStop = '';
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const messages = [{ role: 'user', content: prompt || '' }];
      if (assistantSoFar) {
        messages.push({ role: 'assistant', content: assistantSoFar.replace(/\s+$/, '') });
      }
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: chosenModel,
          max_tokens: PER_ROUND,
          temperature: 0,
          system: system || '',
          messages,
        }),
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
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
