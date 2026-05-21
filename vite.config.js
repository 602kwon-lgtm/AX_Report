import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 개발 서버(npm run dev)에서 /api 요청을 로컬 Express(3000)로 전달.
// 운영(Render)에서는 server.js가 정적 파일과 /api를 함께 처리하므로 이 설정과 무관.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
