export interface Team {
  id: number;
  name: string;
  grade: number | null;
  classNumber: number | null;
  category?: string;
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

// 빅발리볼은 점수 합계 대신 세트 스코어로 표시한다.
export function displayScore(m: Match): { a: number; b: number } {
  if (m.sport === 'BIG_VOLLEYBALL' && m.setsJson) {
    try {
      const sets = JSON.parse(m.setsJson) as { a: number; b: number }[];
      let aw = 0;
      let bw = 0;
      const SET_TARGET = 25;
      for (const s of sets) {
        if (s.a >= SET_TARGET && s.a > s.b) aw += 1;
        else if (s.b >= SET_TARGET && s.b > s.a) bw += 1;
      }
      return { a: aw, b: bw };
    } catch {
      /* fall through */
    }
  }
  return { a: m.scoreA, b: m.scoreB };
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
