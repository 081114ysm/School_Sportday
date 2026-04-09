import { Match, Team } from '@/types';
import {
  SPORT_RULES,
  MULTI_SET_SPORTS,
  WOMENS_UNION_A,
  WOMENS_UNION_B,
} from './adminConstants';

// 팀 필터: 종목 규칙에 맞는 팀만 반환.
// 여자연합 AC/BD는 빅발리볼·피구에서만 노출한다.
export function filterTeamsForSport(teams: Team[], sport: string): Team[] {
  const rule = SPORT_RULES[sport] ?? {};
  const hasGradeFilter = Array.isArray(rule.grades) && rule.grades.length > 0;
  const womensAllowed = sport === '빅발리볼' || sport === '피구';
  return teams.filter(t => {
    const isWomens = t.name === WOMENS_UNION_A || t.name === WOMENS_UNION_B;
    if (isWomens) return womensAllowed;
    const isClub = t.category === 'CLUB' || t.grade == null;
    if (isClub) return rule.allowClub === true;
    if (!hasGradeFilter) return true;
    return rule.grades!.includes(t.grade as number);
  });
}

// 종목 제한 설명 레이블
export function sportRestrictionLabel(sport: string): string {
  const rule = SPORT_RULES[sport] ?? {};
  const parts: string[] = [];
  if (rule.grades?.length) parts.push(rule.grades.map(g => `${g}학년`).join('·'));
  if (rule.allowClub) parts.push('연합');
  return parts.join(' / ');
}

// 시간 슬롯 레이블
export function slotLabel(slot: string): string {
  if (slot === 'LUNCH') return '점심 12:50';
  if (slot === 'DINNER') return '저녁 18:30';
  return slot;
}

// 멀티 세트 종목 여부
export function isMultiSet(sport: string): boolean {
  return MULTI_SET_SPORTS.has(sport);
}

// setsJson 파싱
export function parseSets(setsJson: string | null | undefined): Array<{ a: number; b: number }> {
  let arr: Array<{ a: number; b: number }> = [];
  if (setsJson) {
    try {
      const parsed = JSON.parse(setsJson);
      if (Array.isArray(parsed)) arr = parsed;
    } catch {
      /* ignore */
    }
  }
  while (arr.length < 3) arr.push({ a: 0, b: 0 });
  return arr.slice(0, 3);
}

// 오늘 날짜 YYYY-MM-DD
export function todayYmd(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'];

// 날짜 문자열에서 한국어 요일 반환
export function dayLabelFromDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return KO_DOW[new Date(y, m - 1, d).getDay()];
}

// LIVE 상태가 우선. 아니면 matchDate와 오늘을 비교한다. matchDate 없으면 저장된 상태 유지.
export function effectiveStatus(match: Match): 'LIVE' | 'DONE' | 'SCHEDULED' {
  if (match.status === 'LIVE') return 'LIVE';
  if (!match.matchDate) return (match.status as 'DONE' | 'SCHEDULED') ?? 'SCHEDULED';
  const today = todayYmd();
  if (match.matchDate < today) return 'DONE';
  if (match.matchDate > today) return 'SCHEDULED';
  return (match.status as 'DONE' | 'SCHEDULED') ?? 'SCHEDULED';
}
