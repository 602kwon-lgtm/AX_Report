// 한성대 AX 플랫폼 서버
// 1) 빌드된 React 앱(dist/)을 정적 서빙
// 2) /api/claude 경로로 Anthropic API를 안전하게 중계 (API 키는 서버 환경변수에만 보관)
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '8mb' }));

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

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
    const { system, prompt, maxTokens } = req.body || {};
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens || 4096,
        temperature: 0,
        system: system || '',
        messages: [{ role: 'user', content: prompt || '' }],
      }),
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'AI 호출 실패: ' + String(e) });
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
