import type { Match } from '@/types';

// 종목 키 정규화: 프론트는 한국어, 시드는 영문 상수가 섞여 있다.
function isVolleyball(sport: string): boolean {
  return sport === 'BIG_VOLLEYBALL' || sport === '빅발리볼';
}
function isBadminton(sport: string): boolean {
  return sport === 'BADMINTON' || sport === '배드민턴';
}
export function isSetBasedSport(sport: string): boolean {
  return isVolleyball(sport) || isBadminton(sport);
}
export function isQuarterSport(sport: string): boolean {
  return (
    sport === 'BASKETBALL' ||
    sport === '농구' ||
    sport === 'FUTSAL' ||
    sport === '풋살'
  );
}

// 세트 완료 판정: 듀스 규칙 포함.
export function isSetComplete(sport: string, a: number, b: number): boolean {
  if (isVolleyball(sport)) {
    if (a >= 25 && a - b >= 2) return true;
    if (b >= 25 && b - a >= 2) return true;
    return false;
  }
  if (isBadminton(sport)) {
    if (a >= 30 || b >= 30) return true;
    if (a >= 21 && a - b >= 2) return true;
    if (b >= 21 && b - a >= 2) return true;
    return false;
  }
  return false;
}

export function computeSetWins(
  sport: string,
  setsJson: string | null | undefined,
): { a: number; b: number } {
  if (!setsJson) return { a: 0, b: 0 };
  try {
    const sets = JSON.parse(setsJson) as { a: number; b: number }[];
    let aw = 0;
    let bw = 0;
    for (const s of sets) {
      if (!isSetComplete(sport, s.a, s.b)) continue;
      if (s.a > s.b) aw += 1;
      else if (s.b > s.a) bw += 1;
    }
    return { a: aw, b: bw };
  } catch {
    return { a: 0, b: 0 };
  }
}

// 매치 스코어 렌더링 문자열. 세트 종목은 세트 수, 그 외는 원점수.
export function formatMatchScore(match: Match): string {
  if (isSetBasedSport(match.sport)) {
    const w = computeSetWins(match.sport, match.setsJson);
    return `${w.a}:${w.b}`;
  }
  return `${match.scoreA}:${match.scoreB}`;
}

// 매치 스코어를 구조체로. 숫자 렌더가 필요한 곳에서 사용.
export function getMatchScorePair(match: Match): { a: number; b: number } {
  if (isSetBasedSport(match.sport)) {
    return computeSetWins(match.sport, match.setsJson);
  }
  return { a: match.scoreA, b: match.scoreB };
}
