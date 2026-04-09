export interface Team {
  id: number;
  name: string;
  grade: number | null;
  classNumber: number | null;
  category?: string;
  pointsAdjustment?: number;
}

export interface Match {
  id: number;
  sport: string;
  day: string;
  matchDate?: string | null;
  timeSlot: string;
  teamA?: Team;
  teamAId: number;
  teamB?: Team;
  teamBId: number;
  scoreA: number;
  scoreB: number;
  status: 'SCHEDULED' | 'LIVE' | 'DONE';
  result?: string;
  category: string;
  youtubeUrl?: string | null;
  setsJson?: string | null;
  quarterCount?: number | null;
  quarterMinutes?: number | null;
  currentQuarter?: number | null;
  quarterStartedAt?: string | null;
  bracketStage?: string | null;
}

export interface RankingEntry {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  recentForm: { result: 'W' | 'D' | 'L'; opponent: string; score: string }[];
}

// 빅발리볼·배드민턴은 점수 합계 대신 세트 스코어로 표시한다.
// 공용 구현은 lib/matchScore.ts. 여기서는 하위호환 래퍼만 유지한다.
export interface Match_ForDisplay extends Match {}
export function displayScore(m: Match): { a: number; b: number } {
  // 동적 임포트 대신 로컬 복사로 순환 참조를 피한다.
  const sport = m.sport;
  const isVolleyball = sport === 'BIG_VOLLEYBALL' || sport === '빅발리볼';
  const isBadminton = sport === 'BADMINTON' || sport === '배드민턴';
  if (!isVolleyball && !isBadminton) return { a: m.scoreA, b: m.scoreB };
  if (!m.setsJson) return { a: 0, b: 0 };
  try {
    const sets = JSON.parse(m.setsJson) as { a: number; b: number }[];
    let aw = 0;
    let bw = 0;
    const complete = (a: number, b: number): boolean => {
      if (isVolleyball) {
        if (a >= 25 && a - b >= 2) return true;
        if (b >= 25 && b - a >= 2) return true;
        return false;
      }
      // 배드민턴
      if (a >= 30 || b >= 30) return true;
      if (a >= 21 && a - b >= 2) return true;
      if (b >= 21 && b - a >= 2) return true;
      return false;
    };
    for (const s of sets) {
      if (!complete(s.a, s.b)) continue;
      if (s.a > s.b) aw += 1;
      else if (s.b > s.a) bw += 1;
    }
    return { a: aw, b: bw };
  } catch {
    return { a: 0, b: 0 };
  }
}

export interface ScoreLog {
  id: number;
  matchId: number;
  team: string;
  delta: number;
  scoreA: number;
  scoreB: number;
  timestamp: string;
}
