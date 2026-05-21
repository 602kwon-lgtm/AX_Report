import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, Search, FileEdit, Activity, ChevronRight,
  Building2, CheckCircle2, XCircle, AlertCircle,
  Sparkles, Loader2, Calendar, FileText, TrendingUp, TrendingDown,
  ArrowRight, RefreshCw, Bell, ScrollText, Target, Edit3,
  Pencil, ListChecks, PenTool, BarChart3, ChevronDown, Copy, Check,
  Upload, FileSpreadsheet, Database, CalendarClock, Lock, Unlock
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import * as XLSX from 'xlsx';

/* =====================================================================
 *  한성대 AX 보고혁신팀  ·  통합 사업관리 플랫폼  v0.3
 *  -- 본선 데모용 (2026 AX 프런티어 챌린지)
 *  v0.3 · 공공데이터포털 대학알리미 OpenAPI 실데이터 연동
 *        (한성대학교 2024 대학정보공시 · 6개 서비스 47개 지표)
 * ===================================================================== */

const FONT_LINK = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans+KR:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
`;

/* ---------------- 페이지 문구 (관리자 편집 대상) ---------------- */
const DEFAULT_TEXTS = {
  dashboard: {
    eyebrow: '01 · Overview',
    title: '좋은 아침입니다, 기획처.',
    description: '2026년 5월 21일 목요일 · 한성대학교 기획처 사업관리실 · 진행 중 사업 7건, 신규 공고 12건이 대기 중입니다.',
  },
  discovery: {
    eyebrow: '02 · Discovery',
    title: '공고문 분석 · 자격 검증',
    description: '교육부·과기정통부·서울시 등에서 게시된 공고를 자동 수집하여, 한성대 프로필 기준으로 지원 가능 여부를 사전 판별합니다. Claude가 공고문을 정성적으로 해석합니다.',
  },
  planning: {
    eyebrow: '03 · Planning',
    title: '사업계획서 작성·검증',
    description: '공고문 분석에 기반한 작성 보조와, 제출 직전 수치 더블체크를 한 화면에서 처리합니다.',
  },
  operations: {
    eyebrow: '04 · Operations',
    title: '운영 체크리스트 · 성과 컨설팅',
    description: '제출한 사업계획서를 AI가 분석하여 의무사항을 월별 타임라인으로 정리하고, 6영역 성과 지수에 대한 정성적 개선 대책을 컨설팅합니다.',
  },
};

/* ---------------- 한성대 프로필 (시스템 프롬프트에 주입) ---------------- */
const DEFAULT_PROFILE = {
  학교명: '한성대학교',
  설립유형: '사립',
  소재지: '서울특별시 성북구 (수도권)',
  학교규모: '재학생 7,024명 · 재적학생 9,442명 (2024 대학정보공시 기준)',
  주요특성: '학부중심 종합대학 · IT/디자인/창의융합 특성화',
  기관평가인증: '인증 (한국대학평가원)',
  재정건전대학: '해당 (재정진단 통과)',
  재정지원제한대학: '해당 없음',
  최근수행사업: '대학혁신지원사업, LINC 3.0, 수도권 대학 특성화사업',
  특이사항: '수도권 사립, 비수도권 우대 사업 일부 제외 가능성',
};

/* ---------------- 실제 공고 카드 (사용자 제공 PDF 기반) ---------------- */
const MOCK_ANNOUNCEMENTS = [
  {
    id: 'sw-univ-2026',
    title: '2026년도 소프트웨어 중심대학 신규 선정',
    agency: '과학기술정보통신부 · 정보통신기획평가원',
    deadline: '2026-03-18',
    budget: '대학당 연 20억원 (일반트랙)',
    tag: '대형',
    summary: 'AI·SW 융합인재 양성을 위한 대학 교육체계 혁신. 일반트랙 8개교, 특화트랙 2개교 선정.',
    fullText:
`[사업명] 2026년도 소프트웨어 중심대학 신규 선정 (과학기술정보통신부 공고 제2026-074호)
[지원대상] SW관련 학과를 보유한 국내 4년제 대학 (이공계지원법 제2조 제2호 나목)
[지원규모]
  - 일반트랙 8개교: 대학당 연 20억원 내외(1년차 10억내), 최장 8년(4+2+2년)
  - 특화트랙 2개교: 대학당 연 10억원 내외(1년차 5억내), 최장 6년(4+2년)
[일반트랙 신청자격]
  - SW학과 입학정원 100명 이상 (계약정원제 포함)
  - 대학원 SW관련학과 운영 필수
  - 정부지원금의 10% 민간부담금 (대학 현금)
[특화트랙 신청자격]
  - 입학정원 제한 없음
  - 단, 재학생 1만명 이상 대규모 대학은 신청 불가 (최근 3년 평균)
[지원제외]
  - 과학기술특성화대학 (KAIST, GIST, DGIST, UNIST, POSTECH)
  - 지원기간이 종료된 SW중심대학
  - 국가연구개발사업 참여제한 중인 자
[우대사항 - 최대 3점]
  - 수도권(서울·경기·인천) 이외 지방 지역 소재 대학 가산점 2점
  - 글로컬대학 본지정 대학 연계 발전방안 제안시 가산점 최대 1점
[평가] 서면평가 40% + 발표평가 60%, 최종점수 60점 미만 선정 제외
[추진일정] 공고 2.6 ~ 신청 3.18 16시까지, 서면평가 4월, 발표평가 5월, 최종확정 5월말`,
  },
  {
    id: 'seoul-rise-2026',
    title: '2026년 서울특별시 지역혁신중심 대학지원체계(RISE)',
    agency: '서울특별시 · 서울연구원',
    deadline: '2026-04-09',
    budget: '대학별 60억원 내외 (5년)',
    tag: '핵심',
    summary: '서울시 경제산업 발전 연계 전략적 대학지원. 4개 프로젝트 11개 단위과제 자율 선택.',
    fullText:
`[사업명] 2026년 서울특별시 지역혁신중심 대학지원체계(RISE) (서울특별시 공고 제2026-1029호)
[목적] 교육부와 서울시 경제산업 발전과 연계한 전략적 대학지원, 서울-대학 동반성장
[사업기간] 기본 3년(26.5~29.2) + 연장 2년(29.3~31.2), 중간평가 우수 대학(70% 내외) 연장
[예산] 2026년 565억원, 대학별 60억원 내외 (배정사업비 기준)
[주관대학 자격]
  - 기관평가인증을 받은 학교 (한국대학평가원)
  - 재정진단 결과 재정건전대학 (한국사학진흥재단)
  - 고등교육법 제2조에 해당하는 서울특별시 소재 대학(원) 및 캠퍼스
[신청형태] 대학 단독 또는 컨소시엄
  - 단, 4개 단위과제는 컨소시엄 필수: AI·BIO 클러스터 / 지역현안 / 서울-지방 공유 / 미래키움
[프로젝트 및 단위과제 (11개)]
  1) 글로벌 대학 경쟁력 강화: ① 글로벌 산학협력 선도(14억) ② 외국인 인재 유치(10억) ③ 미래인재 글로벌 역량(7억)
  2) 서울 전략산업 기반 강화: ④ 산학협력 생태계(15억) ⑤ AI·BIO 클러스터(26억) ⑥ 창조산업 인재양성(4억)
  3) 지역사회 동반성장: ⑦ 지역 현안 해결(3억) ⑧ 서울-지방 공유협력(6억) ⑨ 미래키움 교육지원(15억)
  4) 평생·직업교육 강화: ⑩ 서울 평생교육 고도화(4억) ⑪ 고숙련 전문기술(8억, 전문대 전용)
[제출서류] 사업계획서(통합전략 30쪽 + 단위과제별 15~20쪽), 기관평가인증서, 재정건전대학 목록, 법인등기부등본 등
[평가] 서면평가 + 대면평가 (가중치 적용), 사업조정위원회 조정, 서울RISE위원회 심의·의결
[배점] 통합전략 200점 + 단위과제 800점 = 총 1,000점
[추진일정] 공고 3.7 ~ 신청 4.9 13시, 평가 4~5월, 최종 5월 중순`,
  },
  {
    id: 'risc-2026',
    title: '2026 일반대학 학사구조 혁신지원사업',
    agency: '교육부',
    deadline: '2026-06-15',
    budget: '연 30억원 (3년)',
    tag: '핵심',
    summary: '학사구조 개편을 통한 융합·자율전공 확대 및 학생 진로역량 강화 지원.',
    fullText:
`[사업명] 2026 일반대학 학사구조 혁신지원사업
[주관] 교육부
[지원규모] 30개교 내외, 연 30억원 × 3년
[지원대상] 일반대학(수도권 포함)
[목적] 학사구조 개편을 통한 융합·자율전공 확대 및 학생 진로역량 강화
[필수 운영사항]
  - 자율전공/융합전공 정원 비중 확대 (3년 내 20% 이상 권장)
  - 학사구조 혁신위원회 운영 (분기별 1회 이상)
  - 외부 평가위원 참여 중간평가 (2년차)
  - 학생 진로역량 측정 도구 도입
[평가] 서면 + 발표 + 컨설팅, 가산점: 비수도권 +1점, 글로컬 대학 +1점
[추진일정] 신청 6.15까지, 평가 7월, 협약 8월`,
  },
];

/* ---------------- 사업계획서 샘플 (계획·운영 공용) ---------------- */
const SAMPLE_PLAN_TEXT =
`[2026 일반대학 학사구조 혁신지원사업 사업계획서 - 한성대학교]

1. 추진배경 및 필요성
한성대학교는 학부생 약 7,000명 규모의 학부중심 사립대학(서울 성북구 소재)으로,
최근 3년간 전공이수자 수가 평균 12% 증가하였다. 특히 자율전공 이수율은 2024년
기준 8%에 도달하여 2022년(5.2%) 대비 50% 이상 성장하였다. 본 사업을 통해
자율전공 비중을 20%로 확대하고자 한다.

2. 학생 진로역량 강화 지표
- 졸업생 취업률: 2024년 기준 68.5% → 2026년 목표 73% → 2028년 목표 78%
- 전공만족도: 2024년 기준 3.8/5.0 → 2026년 목표 4.1/5.0
- 자율전공 이수율: 2024년 8% → 2026년 15% → 2028년 20%
- 신입생 충원율: 2024년 99.5% (안정적 유지)

3. 재정 기반
- 학부 등록금: 2024년 평균 7,800천원 (3년간 동결 수준)
- 학생 1인당 장학금: 2024년 약 250만원 (전년 대비 2% 증가)
- 학자금대출 비율: 2024년 25.0% (지속 감소 추세)

4. 운영체계
- 학사구조 혁신위원회: 분기별 1회 (연 4회) 개최
- 사업 운영위원회: 월 1회 정기 개최
- 외부 평가위원 참여 중간평가: 2027년 9월
- 최종 성과보고: 2029년 6월
- 자율전공 신청 학생 멘토링 프로그램: 학기별 1회 (연 2회)

5. 산학협력 기반
- 산학협력 협약기업 200개사 (2024년 기준)
- 캡스톤디자인 참여학생: 연간 1,200명
- 현장실습 참여학생: 연간 800명

6. 예산편성
- 인건비: 18억원 (20%)
- 사업운영비: 45억원 (50%)
- 시설·장비비: 18억원 (20%)
- 기타: 9억원 (10%)
- 합계: 90억원`;

/* ----------- 대학정보공시 실데이터 (공공데이터포털 대학알리미 OpenAPI) ----------- */
/* hansung_disclosure.json — schlId 0000200 / 2024 공시 / data.go.kr OpenAPI 수집본 */
const DISCLOSURE_META = {
  학교: '한성대학교',
  schlId: '0000200',
  공시연도: '2024',
  출처: '공공데이터포털(data.go.kr) · 한국대학교육협의회 대학알리미 OpenAPI',
  수집일: '2026-05-21',
  서비스수: 6,
  지표수: 47,
};

// 대학알리미 OpenAPI로 수집한 한성대 2024학년도 공시 지표 (수치 더블체크·성과분석 원본)
const DISCLOSURE_INDICATORS = [
  { 영역: '학생', 지표: '입학전형 최종 등록률', 값: 98.5, 단위: '%' },
  { 영역: '학생', 지표: '정원내 신입생 경쟁률', 값: 9.9, 단위: ':1' },
  { 영역: '학생', 지표: '신입생 기회균형 선발 비율', 값: 14.8, 단위: '%' },
  { 영역: '학생', 지표: '신입생 충원율', 값: 99.9, 단위: '%', 비고: '모집 1,498명 / 입학 1,497명' },
  { 영역: '학생', 지표: '재학생', 값: 7024, 단위: '명' },
  { 영역: '학생', 지표: '재적학생', 값: 9442, 단위: '명' },
  { 영역: '학생', 지표: '휴학생', 값: 2199, 단위: '명' },
  { 영역: '학생', 지표: '재학생 충원율', 값: 119.6, 단위: '%', 비고: '편제정원 5,872명 / 재학생 7,024명' },
  { 영역: '학생', 지표: '중도탈락 학생비율', 값: 4.4, 단위: '%', 비고: '재적 9,300명 / 중도탈락 409명' },
  { 영역: '학생', 지표: '외국인 유학생', 값: 400, 단위: '명' },
  { 영역: '학생', 지표: '외국인 중도탈락 비율', 값: 6.3, 단위: '%' },
  { 영역: '학생', 지표: '졸업생 취업률', 값: 66.8, 단위: '%', 비고: '졸업 1,548명 / 취업대상 1,408명 / 취업 941명' },
  { 영역: '교원·연구', 지표: '전임교원 강의담당비율', 값: 68.4, 단위: '%' },
  { 영역: '교원·연구', 지표: '비전임교원 강의담당비율', 값: 7.48, 단위: '%' },
  { 영역: '교원·연구', 지표: '전임교원 1인당 학생수(재학생)', 값: 30.67, 단위: '명' },
  { 영역: '교원·연구', 지표: '전임교원 1인당 학생수(편제정원)', 값: 26.52, 단위: '명' },
  { 영역: '교원·연구', 지표: '전임교원 확보율', 값: 84.11, 단위: '%' },
  { 영역: '교원·연구', 지표: '외국인 전임교원', 값: 13, 단위: '명' },
  { 영역: '교원·연구', 지표: '전임교원 1인당 저역서', 값: 0.0462, 단위: '편' },
  { 영역: '교원·연구', 지표: '전임교원 교내 1인당 연구비', 값: 4214, 단위: '천원' },
  { 영역: '교원·연구', 지표: '전임교원 교외 1인당 연구비', 값: 27984, 단위: '천원' },
  { 영역: '교육여건', 지표: '교지·교사 확보율', 값: 147.3, 단위: '%' },
  { 영역: '교육여건', 지표: '기숙사 수용률', 값: 10.4, 단위: '%' },
  { 영역: '교육여건', 지표: '학생 1인당 자료구입비', 값: 106854, 단위: '원' },
  { 영역: '교육여건', 지표: '수익용기본재산 확보율', 값: 75.5, 단위: '%' },
  { 영역: '교육여건', 지표: '수익용기본재산 부담률', 값: 76.48, 단위: '%' },
  { 영역: '재정', 지표: '학생 1인당 등록금(연간)', 값: 7781302, 단위: '원' },
  { 영역: '재정', 지표: '학생 1인당 교육비 환원액', 값: 12557179, 단위: '원' },
  { 영역: '재정', 지표: '학생 1인당 장학금', 값: 3622103, 단위: '원' },
  { 영역: '재정', 지표: '학자금 대출 비율', 값: 13.8, 단위: '%' },
  { 영역: '재정', 지표: '학자금 대출 이용학생 비율', 값: 9.94, 단위: '%' },
  { 영역: '산학협력', 지표: '현장실습 운영', 값: 585, 단위: '건' },
  { 영역: '산학협력', 지표: '캡스톤디자인 운영', 값: 1, 단위: '건' },
  { 영역: '산학협력', 지표: '계약학과 설치·운영', 값: 1, 단위: '건' },
  { 영역: '산학협력', 지표: '주문식 교육과정', 값: 0, 단위: '건' },
];

// 수치 더블체크용 로우데이터 텍스트 — DISCLOSURE_INDICATORS에서 생성(단일 원본)
const DISCLOSURE_RAW_DATA = (() => {
  const m = DISCLOSURE_META;
  const header =
`[한성대학교 대학정보공시 로우데이터 · ${m.공시연도}학년도]
출처: ${m.출처}
수집: ${m.수집일} · schlId ${m.schlId} · ${m.서비스수}개 서비스 ${m.지표수}개 오퍼레이션 OpenAPI 연동`;
  const areas = {};
  DISCLOSURE_INDICATORS.forEach((d) => {
    (areas[d.영역] = areas[d.영역] || []).push(d);
  });
  const body = Object.keys(areas).map((area) => {
    const rows = areas[area]
      .map((r) => `${r.지표},${r.값},${r.단위}${r.비고 ? ',' + r.비고 : ''}`)
      .join('\n');
    return `\n[${area}]\n지표,값,단위,비고\n${rows}`;
  }).join('\n');
  return header + '\n' + body;
})();

const MOCK_SELECTED_PROJECT = {
  사업명: '2026 일반대학 학사구조 혁신지원사업',
  주관기관: '교육부',
  사업기간: '2026.07 ~ 2029.06 (3년)',
  총사업비: '90억원',
};

/* ---------------- 6영역 성과 (지수는 코드 산출, 근거는 2024 공시 실데이터) ---------------- */
const PERFORMANCE_AREAS = [
  { area: '교육',     current: 75, prev: 79, target: 85, change: -5.1,
    근거: ['전임교원 강의담당비율 68.4%', '전임교원 1인당 학생수 30.67명', '학생 1인당 교육비 1,256만원'] },
  { area: '학생성공', current: 82, prev: 80, target: 88, change: +2.5,
    근거: ['졸업생 취업률 66.8%', '재학생 충원율 119.6%', '중도탈락 학생비율 4.4%'] },
  { area: '글로벌',   current: 68, prev: 69, target: 75, change: -1.4,
    근거: ['외국인 유학생 400명', '외국인 전임교원 13명', '외국인 중도탈락 6.3%'] },
  { area: '연구산학', current: 79, prev: 73, target: 82, change: +8.2,
    근거: ['전임교원 교외 1인당 연구비 2,798만원', '현장실습 운영 585건', '전임교원 1인당 저역서 0.05편'] },
  { area: '공유공헌', current: 71, prev: 69, target: 78, change: +2.9,
    근거: ['학생 1인당 장학금 362만원', '기회균형 선발 14.8%', '캡스톤·계약학과 운영'] },
  { area: '경영',     current: 85, prev: 82, target: 88, change: +3.7,
    근거: ['학생 1인당 등록금 778만원', '수익용기본재산 확보율 75.5%', '학자금 대출 비율 13.8%'] },
];

/* ==================== Claude API 호출 헬퍼 ==================== */
// 관리자 인증 비밀번호 — 잠금 해제 시 설정되며 모든 AI 호출에 동봉된다 (서버가 검증).
let __aiPassword = '';
function setAIPassword(pw) { __aiPassword = pw || ''; }

async function callClaude(systemContext, userPrompt, maxTokens = 4096) {
  // 브라우저 → 자체 백엔드(/api/claude) → Anthropic API
  // API 키는 서버 환경변수에만 보관되며, 관리자 비밀번호가 있어야 호출된다.
  if (!__aiPassword) {
    throw new Error('관리자 인증이 필요합니다. 좌측 하단 「관리자 모드」에서 비밀번호로 잠금을 해제하세요.');
  }
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system: systemContext, prompt: userPrompt, maxTokens, password: __aiPassword }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API 오류: ${response.status} ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  return (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

// AI 응답에서 JSON을 추출. LLM이 만드는 형식 오류(앞뒤 설명문·쉼표 누락·제어문자 등)를 단계적으로 보정.
function extractJSON(text) {
  let s = String(text == null ? '' : text)
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();
  if (s.indexOf('{') === -1) {
    throw new Error('AI 응답에서 JSON을 찾지 못했습니다. 버튼을 한 번 더 눌러 주세요.');
  }

  // 후보 1: 균형잡힌 첫 객체(앞뒤 설명문 제거)  /  후보 2: 첫 { ~ 마지막 }
  const candidates = [];
  const balanced = firstBalancedObject(s);
  if (balanced) candidates.push(balanced);
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (b > a) candidates.push(s.slice(a, b + 1));

  for (const cand of candidates) {
    const cleaned = cand
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,(\s*[}\]])/g, '$1');
    for (const variant of [cand, cleaned, repairJSON(cleaned)]) {
      try { return JSON.parse(variant); } catch (e) { /* 다음 후보/변형 시도 */ }
    }
  }
  throw new Error(
    'AI 응답을 JSON으로 변환하지 못했습니다. 버튼을 한 번 더 눌러 주세요. (응답 앞부분: '
    + s.slice(0, 150).replace(/\s+/g, ' ') + ')'
  );
}

// 첫 '{' 와 짝이 맞는 '}' 까지의 객체 문자열 반환 (문자열 내부 중괄호는 무시)
function firstBalancedObject(s) {
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return s.slice(start, i + 1); }
  }
  return null;
}

// 문자열 경계를 인식해 (1) 누락된 쉼표 삽입 (2) 문자열 내부 raw 제어문자 이스케이프
function repairJSON(src) {
  let out = '';
  let inStr = false, esc = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (esc) { out += c; esc = false; continue; }
      if (c === '\\') { out += c; esc = true; continue; }
      if (c === '"') { out += c; inStr = false; continue; }
      if (c === '\n') { out += '\\n'; continue; }
      if (c === '\r') { out += '\\r'; continue; }
      if (c === '\t') { out += '\\t'; continue; }
      out += c;
      continue;
    }
    if (c === '{' || c === '[' || c === '"') {
      let j = out.length - 1;
      while (j >= 0 && /\s/.test(out[j])) j--;
      const prev = j >= 0 ? out[j] : '';
      // 새 값/키가 시작되는데 직전 문자가 구분자(, : [ {)가 아니면 쉼표 누락 → 삽입
      if (prev && prev !== ',' && prev !== ':' && prev !== '[' && prev !== '{') out += ',';
    }
    out += c;
    if (c === '"') inStr = true;
  }
  return out;
}

/* ==================== 공용 컴포넌트 ==================== */

// 관리자 편집 가능한 텍스트
function EditableText({ value, onChange, adminMode, multiline = false, className = '', style = {}, placeholder = '' }) {
  const [editing, setEditing] = useState(false);

  if (adminMode && editing) {
    const commit = () => setEditing(false);
    if (multiline) {
      return (
        <textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={commit}
          className={`${className} bg-amber-50 border border-amber-400 rounded px-2 py-1 outline-none w-full resize-none`}
          style={style}
          rows={3}
        />
      );
    }
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className={`${className} bg-amber-50 border border-amber-400 rounded px-2 py-1 outline-none w-full`}
        style={style}
      />
    );
  }

  const editStyle = adminMode
    ? 'cursor-pointer hover:bg-amber-100/60 hover:outline hover:outline-dashed hover:outline-1 hover:outline-amber-400 rounded px-1 -mx-1'
    : '';

  return (
    <span
      className={`${className} ${editStyle} inline-block`}
      style={style}
      onClick={() => adminMode && setEditing(true)}
      title={adminMode ? '클릭하여 편집' : ''}
    >
      {value || placeholder}
    </span>
  );
}

function Spinner({ label = '분석 중' }) {
  return (
    <div className="flex items-center gap-2 text-stone-600 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span style={{ fontFamily: 'IBM Plex Sans KR' }}>{label}</span>
      <span className="inline-flex gap-1 ml-1">
        <span className="w-1 h-1 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-1 h-1 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '120ms' }}></span>
        <span className="w-1 h-1 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '240ms' }}></span>
      </span>
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const map = {
    Pass: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', icon: CheckCircle2, label: '지원 가능' },
    Fail: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300', icon: XCircle, label: '지원 불가' },
    Review: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', icon: AlertCircle, label: '검토 필요' },
  };
  const cfg = map[verdict] || map.Review;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

function SeverityDot({ severity }) {
  const map = { 높음: 'bg-rose-500', 중간: 'bg-amber-500', 낮음: 'bg-stone-400' };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[severity] || 'bg-stone-400'}`}></span>;
}

/* ==================== 사이드바 ==================== */
/* ==================== 관리자 인증 모달 ==================== */
function AuthModal({ onClose, onSuccess }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!pw.trim() || busy) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const data = await r.json();
      if (data && data.ok) onSuccess(pw);
      else setErr('비밀번호가 올바르지 않습니다.');
    } catch (e) {
      setErr('인증 서버에 연결하지 못했습니다. (' + (e.message || e) + ')');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-[340px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-stone-700" />
          <h3 className="text-base font-semibold text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
            관리자 인증
          </h3>
        </div>
        <p className="text-xs text-stone-500 mb-4 leading-relaxed" style={{ fontFamily: 'IBM Plex Sans KR' }}>
          텍스트 편집과 AI 기능은 관리자 비밀번호가 필요합니다.
        </p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          autoFocus
          placeholder="비밀번호 입력"
          className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-stone-500"
          style={{ fontFamily: 'IBM Plex Sans KR' }}
        />
        {err && (
          <p className="text-xs text-rose-700 mt-2" style={{ fontFamily: 'IBM Plex Sans KR' }}>{err}</p>
        )}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose}
            className="flex-1 px-3 py-2 text-sm rounded border border-stone-300 text-stone-600 hover:bg-stone-50"
            style={{ fontFamily: 'IBM Plex Sans KR' }}>취소</button>
          <button onClick={submit} disabled={busy || !pw.trim()}
            className="flex-1 px-3 py-2 text-sm rounded bg-stone-900 text-white hover:bg-stone-800 disabled:bg-stone-400 flex items-center justify-center gap-1.5"
            style={{ fontFamily: 'IBM Plex Sans KR' }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
            {busy ? '확인 중' : '잠금 해제'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ tab, setTab, adminMode, onLockToggle }) {
  const items = [
    { key: 'dashboard',  label: '대시보드', icon: LayoutDashboard, sub: 'Overview' },
    { key: 'discovery',  label: '모색',     icon: Search,          sub: 'Discovery' },
    { key: 'planning',   label: '계획',     icon: FileEdit,        sub: 'Planning' },
    { key: 'operations', label: '운영',     icon: Activity,        sub: 'Operations' },
  ];
  return (
    <aside className="w-64 shrink-0 bg-stone-900 text-stone-100 flex flex-col">
      <div className="px-6 pt-7 pb-6 border-b border-stone-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-sm bg-gradient-to-br from-rose-300 to-amber-200 flex items-center justify-center text-stone-900 font-bold text-sm">
            AX
          </div>
          <span className="text-xs tracking-[0.2em] text-stone-400 uppercase" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            v0.3 · prototype
          </span>
        </div>
        <h1 className="text-[22px] leading-tight tracking-tight" style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}>
          한성대 <span className="italic">AX</span> 플랫폼
        </h1>
        <p className="text-xs text-stone-400 mt-1.5" style={{ fontFamily: 'IBM Plex Sans KR' }}>
          정부 재정지원사업 전주기 관리
        </p>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = tab === it.key;
          return (
            <button
              key={it.key}
              onClick={() => setTab(it.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all ${
                active ? 'bg-stone-100 text-stone-900' : 'text-stone-300 hover:bg-stone-800 hover:text-stone-100'
              }`}
              style={{ fontFamily: 'IBM Plex Sans KR' }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium">{it.label}</div>
                <div className={`text-[10px] tracking-wider uppercase text-stone-500`}
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  {it.sub}
                </div>
              </div>
              {active && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          );
        })}
      </nav>

      {/* 관리자 모드 (비밀번호 잠금) */}
      <div className="px-4 py-3 border-t border-stone-800">
        <button
          onClick={onLockToggle}
          className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition ${
            adminMode ? 'bg-amber-300 text-stone-900' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
          }`}
          style={{ fontFamily: 'IBM Plex Sans KR' }}
        >
          <span className="flex items-center gap-2">
            {adminMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            관리자 모드
          </span>
          <span className={`text-[10px] tracking-widest uppercase ${adminMode ? 'text-stone-700' : 'text-stone-500'}`}
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {adminMode ? '해제됨' : '잠김'}
          </span>
        </button>
        {adminMode ? (
          <p className="text-[10px] text-amber-300 mt-2 leading-snug" style={{ fontFamily: 'IBM Plex Sans KR' }}>
            텍스트 편집·AI 기능이 활성화됐습니다. 노란 점선 문구를 클릭해 편집하세요.
          </p>
        ) : (
          <p className="text-[10px] text-stone-500 mt-2 leading-snug" style={{ fontFamily: 'IBM Plex Sans KR' }}>
            텍스트 편집·AI 기능은 관리자 전용입니다. 클릭해 비밀번호를 입력하세요.
          </p>
        )}
      </div>

      <div className="px-5 py-4 border-t border-stone-800 text-[11px] text-stone-500 leading-relaxed"
        style={{ fontFamily: 'IBM Plex Sans KR' }}>
        <div className="text-stone-400 mb-0.5">2026 AX 프런티어 챌린지</div>
        <div>AX 보고혁신팀 · 한성대학교</div>
      </div>
    </aside>
  );
}

/* ==================== 페이지 헤더 (편집 가능) ==================== */
function PageHeader({ pageKey, texts, setTexts, adminMode, actions }) {
  const t = texts[pageKey];
  const update = (field, value) => setTexts({ ...texts, [pageKey]: { ...t, [field]: value } });

  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div className="flex-1 min-w-0">
        <div className="text-[11px] tracking-[0.25em] text-rose-800 uppercase mb-2"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          <EditableText value={t.eyebrow} onChange={(v) => update('eyebrow', v)} adminMode={adminMode} />
        </div>
        <h2 className="text-4xl tracking-tight text-stone-900 mb-2 leading-tight"
          style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontVariationSettings: '"opsz" 144' }}>
          <EditableText value={t.title} onChange={(v) => update('title', v)} adminMode={adminMode} />
        </h2>
        <div className="text-sm text-stone-600 max-w-2xl leading-relaxed"
          style={{ fontFamily: 'IBM Plex Sans KR' }}>
          <EditableText value={t.description} onChange={(v) => update('description', v)} adminMode={adminMode} multiline />
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

/* ==================== 대시보드 ==================== */
function DashboardView({ goTab, texts, setTexts, adminMode }) {
  const avg = useMemo(
    () => Math.round(PERFORMANCE_AREAS.reduce((s, x) => s + x.current, 0) / PERFORMANCE_AREAS.length),
    []
  );
  const radarData = PERFORMANCE_AREAS.map((a) => ({ area: a.area, score: a.current, target: a.target }));

  const kpis = [
    { label: '진행 중 사업', value: '7', sub: '전년 +2', tone: 'pos' },
    { label: '신규 공고', value: '12', sub: '이번주 +3', tone: 'pos' },
    { label: '마감 임박', value: '3', sub: '7일 이내', tone: 'warn' },
    { label: '성과 평균', value: `${avg}`, sub: '6영역 가중평균', tone: 'neutral' },
  ];

  const alerts = [
    { time: '14:22', tag: '모색', text: '교육부 「학사구조 혁신지원사업」 공고가 게시되었습니다 (D-25)', tone: 'info' },
    { time: '11:08', tag: '계획', text: 'SW중심대학 사업계획서 - 자율전공 이수율 수치 불일치 1건 감지', tone: 'warn' },
    { time: '09:30', tag: '운영', text: 'LINC 3.0 9월 중간평가 D-32 · 증빙자료 12종 중 4종 미수집', tone: 'warn' },
    { time: '어제',   tag: '운영', text: '대학혁신지원사업 분기 보고서 자동 초안 생성 완료', tone: 'ok' },
  ];

  return (
    <div>
      <PageHeader pageKey="dashboard" texts={texts} setTexts={setTexts} adminMode={adminMode} />

      <div className="grid grid-cols-4 gap-4 mb-10">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-stone-200 rounded p-5">
            <div className="text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{k.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl text-stone-900" style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}>
                {k.value}
              </span>
              <span className={`text-xs ${
                k.tone === 'pos' ? 'text-emerald-700' :
                k.tone === 'warn' ? 'text-amber-700' : 'text-stone-500'
              }`} style={{ fontFamily: 'IBM Plex Sans KR' }}>{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        <section className="col-span-3 bg-white border border-stone-200 rounded">
          <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-stone-700" />
              <h3 className="text-sm font-semibold text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                최근 알림
              </h3>
            </div>
            <span className="text-[10px] tracking-widest text-stone-500 uppercase"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}>실시간 · 자동</span>
          </div>
          <ul className="divide-y divide-stone-100">
            {alerts.map((a, i) => (
              <li key={i} className="px-5 py-3.5 flex items-start gap-3 hover:bg-stone-50">
                <span className="text-[11px] text-stone-500 w-12 shrink-0 mt-0.5"
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{a.time}</span>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide mt-0.5 ${
                  a.tag === '모색' ? 'bg-stone-900 text-stone-100' :
                  a.tag === '계획' ? 'bg-rose-900 text-rose-50' :
                  'bg-amber-800 text-amber-50'
                }`} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{a.tag}</span>
                <p className="text-sm text-stone-700 leading-relaxed flex-1"
                  style={{ fontFamily: 'IBM Plex Sans KR' }}>{a.text}</p>
                <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${
                  a.tone === 'warn' ? 'bg-amber-500' :
                  a.tone === 'ok' ? 'bg-emerald-500' : 'bg-stone-400'
                }`}></div>
              </li>
            ))}
          </ul>
        </section>

        <section className="col-span-2 bg-white border border-stone-200 rounded">
          <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
              6영역 성과 미리보기
            </h3>
            <button onClick={() => goTab('operations')} className="text-[11px] text-rose-800 hover:text-rose-950 flex items-center gap-0.5"
              style={{ fontFamily: 'IBM Plex Sans KR' }}>
              상세 분석 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#e7e5e4" />
                <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: '#44403c', fontFamily: 'IBM Plex Sans KR' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#a8a29e' }} />
                <Radar name="목표" dataKey="target" stroke="#d6d3d1" fill="#d6d3d1" fillOpacity={0.18} />
                <Radar name="현재" dataKey="score" stroke="#881337" fill="#881337" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { key: 'discovery', label: '신규 공고 분석', desc: '교육부·과기정통부 공고 자격 검증', icon: Search },
          { key: 'planning', label: '사업계획서 작성', desc: '작성 보조 · 수치 더블체크', icon: FileEdit },
          { key: 'operations', label: '성과 컨설팅', desc: '체크리스트 · 6영역 분석', icon: Activity },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <button key={c.key} onClick={() => goTab(c.key)}
              className="bg-stone-900 hover:bg-stone-800 text-stone-100 rounded p-5 text-left transition group">
              <div className="flex items-center justify-between mb-6">
                <Icon className="w-5 h-5 text-stone-400 group-hover:text-rose-300 transition" />
                <ArrowRight className="w-4 h-4 text-stone-600 group-hover:text-stone-200 transition" />
              </div>
              <div className="text-base font-medium mb-1" style={{ fontFamily: 'IBM Plex Sans KR' }}>{c.label}</div>
              <div className="text-xs text-stone-400" style={{ fontFamily: 'IBM Plex Sans KR' }}>{c.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ==================== 모색 (Discovery) ==================== */
function DiscoveryView({ texts, setTexts, adminMode }) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [editProfile, setEditProfile] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [customText, setCustomText] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const profileText = Object.entries(profile).map(([k, v]) => `- ${k}: ${v}`).join('\n');

  const systemPrompt = `당신은 대학 행정 및 정부 재정지원사업(RISE, 글로컬대학30, SW중심대학, 학사구조 혁신 등) 평가위원장을 20년간 역임한 최고 전문가입니다. 사립·국립·수도권·비수도권 등 대학 유형별 자격 조건을 정확히 이해하고 있습니다.

대상 대학의 프로필:
${profileText}

임무: 주어진 정부 재정지원사업 공고문을 검토하여, 이 대학이 지원 가능한지를 엄정하게 판단합니다. 자격요건이 명시적으로 충족되지 않거나 불확실하면 Review로 분류하고 사유를 명시하세요.

출력은 반드시 아래 JSON 스키마를 따르며, JSON 외 다른 텍스트는 출력하지 마세요:
{
  "지원가능여부": "Pass" | "Fail" | "Review",
  "신뢰도": "높음" | "중간" | "낮음",
  "한줄요약": "...",
  "충족조건": [
    { "조건": "...", "충족여부": true | false | null, "설명": "..." }
  ],
  "주의사항": ["...", "..."],
  "추천행동": "..."
}`;

  const selectedAnnouncement = MOCK_ANNOUNCEMENTS.find((a) => a.id === selectedId);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const userPrompt = useCustom
        ? `다음 공고문을 분석해주세요:\n\n${customText}`
        : `다음 공고문을 분석해주세요:\n\n${selectedAnnouncement.fullText}`;
      const raw = await callClaude(systemPrompt, userPrompt);
      const parsed = extractJSON(raw);
      setResult(parsed);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader pageKey="discovery" texts={texts} setTexts={setTexts} adminMode={adminMode} />

      <div className="grid grid-cols-3 gap-6">
        {/* 좌측: 대학 프로필 */}
        <div className="col-span-1">
          <div className="bg-white border border-stone-200 rounded">
            <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-stone-700" />
                <h3 className="text-sm font-semibold text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                  대학 프로필
                </h3>
              </div>
              <button onClick={() => setEditProfile((e) => !e)}
                className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1"
                style={{ fontFamily: 'IBM Plex Sans KR' }}>
                <Edit3 className="w-3 h-3" /> {editProfile ? '완료' : '수정'}
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm" style={{ fontFamily: 'IBM Plex Sans KR' }}>
              {Object.entries(profile).map(([k, v]) => (
                <div key={k}>
                  <div className="text-[10px] tracking-widest text-stone-500 uppercase mb-1"
                    style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{k}</div>
                  {editProfile ? (
                    <input
                      className="w-full px-2 py-1 border border-stone-300 rounded text-stone-900 text-sm focus:outline-none focus:border-stone-700"
                      value={v}
                      onChange={(e) => setProfile({ ...profile, [k]: e.target.value })}
                    />
                  ) : (
                    <div className="text-stone-800">{v}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-stone-100 bg-stone-50 text-[11px] text-stone-600 flex items-start gap-2"
              style={{ fontFamily: 'IBM Plex Sans KR' }}>
              <Sparkles className="w-3 h-3 mt-0.5 text-rose-700 shrink-0" />
              <span>이 프로필은 모든 AI 분석의 시스템 프롬프트로 자동 주입됩니다.</span>
            </div>
            <div className="px-5 py-2 border-t border-stone-100 bg-amber-50/60 text-[10px] text-amber-900 flex items-center justify-between"
              style={{ fontFamily: 'IBM Plex Sans KR' }}>
              <span>📊 시연용 합성 데이터</span>
              <span className="text-[9px] tracking-widest uppercase text-amber-700" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                production: 공공데이터포털 API
              </span>
            </div>
          </div>
        </div>

        {/* 우측: 공고 리스트 */}
        <div className="col-span-2">
          <div className="bg-white border border-stone-200 rounded">
            <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                수집된 공고 ({MOCK_ANNOUNCEMENTS.length}건)
              </h3>
              <button
                onClick={() => { setUseCustom(true); setSelectedId(null); setResult(null); }}
                className="text-xs text-rose-800 hover:text-rose-950 flex items-center gap-1"
                style={{ fontFamily: 'IBM Plex Sans KR' }}>
                <FileText className="w-3 h-3" /> 직접 공고문 입력
              </button>
            </div>
            <ul className="divide-y divide-stone-100">
              {MOCK_ANNOUNCEMENTS.map((a) => {
                const active = !useCustom && selectedId === a.id;
                return (
                  <li key={a.id}
                    onClick={() => { setSelectedId(a.id); setUseCustom(false); setResult(null); }}
                    className={`px-5 py-4 cursor-pointer transition ${active ? 'bg-stone-900 text-stone-50' : 'hover:bg-stone-50'}`}>
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h4 className="text-sm font-medium leading-snug" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                        {a.title}
                      </h4>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide ${
                        active ? 'bg-stone-700 text-stone-100' :
                        a.tag === '대형' ? 'bg-rose-100 text-rose-900' :
                        a.tag === '핵심' ? 'bg-amber-100 text-amber-900' :
                        'bg-stone-100 text-stone-700'
                      }`} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                        {a.tag}
                      </span>
                    </div>
                    <div className={`text-xs mb-2 ${active ? 'text-stone-300' : 'text-stone-500'}`}
                      style={{ fontFamily: 'IBM Plex Sans KR' }}>
                      {a.agency} · 마감 {a.deadline} · {a.budget}
                    </div>
                    <p className={`text-xs leading-relaxed ${active ? 'text-stone-200' : 'text-stone-600'}`}
                      style={{ fontFamily: 'IBM Plex Sans KR' }}>
                      {a.summary}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          {useCustom && (
            <div className="bg-white border border-stone-200 rounded mt-4">
              <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                  공고문 직접 입력
                </h3>
                <button onClick={() => setUseCustom(false)} className="text-xs text-stone-500 hover:text-stone-900">
                  취소
                </button>
              </div>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="여기에 NRF 또는 교육부의 실제 공고문 전문을 붙여넣으세요 (PDF에서 복사하셔도 됩니다)..."
                className="w-full px-5 py-4 text-sm h-64 resize-none focus:outline-none"
                style={{ fontFamily: 'IBM Plex Sans KR' }}
              />
            </div>
          )}

          {(selectedId || useCustom) && (
            <div className="mt-4 flex items-center justify-between bg-stone-100 border border-stone-200 rounded px-5 py-3">
              <div className="text-sm text-stone-700" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                {useCustom ? '입력 공고문' : selectedAnnouncement?.title}
                <span className="text-stone-500"> 을(를) 한성대 프로필 기준으로 분석합니다.</span>
              </div>
              <button
                onClick={runAnalysis}
                disabled={loading || (useCustom && !customText.trim())}
                className="px-4 py-2 bg-rose-900 hover:bg-rose-950 disabled:bg-stone-400 text-white text-sm rounded flex items-center gap-2"
                style={{ fontFamily: 'IBM Plex Sans KR' }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? '분석 중' : 'AI 자격 검증'}
              </button>
            </div>
          )}

          {loading && (
            <div className="mt-4 bg-white border border-stone-200 rounded p-6">
              <Spinner label="Claude가 공고문과 프로필을 대조 검토하는 중입니다" />
            </div>
          )}
          {error && (
            <div className="mt-4 bg-rose-50 border border-rose-200 rounded p-4 text-sm text-rose-900"
              style={{ fontFamily: 'IBM Plex Sans KR' }}>오류: {error}</div>
          )}
          {result && (
            <div className="mt-4 bg-white border border-stone-200 rounded overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-3">
                  <VerdictBadge verdict={result.지원가능여부} />
                  <span className="text-xs text-stone-600" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                    신뢰도 <strong className="text-stone-900">{result.신뢰도}</strong>
                  </span>
                </div>
                <span className="text-[10px] tracking-widest text-stone-500 uppercase"
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}>by Claude · structured</span>
              </div>
              <div className="p-5">
                <p className="text-sm text-stone-800 mb-5 leading-relaxed font-medium"
                  style={{ fontFamily: 'IBM Plex Sans KR' }}>{result.한줄요약}</p>

                <div className="text-[10px] tracking-widest text-stone-500 uppercase mb-2"
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}>충족조건 검토</div>
                <ul className="space-y-2 mb-5">
                  {(result.충족조건 || []).map((c, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                      {c.충족여부 === true ? <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" /> :
                       c.충족여부 === false ? <XCircle className="w-4 h-4 text-rose-700 mt-0.5 shrink-0" /> :
                       <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />}
                      <div>
                        <div className="text-stone-900 font-medium">{c.조건}</div>
                        <div className="text-stone-600 text-xs mt-0.5">{c.설명}</div>
                      </div>
                    </li>
                  ))}
                </ul>

                {result.주의사항 && result.주의사항.length > 0 && (
                  <>
                    <div className="text-[10px] tracking-widest text-stone-500 uppercase mb-2"
                      style={{ fontFamily: 'IBM Plex Mono, monospace' }}>주의사항</div>
                    <ul className="space-y-1 mb-5">
                      {result.주의사항.map((w, i) => (
                        <li key={i} className="text-sm text-stone-700 pl-4 relative" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                          <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                <div className="bg-stone-50 border-l-2 border-rose-900 p-3 text-sm">
                  <div className="text-[10px] tracking-widest text-rose-900 uppercase mb-1"
                    style={{ fontFamily: 'IBM Plex Mono, monospace' }}>추천 행동</div>
                  <p className="text-stone-800" style={{ fontFamily: 'IBM Plex Sans KR' }}>{result.추천행동}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==================== 계획 (Planning) - 2 섹션 ==================== */
function PlanningView({ texts, setTexts, adminMode }) {
  const [subtab, setSubtab] = useState('doublecheck');

  return (
    <div>
      <PageHeader pageKey="planning" texts={texts} setTexts={setTexts} adminMode={adminMode} />

      {/* 서브탭 */}
      <div className="flex items-center gap-1 mb-6 bg-stone-200/60 p-1 rounded w-fit">
        {[
          { key: 'doublecheck', label: '수치 더블체크', icon: ListChecks, sub: 'Validation' },
          { key: 'assist',      label: '작성 보조',     icon: PenTool,    sub: 'Drafting' },
        ].map((s) => {
          const Icon = s.icon;
          const active = subtab === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setSubtab(s.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition ${
                active ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
              style={{ fontFamily: 'IBM Plex Sans KR' }}>
              <Icon className="w-4 h-4" />
              <span className="font-medium">{s.label}</span>
              <span className="text-[10px] tracking-widest text-stone-500 uppercase"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{s.sub}</span>
            </button>
          );
        })}
      </div>

      {subtab === 'doublecheck' && <PlanningDoubleCheck />}
      {subtab === 'assist'      && <PlanningAssist />}
    </div>
  );
}

/* ----------------- 계획: 수치 더블체크 (기존) ----------------- */
function PlanningDoubleCheck() {
  const [planText, setPlanText] = useState(SAMPLE_PLAN_TEXT);
  const [mode, setMode] = useState('disclosure'); // 'disclosure' | 'upload'

  // 대학정보공시 데이터 (OpenAPI 수집본 · 편집 가능)
  const [disclosureData, setDisclosureData] = useState(DISCLOSURE_RAW_DATA);

  // 대학 자체 업로드 — 부서별 원본 엑셀 다중 업로드 + AI 자동 집계
  const [files, setFiles] = useState([]);           // [{ id, name, headers, rows, rowCount }]
  const [agg, setAgg] = useState(null);             // { files:[...], summaryText }
  const [aggLoading, setAggLoading] = useState(false);
  const [aggError, setAggError] = useState(null);
  const [aggTime, setAggTime] = useState('');
  const [uploadText, setUploadText] = useState(''); // 집계 결과 텍스트 (편집 가능 · 더블체크 입력값)

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const rawData = mode === 'disclosure' ? disclosureData : uploadText;
  const canRun = !loading && planText.trim() && rawData.trim();

  const systemPrompt = `당신은 정부 재정지원사업 평가위원이자 회계 감사 전문가입니다. 사업계획서 본문에 인용된 수치(목표값, 현황, 예산 등)와 첨부된 대학 로우데이터를 정밀 대조하여, 모든 불일치를 찾아내는 것이 임무입니다.

검토 원칙:
1. 사업계획서가 명시한 모든 정량 수치(목표값·현황·예산 등)를 로우데이터에서 직접 확인
2. 수치가 0.5% 이상 또는 명백하게 차이나면 불일치로 분류
3. 로우데이터에서 해당 값이 발견되지 않으면 '검증불가'로 표기
4. 단순 오탈자보다는 의미상의 불일치를 우선 보고
5. 로우데이터의 기준 시점(공시연도·조사기준일)과 사업계획서가 인용한 연도·시점이 다르면 '시점 불일치'로 반드시 지적하고, 권고에 기준 시점을 명시

출력은 반드시 아래 JSON 스키마만 따르세요:
{
  "전체검토수": <int>,
  "일치": <int>,
  "불일치": <int>,
  "검증불가": <int>,
  "이슈": [
    {
      "위치": "...",
      "사업계획서값": "...",
      "로우데이터값": "...",
      "차이": "...",
      "심각도": "높음" | "중간" | "낮음",
      "권고": "..."
    }
  ],
  "총평": "..."
}`;

  /* ---- 부서별 원본 엑셀/CSV 다중 업로드 (가공 없이 raw 그대로) ---- */
  function handleFiles(e) {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (!picked.length) return;
    setAggError(null);
    picked.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
          if (!aoa.length) throw new Error('빈 시트');
          const headers = (aoa[0] || []).map((h) => String(h).trim());
          const rows = aoa.slice(1).filter((r) => r.some((c) => String(c).trim() !== ''));
          setFiles((prev) => [...prev, {
            id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            name: file.name, headers, rows, rowCount: rows.length,
          }]);
        } catch (err) {
          setAggError(file.name + ' — 읽기 실패: ' + (err.message || err));
        }
      };
      reader.onerror = () => setAggError(file.name + ' — 파일 읽기 실패');
      reader.readAsArrayBuffer(file);
    });
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  // 셀 값 → 숫자 (단위·콤마 제거)
  function toNum(v) {
    if (v === null || v === undefined || v === '') return null;
    const s = String(v).replace(/[^0-9.\-]/g, '');
    if (s === '' || s === '-' || s === '.') return null;
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  // AI 컬럼 분류 결과 → 코드가 합계·평균·건수 계산 (산술은 코드가 정확히 수행)
  function computeAggregates(parsed) {
    const out = [];
    (parsed.files || []).forEach((pf) => {
      const f = files[pf.fileIndex];
      if (!f) return;
      const findIdx = (nm) => f.headers.findIndex((h) => h.trim() === String(nm).trim());
      const metrics = [];
      (pf.컬럼 || []).forEach((c) => {
        const idx = findIdx(c.이름);
        if (idx < 0) return;
        if (c.역할 === '합계' || c.역할 === '평균') {
          let sum = 0, cnt = 0;
          f.rows.forEach((r) => { const n = toNum(r[idx]); if (n !== null) { sum += n; cnt++; } });
          if (!cnt) return;
          if (c.역할 === '합계') {
            metrics.push({ 지표: c.이름 + ' 합계', 값: Math.round(sum * 100) / 100, 종류: '합계' });
          } else {
            metrics.push({ 지표: c.이름 + ' 평균', 값: Math.round((sum / cnt) * 100) / 100, 종류: '평균' });
          }
        } else if (c.역할 === '기간') {
          const vals = f.rows.map((r) => String(r[idx]).trim()).filter(Boolean).sort();
          if (vals.length) metrics.push({ 지표: c.이름, 값: vals[0] + ' ~ ' + vals[vals.length - 1], 종류: '기간' });
        }
      });
      out.push({
        name: f.name,
        설명: pf.데이터설명 || '업로드 자료',
        행단위: pf.행단위 || '행',
        행수: f.rowCount,
        metrics,
      });
    });
    const fmt = (v) => (typeof v === 'number' ? v.toLocaleString() : v);
    const summaryText = '[대학 자체 업로드 자료 · AI 자동 집계 결과]\n'
      + '※ 컬럼 분류는 AI, 합계·평균·건수 계산은 시스템(코드)이 수행. 원본 파일 ' + out.length + '개.\n\n'
      + out.map((o) => {
          const lines = ['■ ' + o.name + ' — ' + o.설명,
            '  · ' + o.행단위 + ' 수: ' + o.행수.toLocaleString() + '건'];
          o.metrics.forEach((m) => lines.push('  · ' + m.지표 + ': ' + fmt(m.값)));
          return lines.join('\n');
        }).join('\n\n');
    return { files: out, summaryText };
  }

  const aggSystem = `당신은 대학 데이터 분석가입니다. 부서마다 양식이 제각각인 원본 엑셀의 컬럼 구조를 보고, 각 컬럼을 '집계 역할'로 분류하는 것이 임무입니다. 실제 합계·평균·건수 계산은 시스템(코드)이 수행하므로 당신은 분류만 정확히 하면 되며, 직접 계산하지 마세요.

컬럼 역할:
- "합계": 행을 모두 더했을 때 의미있는 수량 (참여자수, 인원, 건수, 예산, 금액 등)
- "평균": 행을 평균냈을 때 의미있는 점수/비율 (만족도, 평점, 달성률, 비율 등)
- "식별": 행을 식별하는 이름/코드 (프로그램명, 과정명 등)
- "기간": 날짜·시기 (운영시기, 일자 등)
- "기타": 위 어디에도 해당하지 않음

JSON 스키마만 출력하세요:
{
  "files": [
    {
      "fileIndex": <파일 번호 정수>,
      "데이터설명": "이 파일이 어떤 데이터인지 한 줄 설명",
      "행단위": "한 행이 의미하는 단위 (예: 프로그램, 과정, 학생)",
      "컬럼": [
        { "이름": "원본 컬럼명과 정확히 동일하게", "역할": "합계|평균|식별|기간|기타" }
      ]
    }
  ]
}`;

  async function runAgg() {
    setAggLoading(true); setAggError(null); setAgg(null);
    try {
      const desc = files.map((f, i) => {
        const sample = f.rows.slice(0, 5).map((r) => r.join(' | ')).join('\n') || '(데이터 행 없음)';
        return `[파일 ${i} · ${f.name}]\n컬럼: ${f.headers.join(' | ')}\n샘플(최대 5행):\n${sample}`;
      }).join('\n\n');
      const raw = await callClaude(aggSystem,
        `다음은 대학 부서들이 업로드한 원본 엑셀 ${files.length}개입니다. 각 파일의 컬럼을 역할별로 분류해주세요:\n\n${desc}`);
      const computed = computeAggregates(extractJSON(raw));
      setAgg(computed);
      setUploadText(computed.summaryText);
      setAggTime(new Date().toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }));
    } catch (e) { setAggError(e.message); }
    finally { setAggLoading(false); }
  }

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const sourceLabel = mode === 'disclosure'
        ? `대학정보공시 · ${DISCLOSURE_META.공시연도}학년도 기준 (${DISCLOSURE_META.출처}, ${DISCLOSURE_META.수집일} 수집)`
        : `대학 자체 업로드 자료 · 원본 ${files.length}개 파일 AI 자동 집계 (${aggTime || '집계 시점 미상'})`;
      const raw = await callClaude(systemPrompt,
        `[사업계획서]\n${planText}\n\n[로우데이터]\n출처·기준시점: ${sourceLabel}\n\n${rawData}\n\n위 두 문서를 대조하여 모든 수치 불일치를 찾아주세요. 로우데이터의 기준 시점과 사업계획서가 인용한 연도·시점이 다르면 반드시 '시점 불일치'로 지적하세요.`);
      const parsed = extractJSON(raw);
      parsed._기준시점 = sourceLabel;
      setResult(parsed);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="bg-stone-900 text-stone-100 rounded p-4 mb-4 grid grid-cols-4 gap-4">
        {Object.entries(MOCK_SELECTED_PROJECT).map(([k, v]) => (
          <div key={k}>
            <div className="text-[10px] tracking-widest text-stone-400 uppercase mb-1"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{k}</div>
            <div className="text-sm text-stone-100" style={{ fontFamily: 'IBM Plex Sans KR' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* 데이터 출처 메뉴 */}
      <div className="flex items-center gap-1 mb-3 bg-stone-100 rounded p-1 w-fit">
        {[
          { key: 'disclosure', label: '대학정보공시', icon: Database },
          { key: 'upload', label: '대학 자체 업로드', icon: Upload },
        ].map((t) => {
          const Icon = t.icon;
          const on = mode === t.key;
          return (
            <button key={t.key} onClick={() => setMode(t.key)}
              className={`px-4 py-1.5 rounded text-sm flex items-center gap-1.5 transition ${
                on ? 'bg-white text-stone-900 shadow-sm font-semibold' : 'text-stone-500 hover:text-stone-800'
              }`} style={{ fontFamily: 'IBM Plex Sans KR' }}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      {/* 기준 시점 배너 — 데이터 시점 강조 */}
      {mode === 'disclosure' ? (
        <div className="bg-emerald-50 border border-emerald-300 rounded px-4 py-3 mb-4 flex items-center gap-3">
          <CalendarClock className="w-5 h-5 text-emerald-800 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-[0.2em] text-emerald-800 uppercase font-semibold"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}>데이터 기준 시점 · DATA AS OF</div>
            <div className="text-sm text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
              <span className="font-bold">{DISCLOSURE_META.공시연도}학년도 대학정보공시</span>
              <span className="ml-2 text-xs text-stone-600">
                공공데이터포털 대학알리미 OpenAPI · {DISCLOSURE_META.수집일} 수집 · {DISCLOSURE_META.지표수}개 지표
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-700 text-emerald-50 text-sm font-bold shrink-0"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{DISCLOSURE_META.공시연도}</span>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-300 rounded px-4 py-3 mb-4 flex items-center gap-3">
          <CalendarClock className="w-5 h-5 text-amber-800 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-[0.2em] text-amber-800 uppercase font-semibold"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}>데이터 기준 시점 · DATA AS OF</div>
            <div className="text-sm text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
              {agg ? (
                <>
                  <span className="font-bold">대학 자체 업로드 자료 · 원본 {agg.files.length}개 파일</span>
                  <span className="ml-2 text-xs text-stone-600">{aggTime} AI 자동 집계 · 각 파일의 데이터 기준일을 직접 확인하세요</span>
                </>
              ) : files.length ? (
                <>
                  <span className="font-bold">{files.length}개 파일 업로드됨</span>
                  <span className="ml-2 text-xs text-stone-600">AI 자동 집계를 실행하세요</span>
                </>
              ) : (
                <span className="text-stone-500">부서별 원본 엑셀/CSV를 가공 없이 그대로 업로드하세요 — AI가 파일별로 자동 집계합니다.</span>
              )}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-amber-700 text-amber-50 text-sm font-bold shrink-0"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}>자체</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 gap-4">
        <p className="text-sm text-stone-600" style={{ fontFamily: 'IBM Plex Sans KR' }}>
          {mode === 'disclosure'
            ? <>사업계획서 본문을 <span className="text-stone-900 font-medium">대학알리미 OpenAPI {DISCLOSURE_META.공시연도} 공시 데이터</span>와 대조하여 수치 불일치를 자동 검출합니다.</>
            : <>부서별 원본 엑셀을 그대로 올리면 <span className="text-stone-900 font-medium">AI가 파일별 자동 집계(합계·평균·건수)</span> 후 사업계획서 수치와 대조합니다.</>}
        </p>
        <button
          onClick={run}
          disabled={!canRun}
          className="px-4 py-2.5 bg-rose-900 hover:bg-rose-950 disabled:bg-stone-400 text-white text-sm rounded flex items-center gap-2 shrink-0"
          style={{ fontFamily: 'IBM Plex Sans KR' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? '더블체크 중' : 'AI 수치 더블체크 실행'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 items-start">
        <div className="bg-white border border-stone-200 rounded">
          <div className="px-4 py-2.5 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-stone-700" />
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'IBM Plex Sans KR' }}>사업계획서 본문</h3>
            </div>
            <span className="text-[10px] tracking-widest text-stone-500 uppercase"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{planText.length}자</span>
          </div>
          <textarea value={planText} onChange={(e) => setPlanText(e.target.value)}
            className="w-full px-4 py-3 text-xs h-80 resize-none focus:outline-none leading-relaxed"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }} />
        </div>

        <div className="bg-white border border-stone-200 rounded">
          {mode === 'disclosure' ? (
            <>
              <div className="px-4 py-2.5 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-stone-700" />
                  <h3 className="text-sm font-semibold" style={{ fontFamily: 'IBM Plex Sans KR' }}>대학정보공시 로우데이터</h3>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-emerald-50 text-[9px] font-semibold tracking-wide"
                    style={{ fontFamily: 'IBM Plex Mono, monospace' }}>OPENAPI 연동</span>
                </div>
                <span className="text-[10px] tracking-widest text-stone-500 uppercase"
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{DISCLOSURE_META.공시연도} · {disclosureData.length}자</span>
              </div>
              <textarea value={disclosureData} onChange={(e) => setDisclosureData(e.target.value)}
                className="w-full px-4 py-3 text-xs h-80 resize-none focus:outline-none leading-relaxed"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }} />
            </>
          ) : (
            <>
              <div className="px-4 py-2.5 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-stone-700" />
                  <h3 className="text-sm font-semibold" style={{ fontFamily: 'IBM Plex Sans KR' }}>대학 자체 업로드 자료</h3>
                  <span className="px-1.5 py-0.5 rounded bg-amber-700 text-amber-50 text-[9px] font-semibold tracking-wide"
                    style={{ fontFamily: 'IBM Plex Mono, monospace' }}>RAW 다중업로드</span>
                </div>
                {agg && (
                  <span className="text-[10px] tracking-widest text-stone-500 uppercase"
                    style={{ fontFamily: 'IBM Plex Mono, monospace' }}>집계완료 · {uploadText.length}자</span>
                )}
              </div>

              <div className="p-3 space-y-2">
                {/* 업로드된 원본 파일 목록 */}
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded px-3 py-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="text-xs text-stone-800 font-medium truncate flex-1" title={f.name}>{f.name}</span>
                    <span className="text-[10px] text-stone-500" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      {f.headers.length}열 · {f.rowCount}행
                    </span>
                    <button onClick={() => removeFile(f.id)} className="text-stone-400 hover:text-rose-700" title="삭제">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* 파일 추가 (여러 개 가능) */}
                <label className="flex items-center justify-center gap-2 cursor-pointer hover:bg-stone-50 transition border-2 border-dashed border-stone-200 rounded py-3">
                  <Upload className="w-4 h-4 text-stone-400" />
                  <span className="text-xs text-stone-600" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                    {files.length ? '엑셀/CSV 파일 더 추가' : '부서별 원본 엑셀/CSV 업로드 (여러 개 선택 가능 · 가공 불필요)'}
                  </span>
                  <input type="file" accept=".xlsx,.xls,.csv" multiple onChange={handleFiles} className="hidden" />
                </label>

                {/* AI 자동 집계 */}
                {files.length > 0 && (
                  <button onClick={runAgg} disabled={aggLoading}
                    className="w-full px-3 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-stone-100 text-sm rounded flex items-center justify-center gap-2"
                    style={{ fontFamily: 'IBM Plex Sans KR' }}>
                    {aggLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : agg ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    {aggLoading ? 'AI 집계 중' : agg ? '재집계' : `AI 자동 집계 실행 (${files.length}개 파일)`}
                  </button>
                )}
                {aggError && (
                  <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded px-3 py-2"
                    style={{ fontFamily: 'IBM Plex Sans KR' }}>{aggError}</div>
                )}
              </div>

              {/* 파일별 자동 집계 결과 */}
              {agg && (
                <div className="px-3 pb-3 space-y-2">
                  {agg.files.map((o, i) => (
                    <div key={i} className="border border-stone-200 rounded p-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="text-xs font-semibold text-stone-900 truncate" title={o.name}>{o.name}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 mb-2" style={{ fontFamily: 'IBM Plex Sans KR' }}>{o.설명}</div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="bg-stone-900 text-stone-50 rounded px-2 py-1 text-[11px]"
                          style={{ fontFamily: 'IBM Plex Sans KR' }}>{o.행단위} {o.행수.toLocaleString()}건</span>
                        {o.metrics.map((m, j) => (
                          <span key={j} className={`rounded px-2 py-1 text-[11px] ${
                            m.종류 === '합계' ? 'bg-emerald-100 text-emerald-900'
                            : m.종류 === '평균' ? 'bg-amber-100 text-amber-900'
                            : 'bg-stone-100 text-stone-700'
                          }`} style={{ fontFamily: 'IBM Plex Sans KR' }}>
                            {m.지표} <span className="font-bold">{typeof m.값 === 'number' ? m.값.toLocaleString() : m.값}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 더블체크 입력 데이터 (편집 가능) */}
              {agg && (
                <>
                  <div className="px-4 py-1.5 border-t border-stone-200 bg-stone-50 text-[10px] tracking-widest text-stone-500 uppercase"
                    style={{ fontFamily: 'IBM Plex Mono, monospace' }}>더블체크 입력 데이터 (편집 가능)</div>
                  <textarea value={uploadText} onChange={(e) => setUploadText(e.target.value)}
                    className="w-full px-4 py-3 text-xs resize-none focus:outline-none leading-relaxed"
                    style={{ fontFamily: 'IBM Plex Mono, monospace', height: '12rem' }} />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-stone-200 rounded p-6">
          <Spinner label="Claude가 본문 수치와 로우데이터를 한 행씩 대조하는 중입니다" />
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded p-4 text-sm text-rose-900"
          style={{ fontFamily: 'IBM Plex Sans KR' }}>오류: {error}</div>
      )}
      {result && (
        <div className="bg-white border border-stone-200 rounded">
          <div className="px-5 py-2 bg-stone-50 border-b border-stone-200 flex items-center gap-2">
            <CalendarClock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <span className="text-[11px] text-stone-600" style={{ fontFamily: 'IBM Plex Sans KR' }}>
              대조 기준: <span className="text-stone-800 font-medium">{result._기준시점}</span>
            </span>
          </div>
          <div className="grid grid-cols-4 border-b border-stone-200">
            {[
              { label: '전체 검토', value: result.전체검토수, color: 'text-stone-900' },
              { label: '일치', value: result.일치, color: 'text-emerald-700' },
              { label: '불일치', value: result.불일치, color: 'text-rose-800' },
              { label: '검증 불가', value: result.검증불가 ?? 0, color: 'text-stone-500' },
            ].map((c, i) => (
              <div key={i} className={`px-5 py-4 ${i < 3 ? 'border-r border-stone-200' : ''}`}>
                <div className="text-[10px] tracking-widest text-stone-500 uppercase mb-1"
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{c.label}</div>
                <div className={`text-3xl ${c.color}`} style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}>{c.value}</div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-b border-stone-200">
            <p className="text-sm text-stone-800 leading-relaxed" style={{ fontFamily: 'IBM Plex Sans KR' }}>{result.총평}</p>
          </div>

          {result.이슈 && result.이슈.length > 0 ? (
            <div>
              <div className="px-5 py-2.5 bg-stone-50 border-b border-stone-200 text-[10px] tracking-widest text-stone-600 uppercase grid grid-cols-12 gap-3"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                <div className="col-span-3">위치</div>
                <div className="col-span-2">계획서</div>
                <div className="col-span-2">로우데이터</div>
                <div className="col-span-2">차이</div>
                <div className="col-span-3">권고</div>
              </div>
              <ul>
                {result.이슈.map((iss, i) => (
                  <li key={i} className="px-5 py-3 grid grid-cols-12 gap-3 text-xs border-b border-stone-100 last:border-0"
                    style={{ fontFamily: 'IBM Plex Sans KR' }}>
                    <div className="col-span-3 flex items-start gap-2">
                      <SeverityDot severity={iss.심각도} />
                      <span className="text-stone-800 font-medium leading-snug">{iss.위치}</span>
                    </div>
                    <div className="col-span-2 text-stone-900" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{iss.사업계획서값}</div>
                    <div className="col-span-2 text-stone-900" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{iss.로우데이터값}</div>
                    <div className="col-span-2 text-rose-800 font-medium">{iss.차이}</div>
                    <div className="col-span-3 text-stone-700 leading-relaxed">{iss.권고}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-stone-500" style={{ fontFamily: 'IBM Plex Sans KR' }}>
              검토된 모든 수치가 일치합니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------- 계획: 작성 보조 (신규) ----------------- */
function PlanningAssist() {
  // 공고문은 SW중심대학을 기본 예시로
  const defaultAnn = MOCK_ANNOUNCEMENTS[0].fullText;
  const [announcement, setAnnouncement] = useState(defaultAnn);

  // 1. 필수 작성 항목
  const [outline, setOutline] = useState(null);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [outlineError, setOutlineError] = useState(null);

  // 2. 섹션 초안
  const [draftSection, setDraftSection] = useState('추진배경 및 필요성');
  const [draftCustom, setDraftCustom] = useState('');
  const [draft, setDraft] = useState(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState(null);
  const [copied, setCopied] = useState(false);

  // 3. 성과지표
  const [kpi, setKpi] = useState(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiError, setKpiError] = useState(null);

  /* --- 1. 필수 작성 항목 추출 --- */
  const outlineSystem = `당신은 정부 재정지원사업 사업계획서 작성을 20년간 자문해온 전문가입니다. 공고문을 분석하여 사업계획서에 반드시 포함되어야 할 모든 섹션을 추출하고, 각 섹션에 대한 작성 가이드를 제공합니다.

원칙:
1. 평가배점이 명시된 섹션은 배점을 함께 표기
2. 분량 가이드는 공고문에 명시된 경우 그대로, 없으면 합리적 추정
3. 가장 자주 감점되는 포인트를 주의사항에 포함

JSON 스키마 (다른 텍스트 출력 금지):
{
  "사업명": "...",
  "주관기관": "...",
  "필수섹션": [
    {
      "섹션": "예: 1. 사업 비전 및 목표",
      "작성지침": "구체적인 작성 가이드 2-3문장",
      "평가배점": "예: 20점 (혁신지표)",
      "분량": "예: 2-3쪽",
      "주의사항": "이 섹션에서 자주 감점되는 부분"
    }
  ],
  "필수첨부서류": ["...", "..."],
  "전체작성팁": ["...", "...", "..."]
}`;

  async function runOutline() {
    setOutlineLoading(true); setOutlineError(null); setOutline(null);
    try {
      const raw = await callClaude(outlineSystem, `다음 공고문을 분석해 필수 작성 항목을 추출해주세요:\n\n${announcement}`);
      setOutline(extractJSON(raw));
    } catch (e) { setOutlineError(e.message); }
    finally { setOutlineLoading(false); }
  }

  /* --- 2. 섹션 초안 작성 --- */
  const draftSystem = `당신은 한성대학교 기획처 사업계획서 작성 담당자입니다. 다음 사업의 특정 섹션 초안을 작성합니다.

한성대학교 핵심 컨텍스트:
- 사립, 서울 성북구 소재, 학부중심 종합대학, IT/디자인/창의융합 특성화
- 최근 수행 사업: 대학혁신지원사업, LINC 3.0
- 정량 수치는 반드시 아래 2024 대학정보공시 실데이터(공공데이터포털 대학알리미 OpenAPI 수집)만 인용하고, 없는 수치는 지어내지 말 것:
${DISCLOSURE_RAW_DATA}

작성 원칙:
1. 공고문의 평가 항목과 직결되는 키워드를 자연스럽게 배치
2. 정량 수치는 한성대 실제 현황을 활용 (모르는 수치는 만들지 말고 [추후 확정] 표기)
3. 문장은 간결하고 능동태로, 행정 문서 톤 유지
4. 3-5단락 분량

JSON 스키마:
{
  "섹션제목": "...",
  "초안내용": "전체 초안 (단락 구분은 \\n\\n)",
  "근거데이터": ["사용된 한성대 데이터 1", "..."],
  "보강필요": ["추가 자료가 있으면 더 강해질 부분 1", "..."]
}`;

  async function runDraft() {
    const target = draftCustom.trim() || draftSection;
    setDraftLoading(true); setDraftError(null); setDraft(null);
    try {
      const raw = await callClaude(draftSystem,
        `[대상 공고문]\n${announcement}\n\n[작성할 섹션] ${target}\n\n위 섹션의 초안을 한성대 입장에서 작성해주세요.`);
      setDraft(extractJSON(raw));
    } catch (e) { setDraftError(e.message); }
    finally { setDraftLoading(false); }
  }

  /* --- 3. 성과지표 + 목표값 추천 --- */
  const kpiSystem = `당신은 대학 성과관리 전문가입니다. 공고문에 명시된 평가지표와 한성대 현황(로우데이터)을 분석하여, 한성대가 사업계획서에 제출할 자율성과지표 3-5개와 5개년 목표값을 추천합니다.

한성대 현황 — 2024 대학정보공시 실데이터 (공공데이터포털 대학알리미 OpenAPI 수집):
${DISCLOSURE_RAW_DATA}

원칙:
1. 공고문의 평가지표와 정합성을 유지하되, 한성대가 달성 가능한 도전적 목표 설정
2. 5개년 목표는 단계적 상승, 마지막 연도가 가장 도전적
3. 산출식은 명확히, 단위 명시

JSON 스키마:
{
  "추천지표": [
    {
      "지표명": "...",
      "단위": "% | 명 | 건",
      "산출식": "...",
      "현재값": "예: 2024년 공시 기준 66.8%",
      "목표값": { "1차": "...", "2차": "...", "3차": "...", "4차": "...", "5차": "..." },
      "추천근거": "왜 이 지표를 한성대에 추천하는지 1-2문장"
    }
  ],
  "전체전략": "지표 묶음의 통합 메시지 2-3문장"
}`;

  async function runKpi() {
    setKpiLoading(true); setKpiError(null); setKpi(null);
    try {
      const raw = await callClaude(kpiSystem,
        `다음 공고문의 평가지표와 한성대 현황을 분석해 추천 성과지표 및 5개년 목표값을 작성해주세요:\n\n${announcement}`);
      setKpi(extractJSON(raw));
    } catch (e) { setKpiError(e.message); }
    finally { setKpiLoading(false); }
  }

  async function copyDraft() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft.초안내용);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div>
      {/* 공고문 입력 */}
      <div className="bg-white border border-stone-200 rounded mb-6">
        <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-stone-700" />
            <h3 className="text-sm font-semibold" style={{ fontFamily: 'IBM Plex Sans KR' }}>
              대상 공고문
            </h3>
            <span className="text-xs text-stone-500" style={{ fontFamily: 'IBM Plex Sans KR' }}>
              (기본: SW중심대학)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {MOCK_ANNOUNCEMENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAnnouncement(a.fullText)}
                className="text-[11px] text-stone-600 hover:text-rose-800 underline-offset-2 hover:underline"
                style={{ fontFamily: 'IBM Plex Sans KR' }}>
                {a.title.replace(/^\d+년도?\s*/, '').slice(0, 16)}
              </button>
            )).reduce((acc, el, i, arr) => (i < arr.length - 1 ? [...acc, el, <span key={`s${i}`} className="text-stone-300">·</span>] : [...acc, el]), [])}
          </div>
        </div>
        <textarea
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          className="w-full px-4 py-3 text-xs h-40 resize-none focus:outline-none leading-relaxed"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        />
      </div>

      {/* 3개 AI 도구 */}
      <div className="space-y-6">

        {/* 1. 필수 작성 항목 */}
        <section className="bg-white border border-stone-200 rounded">
          <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <ListChecks className="w-5 h-5 text-stone-700 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                  필수 작성 항목 가이드
                </h3>
                <p className="text-xs text-stone-600 mt-0.5" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                  공고문에서 사업계획서 필수 섹션과 작성 지침, 평가 배점 매칭을 추출합니다.
                </p>
              </div>
            </div>
            <button onClick={runOutline} disabled={outlineLoading || !announcement.trim()}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-stone-100 text-sm rounded flex items-center gap-2"
              style={{ fontFamily: 'IBM Plex Sans KR' }}>
              {outlineLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {outlineLoading ? '추출 중' : outline ? '재추출' : '필수 항목 추출'}
            </button>
          </div>
          {outlineLoading && <div className="p-5"><Spinner label="Claude가 공고문 평가표를 분석하는 중입니다" /></div>}
          {outlineError && <div className="m-4 bg-rose-50 border border-rose-200 rounded p-3 text-sm text-rose-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>오류: {outlineError}</div>}
          {outline && (
            <div className="p-5">
              <div className="mb-4 pb-4 border-b border-stone-100">
                <div className="text-[10px] tracking-widest text-stone-500 uppercase mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  대상 사업
                </div>
                <div className="text-stone-900 font-medium" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                  {outline.사업명} <span className="text-stone-500 text-sm">· {outline.주관기관}</span>
                </div>
              </div>

              <div className="text-[10px] tracking-widest text-stone-500 uppercase mb-3" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                필수 섹션 ({(outline.필수섹션 || []).length}개)
              </div>
              <div className="space-y-3 mb-6">
                {(outline.필수섹션 || []).map((s, i) => (
                  <div key={i} className="border border-stone-200 rounded p-4 hover:border-stone-400 transition">
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <h4 className="text-sm font-semibold text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                        {s.섹션}
                      </h4>
                      <div className="flex items-center gap-3 text-xs shrink-0">
                        {s.평가배점 && (
                          <span className="text-rose-800 font-medium" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                            {s.평가배점}
                          </span>
                        )}
                        {s.분량 && (
                          <span className="text-stone-500" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                            {s.분량}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-stone-700 leading-relaxed mb-2" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                      {s.작성지침}
                    </p>
                    {s.주의사항 && (
                      <div className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded mt-2 flex items-start gap-1.5" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{s.주의사항}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {outline.필수첨부서류 && outline.필수첨부서류.length > 0 && (
                  <div>
                    <div className="text-[10px] tracking-widest text-stone-500 uppercase mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      필수 첨부서류
                    </div>
                    <ul className="text-sm text-stone-700 space-y-1" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                      {outline.필수첨부서류.map((d, i) => <li key={i} className="flex gap-2"><span className="text-stone-400">·</span>{d}</li>)}
                    </ul>
                  </div>
                )}
                {outline.전체작성팁 && outline.전체작성팁.length > 0 && (
                  <div>
                    <div className="text-[10px] tracking-widest text-rose-900 uppercase mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      작성 팁
                    </div>
                    <ul className="text-sm text-stone-700 space-y-1" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                      {outline.전체작성팁.map((t, i) => <li key={i} className="flex gap-2"><span className="text-rose-700">→</span>{t}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* 2. 섹션 초안 작성 */}
        <section className="bg-white border border-stone-200 rounded">
          <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <PenTool className="w-5 h-5 text-stone-700 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                  섹션 초안 작성
                </h3>
                <p className="text-xs text-stone-600 mt-0.5" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                  한성대 현황을 반영한 사업계획서 섹션 초안을 작성합니다.
                </p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <select
                value={draftSection}
                onChange={(e) => { setDraftSection(e.target.value); setDraftCustom(''); }}
                className="px-3 py-2 border border-stone-300 rounded text-sm bg-white focus:outline-none focus:border-stone-700"
                style={{ fontFamily: 'IBM Plex Sans KR' }}>
                {[
                  '추진배경 및 필요성',
                  '사업 비전 및 목표',
                  '지역 현황 분석 (SWOT)',
                  '단위과제 선정 및 RISE 사업 연계성',
                  '사업 추진체계 (조직도·역할분담)',
                  '사업단장 역량 및 운영계획',
                  '성과확산 계획',
                  '예산편성 및 집행계획 (요약)',
                ].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-xs text-stone-500" style={{ fontFamily: 'IBM Plex Sans KR' }}>또는</span>
              <input
                value={draftCustom}
                onChange={(e) => setDraftCustom(e.target.value)}
                placeholder="직접 섹션명 입력..."
                className="flex-1 px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:border-stone-700"
                style={{ fontFamily: 'IBM Plex Sans KR' }}
              />
              <button onClick={runDraft} disabled={draftLoading || !announcement.trim()}
                className="px-4 py-2 bg-rose-900 hover:bg-rose-950 disabled:bg-stone-400 text-white text-sm rounded flex items-center gap-2"
                style={{ fontFamily: 'IBM Plex Sans KR' }}>
                {draftLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {draftLoading ? '작성 중' : '초안 작성'}
              </button>
            </div>

            {draftLoading && <Spinner label="Claude가 한성대 컨텍스트로 초안을 작성하는 중입니다" />}
            {draftError && <div className="bg-rose-50 border border-rose-200 rounded p-3 text-sm text-rose-900 mt-2" style={{ fontFamily: 'IBM Plex Sans KR' }}>오류: {draftError}</div>}
            {draft && (
              <div className="mt-2">
                <div className="bg-stone-50 border border-stone-200 rounded p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                      {draft.섹션제목}
                    </span>
                    <button onClick={copyDraft} className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1"
                      style={{ fontFamily: 'IBM Plex Sans KR' }}>
                      {copied ? <><Check className="w-3 h-3" /> 복사됨</> : <><Copy className="w-3 h-3" /> 복사</>}
                    </button>
                  </div>
                  <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap"
                    style={{ fontFamily: 'IBM Plex Sans KR' }}>
                    {draft.초안내용}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {draft.근거데이터 && draft.근거데이터.length > 0 && (
                    <div>
                      <div className="text-[10px] tracking-widest text-emerald-800 uppercase mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                        사용된 데이터
                      </div>
                      <ul className="text-xs text-stone-700 space-y-0.5" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                        {draft.근거데이터.map((d, i) => <li key={i}>· {d}</li>)}
                      </ul>
                    </div>
                  )}
                  {draft.보강필요 && draft.보강필요.length > 0 && (
                    <div>
                      <div className="text-[10px] tracking-widest text-amber-800 uppercase mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                        보강이 필요한 부분
                      </div>
                      <ul className="text-xs text-stone-700 space-y-0.5" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                        {draft.보강필요.map((d, i) => <li key={i}>· {d}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. 성과지표 + 목표값 */}
        <section className="bg-white border border-stone-200 rounded">
          <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-stone-700 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                  성과지표 · 5개년 목표값 추천
                </h3>
                <p className="text-xs text-stone-600 mt-0.5" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                  공고문의 평가지표와 한성대 현황을 분석해 자율지표와 도전적 목표값을 제안합니다.
                </p>
              </div>
            </div>
            <button onClick={runKpi} disabled={kpiLoading || !announcement.trim()}
              className="px-4 py-2 bg-rose-900 hover:bg-rose-950 disabled:bg-stone-400 text-white text-sm rounded flex items-center gap-2"
              style={{ fontFamily: 'IBM Plex Sans KR' }}>
              {kpiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {kpiLoading ? '분석 중' : kpi ? '재추천' : '지표 추천'}
            </button>
          </div>
          {kpiLoading && <div className="p-5"><Spinner label="Claude가 공고문 평가지표와 한성대 현황을 매칭하는 중입니다" /></div>}
          {kpiError && <div className="m-4 bg-rose-50 border border-rose-200 rounded p-3 text-sm text-rose-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>오류: {kpiError}</div>}
          {kpi && (
            <div className="p-5">
              {kpi.전체전략 && (
                <div className="bg-stone-900 text-stone-100 rounded p-3 mb-4 text-sm leading-relaxed"
                  style={{ fontFamily: 'IBM Plex Sans KR' }}>
                  <span className="text-[10px] tracking-widest text-amber-300 uppercase block mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    전체 전략
                  </span>
                  {kpi.전체전략}
                </div>
              )}
              <div className="space-y-4">
                {(kpi.추천지표 || []).map((ind, i) => (
                  <div key={i} className="border border-stone-200 rounded overflow-hidden">
                    <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] text-stone-500" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>지표 {i + 1}</span>
                        <h4 className="text-sm font-semibold text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>{ind.지표명}</h4>
                        <span className="text-xs text-stone-500" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>({ind.단위})</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 grid grid-cols-7 gap-2 text-center border-b border-stone-100">
                      <div className="text-xs">
                        <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>현재</div>
                        <div className="text-stone-700 font-medium" style={{ fontFamily: 'IBM Plex Sans KR' }}>{ind.현재값}</div>
                      </div>
                      {['1차', '2차', '3차', '4차', '5차'].map((y) => (
                        <div key={y} className="text-xs">
                          <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{y}년차</div>
                          <div className="text-stone-900 font-medium" style={{ fontFamily: 'Fraunces, serif' }}>
                            {ind.목표값?.[y] || '-'}
                          </div>
                        </div>
                      ))}
                      <div className="text-xs">
                        <div className="text-[10px] text-rose-900 uppercase tracking-widest mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>최종 도달</div>
                        <div className="text-rose-800 font-semibold" style={{ fontFamily: 'Fraunces, serif' }}>
                          {ind.목표값?.['5차'] || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 text-xs grid grid-cols-2 gap-3" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                      <div>
                        <span className="text-stone-500 mr-1">산출식:</span>
                        <span className="text-stone-800" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{ind.산출식}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 mr-1">추천 근거:</span>
                        <span className="text-stone-700">{ind.추천근거}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ==================== 운영 (Operations) - 사업계획서 분석 기반 ==================== */
function OperationsView({ texts, setTexts, adminMode }) {
  const [submittedPlan, setSubmittedPlan] = useState(SAMPLE_PLAN_TEXT);
  const [planExpanded, setPlanExpanded] = useState(false);

  const [checklist, setChecklist] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState(null);

  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  const checklistSystem = `당신은 대학 재정지원사업 운영관리 전문가입니다. 선정된 사업의 사업계획서(이미 제출되어 협약된 문서)를 분석하여, 대학이 사업기간 동안 의무적으로 수행해야 할 모든 활동을 빠짐없이 추출합니다.

추출 대상:
- 위원회 개최 일정 (운영위원회, 자문위원회, 외부평가위원회 등)
- 보고서 제출 일정 (월간/분기/연차/중간/최종 보고)
- 평가 일정 (자체평가, 중간평가, 종합평가)
- 성과지표 측정/제출 시점
- 사업계획서에 명시된 모든 정기 활동

원칙:
- "분기별 1회", "월 1회" 등 주기적 의무는 모든 발생 시점으로 펼쳐 표기 (분기별 = 3,6,9,12월)
- 사업계획서에 명시되지 않은 항목은 절대 생성하지 말 것
- 우선순위는 평가 영향도 기준 ('높음' = 평가에 직접 반영)

JSON 스키마:
{
  "사업명": "...",
  "추출요약": "사업계획서에서 N개 의무사항을 추출했습니다.",
  "월별타임라인": [
    {
      "월": "2026-09",
      "항목": [
        {
          "제목": "...",
          "유형": "위원회" | "보고" | "평가" | "성과제출" | "기타",
          "우선순위": "높음" | "중간" | "낮음",
          "출처": "사업계획서 내 위치 (예: 3. 운영체계)",
          "설명": "..."
        }
      ]
    }
  ],
  "전체개수": <int>,
  "리스크": ["사업계획서에서 일정이 명확하지 않은 항목 등"]
}`;

  const reportSystem = `당신은 대학 경영 컨설턴트로, 정부 재정지원사업 평가에 대비한 전략 자문 보고서를 작성합니다. 6영역 성과 데이터를 분석하여, 정량 수치는 코드가 계산하였음을 전제로 정성적 해석과 다음 분기 개선 대책을 제안합니다.

JSON 스키마:
{
  "총평": "1-2문장",
  "강점영역": ["...", "..."],
  "위기영역": ["...", "..."],
  "다음분기집중영역": "...",
  "개선대책": [
    {
      "영역": "...",
      "우선순위": "높음" | "중간" | "낮음",
      "대책": "구체적 액션 1-2문장",
      "기대효과": "...",
      "실행기간": "예: 1-3개월"
    }
  ]
}`;

  async function runChecklist() {
    setCheckLoading(true); setCheckError(null); setChecklist(null);
    try {
      const raw = await callClaude(checklistSystem,
        `다음은 한성대학교가 제출하여 선정된 사업계획서입니다. 이 문서에 명시된 의무사항을 빠짐없이 추출해 월별 타임라인으로 정리해주세요:\n\n${submittedPlan}`);
      setChecklist(extractJSON(raw));
    } catch (e) { setCheckError(e.message); }
    finally { setCheckLoading(false); }
  }

  async function runReport() {
    setReportLoading(true); setReportError(null); setReport(null);
    try {
      const perfText = PERFORMANCE_AREAS
        .map((a) => `- ${a.area}: ${a.current}점 (전년 ${a.prev}점 → ${a.change > 0 ? '+' : ''}${a.change}%, 목표 ${a.target}점)\n  · 근거 공시지표: ${(a.근거 || []).join(' / ')}`)
        .join('\n');
      const raw = await callClaude(reportSystem,
        `한성대학교의 이번 분기 6영역 성과 데이터(코드 계산 결과)와 ${DISCLOSURE_META.공시연도} 대학정보공시 실데이터(공공데이터포털 대학알리미 OpenAPI 수집)를 토대로 컨설팅 리포트를 작성해주세요. 개선 대책은 각 영역의 근거 공시지표 실제 수치를 인용하여 구체적으로 제시하세요.\n\n${perfText}`);
      setReport(extractJSON(raw));
    } catch (e) { setReportError(e.message); }
    finally { setReportLoading(false); }
  }

  const typeColors = {
    위원회: 'bg-stone-900 text-stone-50',
    보고: 'bg-rose-900 text-rose-50',
    평가: 'bg-amber-800 text-amber-50',
    성과제출: 'bg-emerald-900 text-emerald-50',
    기타: 'bg-stone-300 text-stone-800',
  };

  return (
    <div>
      <PageHeader pageKey="operations" texts={texts} setTexts={setTexts} adminMode={adminMode} />

      {/* 사업 컨텍스트 카드 */}
      <div className="bg-stone-900 text-stone-100 rounded p-4 mb-6 grid grid-cols-4 gap-4">
        {Object.entries(MOCK_SELECTED_PROJECT).map(([k, v]) => (
          <div key={k}>
            <div className="text-[10px] tracking-widest text-stone-400 uppercase mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{k}</div>
            <div className="text-sm text-stone-100" style={{ fontFamily: 'IBM Plex Sans KR' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* 1) 제출된 사업계획서 입력 + 체크리스트 */}
      <section className="bg-white border border-stone-200 rounded mb-6">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <ScrollText className="w-5 h-5 text-stone-700 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                제출된 사업계획서
              </h3>
              <p className="text-xs text-stone-600 mt-0.5" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                Claude가 이 문서를 분석하여 의무사항·일정만 추출합니다 (없는 내용은 만들지 않음).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-widest text-stone-500 uppercase" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {submittedPlan.length}자
            </span>
            <button onClick={() => setPlanExpanded(!planExpanded)}
              className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1"
              style={{ fontFamily: 'IBM Plex Sans KR' }}>
              {planExpanded ? '접기' : '펼쳐서 편집'}
              <ChevronDown className={`w-3 h-3 transition ${planExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        <textarea
          value={submittedPlan}
          onChange={(e) => setSubmittedPlan(e.target.value)}
          className="w-full px-4 py-3 text-xs resize-none focus:outline-none leading-relaxed transition-all"
          style={{ fontFamily: 'IBM Plex Mono, monospace', height: planExpanded ? '24rem' : '8rem' }}
        />
        <div className="px-5 py-3 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
          <p className="text-xs text-stone-600" style={{ fontFamily: 'IBM Plex Sans KR' }}>
            위 사업계획서에서 위원회·보고·평가·성과제출 일정을 자동 추출합니다.
          </p>
          <button onClick={runChecklist} disabled={checkLoading || !submittedPlan.trim()}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-stone-100 text-sm rounded flex items-center gap-2"
            style={{ fontFamily: 'IBM Plex Sans KR' }}>
            {checkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : checklist ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {checkLoading ? '추출 중' : checklist ? '재분석' : '사업계획서 분석 → 체크리스트'}
          </button>
        </div>
      </section>

      {/* 체크리스트 결과 */}
      <section className="bg-white border border-stone-200 rounded mb-6">
        <div className="px-5 py-3 border-b border-stone-200 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-stone-700" />
          <h3 className="text-sm font-semibold text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
            연간 의무사항 체크리스트
          </h3>
          {checklist && (
            <span className="ml-auto text-[10px] tracking-widest text-emerald-800 uppercase" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              from 사업계획서
            </span>
          )}
        </div>

        <div className="p-5">
          {checkLoading && <Spinner label="Claude가 사업계획서에서 의무사항·마일스톤을 추출하는 중입니다" />}
          {checkError && (
            <div className="bg-rose-50 border border-rose-200 rounded p-3 text-sm text-rose-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>오류: {checkError}</div>
          )}
          {!checklist && !checkLoading && !checkError && (
            <div className="text-center py-12 text-sm text-stone-500" style={{ fontFamily: 'IBM Plex Sans KR' }}>
              위의 「사업계획서 분석」 버튼을 눌러 의무사항을 추출하세요.
            </div>
          )}

          {checklist && (
            <>
              <div className="mb-4 flex items-center gap-4 text-xs text-stone-600" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                <span>총 <strong className="text-stone-900 text-base" style={{ fontFamily: 'Fraunces, serif' }}>{checklist.전체개수}</strong>개 의무사항</span>
                <span className="text-stone-500">|</span>
                <span className="text-stone-700">{checklist.추출요약}</span>
              </div>

              <div className="space-y-4">
                {(checklist.월별타임라인 || []).map((m, i) => (
                  <div key={i} className="border-l-2 border-stone-300 pl-4">
                    <div className="text-xs tracking-widest text-stone-500 uppercase mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                      {m.월}
                    </div>
                    <ul className="space-y-2">
                      {(m.항목 || []).map((it, j) => (
                        <li key={j} className="flex items-start gap-3 bg-stone-50 rounded px-3 py-2.5">
                          <input type="checkbox" className="mt-1 accent-rose-900" />
                          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide ${typeColors[it.유형] || typeColors.기타}`}
                            style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                            {it.유형}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-sm text-stone-900 font-medium" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                                {it.제목}
                              </span>
                              {it.우선순위 === '높음' && <span className="text-[10px] text-rose-700">● 핵심</span>}
                              {it.출처 && (
                                <span className="text-[10px] text-stone-500" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                                  ← {it.출처}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-600 mt-0.5" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                              {it.설명}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {checklist.리스크 && checklist.리스크.length > 0 && (
                <div className="mt-5 bg-amber-50 border-l-2 border-amber-700 p-4">
                  <div className="text-[10px] tracking-widest text-amber-800 uppercase mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    사업계획서에서 일정이 불명확한 항목
                  </div>
                  <ul className="space-y-1 text-sm text-stone-800" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                    {checklist.리스크.map((r, i) => <li key={i}>• {r}</li>)}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 2) 6영역 성과 + AI 컨설팅 */}
      <section className="bg-white border border-stone-200 rounded">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-stone-700 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-stone-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                6영역 성과 · AI 컨설팅
              </h3>
              <p className="text-xs text-stone-600 mt-0.5" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                지수는 코드가 계산, 정성적 해석·대책은 Claude가 작성합니다 · 근거: {DISCLOSURE_META.공시연도} 대학정보공시 실데이터(OpenAPI).
              </p>
            </div>
          </div>
          <button onClick={runReport} disabled={reportLoading}
            className="px-4 py-2 bg-rose-900 hover:bg-rose-950 disabled:bg-stone-400 text-white text-sm rounded flex items-center gap-2"
            style={{ fontFamily: 'IBM Plex Sans KR' }}>
            {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {reportLoading ? '리포트 작성 중' : report ? '재생성' : 'AI 컨설팅 리포트 생성'}
          </button>
        </div>

        <div className="grid grid-cols-5 gap-0">
          <div className="col-span-3 p-5 border-r border-stone-200">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {PERFORMANCE_AREAS.map((a) => (
                <div key={a.area} className="bg-stone-50 rounded px-3 py-2.5">
                  <div className="text-[10px] tracking-widest text-stone-500 uppercase" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{a.area}</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl text-stone-900" style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}>{a.current}</span>
                    <span className={`text-xs flex items-center gap-0.5 ${a.change > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {a.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {a.change > 0 ? '+' : ''}{a.change}%
                    </span>
                  </div>
                  {a.근거 && (
                    <ul className="mt-1.5 pt-1.5 border-t border-stone-200 space-y-0.5">
                      {a.근거.map((g, i) => (
                        <li key={i} className="text-[10px] text-stone-500 leading-tight truncate"
                          style={{ fontFamily: 'IBM Plex Sans KR' }} title={g}>· {g}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PERFORMANCE_AREAS} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid stroke="#e7e5e4" vertical={false} />
                  <XAxis dataKey="area" tick={{ fontSize: 11, fill: '#44403c', fontFamily: 'IBM Plex Sans KR' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, fontFamily: 'IBM Plex Sans KR' }} />
                  <Bar dataKey="prev"    fill="#d6d3d1" name="전년" />
                  <Bar dataKey="current" fill="#881337" name="현재" />
                  <Bar dataKey="target"  fill="#1c1917" name="목표" opacity={0.3} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-2 p-5">
            {reportLoading && <Spinner label="Claude가 6영역 추세를 분석하는 중입니다" />}
            {reportError && (
              <div className="bg-rose-50 border border-rose-200 rounded p-3 text-sm text-rose-900" style={{ fontFamily: 'IBM Plex Sans KR' }}>오류: {reportError}</div>
            )}
            {!report && !reportLoading && !reportError && (
              <div className="text-center pt-12 text-sm text-stone-500" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                「AI 컨설팅 리포트 생성」을 클릭하면<br />정성적 분석과 개선 대책이 표시됩니다.
              </div>
            )}
            {report && (
              <div className="space-y-4 text-sm" style={{ fontFamily: 'IBM Plex Sans KR' }}>
                <div>
                  <div className="text-[10px] tracking-widest text-rose-900 uppercase mb-1.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>총평</div>
                  <p className="text-stone-900 font-medium leading-relaxed">{report.총평}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] tracking-widest text-emerald-800 uppercase mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>강점</div>
                    <ul className="text-xs text-stone-700 space-y-0.5">
                      {(report.강점영역 || []).map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-widest text-rose-800 uppercase mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>위기</div>
                    <ul className="text-xs text-stone-700 space-y-0.5">
                      {(report.위기영역 || []).map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="bg-stone-900 text-stone-100 rounded p-3">
                  <div className="text-[10px] tracking-widest text-stone-400 uppercase mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>다음 분기 집중 영역</div>
                  <div className="text-base font-semibold">{report.다음분기집중영역}</div>
                </div>
                <div>
                  <div className="text-[10px] tracking-widest text-stone-500 uppercase mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>개선 대책</div>
                  <ul className="space-y-2.5">
                    {(report.개선대책 || []).map((c, i) => (
                      <li key={i} className="border-l-2 border-stone-300 pl-3">
                        <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                          <span className="text-stone-900 text-sm font-medium">{c.영역}</span>
                          <span className={`text-[10px] ${c.우선순위 === '높음' ? 'text-rose-700' : c.우선순위 === '중간' ? 'text-amber-700' : 'text-stone-500'}`}>
                            {c.우선순위}
                          </span>
                          <span className="text-[10px] text-stone-500" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                            {c.실행기간}
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 leading-relaxed">{c.대책}</p>
                        <p className="text-[11px] text-emerald-800 mt-0.5">→ {c.기대효과}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ==================== 메인 앱 ==================== */
export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [adminMode, setAdminMode] = useState(false);
  const [texts, setTexts] = useState(DEFAULT_TEXTS);
  const [authOpen, setAuthOpen] = useState(false);

  // 관리자 모드 잠금/해제 — 해제 시 비밀번호 모달, 잠글 땐 즉시 잠금
  function handleLockToggle() {
    if (adminMode) {
      setAdminMode(false);
      setAIPassword('');
    } else {
      setAuthOpen(true);
    }
  }

  function handleAuthSuccess(pw) {
    setAIPassword(pw);   // AI 호출에 쓰일 비밀번호 보관
    setAdminMode(true);
    setAuthOpen(false);
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F5F1E8' }}>
      <style>{FONT_LINK}</style>

      <Sidebar tab={tab} setTab={setTab} adminMode={adminMode} onLockToggle={handleLockToggle} />

      <main className="flex-1 overflow-auto">
        <div className="max-w-[1280px] mx-auto px-10 py-10">
          {tab === 'dashboard'  && <DashboardView  goTab={setTab} texts={texts} setTexts={setTexts} adminMode={adminMode} />}
          {tab === 'discovery'  && <DiscoveryView  texts={texts} setTexts={setTexts} adminMode={adminMode} />}
          {tab === 'planning'   && <PlanningView   texts={texts} setTexts={setTexts} adminMode={adminMode} />}
          {tab === 'operations' && <OperationsView texts={texts} setTexts={setTexts} adminMode={adminMode} />}
        </div>
      </main>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={handleAuthSuccess} />}
    </div>
  );
}
