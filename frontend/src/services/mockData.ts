import type { Match, RankingEntry, Team } from '@/types';

export const MOCK_YOUTUBE_URL = 'https://www.youtube.com/watch?v=RMgR8VAt0uY&t=2s';

const gradeTeams: Team[] = Array.from({ length: 12 }, (_, index) => {
  const grade = Math.floor(index / 4) + 1;
  const classNumber = (index % 4) + 1;
  return {
    id: index + 1,
    name: `${grade}학년 ${classNumber}반`,
    grade,
    classNumber,
    category: 'GRADE',
  };
});

const clubTeams: Team[] = ['A팀', 'B팀', 'C팀', 'D팀', '여자연합 AC', '여자연합 BD'].map((name, index) => ({
  id: 20 + index,
  name,
  grade: null,
  classNumber: null,
  category: 'CLUB',
}));

export const MOCK_TEAMS: Team[] = [...gradeTeams, ...clubTeams];

function dateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const today = new Date();
const todayYmd = dateString(today);
const todayDay = ['일', '월', '화', '수', '목', '금', '토'][today.getDay()];
const friday = new Date(today);
friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7));
const fridayYmd = dateString(friday);

function getTeam(id: number): Team {
  return MOCK_TEAMS.find((team) => team.id === id)!;
}

function match(
  id: number,
  sport: string,
  day: string,
  matchDate: string,
  timeSlot: string,
  teamAId: number,
  teamBId: number,
  scoreA: number,
  scoreB: number,
  status: Match['status'],
  options: Partial<Match> = {},
): Match {
  return {
    id, sport, day, matchDate, timeSlot, teamAId, teamBId,
    teamA: getTeam(teamAId), teamB: getTeam(teamBId), scoreA, scoreB,
    status, category: teamAId >= 20 ? 'CLUB' : 'GRADE', ...options,
  };
}

export const MOCK_MATCHES: Match[] = [
  // 오늘 화면에서 확인할 수 있는 라이브 경기와 예정 경기
  match(1001, '농구', todayDay, todayYmd, 'LUNCH', 5, 6, 18, 16, 'LIVE', { youtubeUrl: MOCK_YOUTUBE_URL, quarterCount: 4, currentQuarter: 2 }),
  match(1002, '축구', todayDay, todayYmd, 'DINNER', 7, 8, 0, 0, 'SCHEDULED'),
  match(1003, '배드민턴', todayDay, todayYmd, 'DINNER', 20, 21, 0, 0, 'SCHEDULED', { category: 'CLUB', youtubeUrl: MOCK_YOUTUBE_URL, setsJson: '[{"a":0,"b":0},{"a":0,"b":0},{"a":0,"b":0}]' }),

  // 1학년 피구 토너먼트
  match(1010, '피구', '금', fridayYmd, 'LUNCH', 1, 2, 2, 1, 'DONE', { result: '1학년 1반 승', bracketStage: 'SEMI1' }),
  match(1011, '피구', '금', fridayYmd, 'LUNCH', 3, 4, 1, 2, 'DONE', { result: '1학년 4반 승', bracketStage: 'SEMI2' }),
  match(1012, '피구', '금', fridayYmd, 'LUNCH', 2, 3, 0, 0, 'SCHEDULED', { bracketStage: 'THIRD_PLACE', youtubeUrl: MOCK_YOUTUBE_URL }),
  match(1013, '피구', '금', fridayYmd, 'LUNCH', 1, 4, 0, 0, 'SCHEDULED', { bracketStage: 'FINAL', youtubeUrl: MOCK_YOUTUBE_URL }),

  // 다른 종목도 일정·관리자 화면에서 확인할 수 있도록 제공
  match(1020, '탁구', '화', todayYmd, 'LUNCH', 9, 10, 3, 1, 'DONE', { result: '3학년 1반 승', bracketStage: 'SEMI1' }),
  match(1021, '빅발리볼', '수', fridayYmd, 'LUNCH', 5, 6, 0, 0, 'SCHEDULED', { bracketStage: 'FINAL', setsJson: '[{"a":0,"b":0},{"a":0,"b":0},{"a":0,"b":0}]' }),
  match(1022, '줄다리기', '목', fridayYmd, 'DINNER', 9, 10, 0, 0, 'SCHEDULED'),
  match(1023, '단체 줄넘기', '금', fridayYmd, 'DINNER', 11, 12, 0, 0, 'SCHEDULED'),
  match(1024, '이어달리기', '금', fridayYmd, 'DINNER', 20, 21, 0, 0, 'SCHEDULED', { category: 'CLUB' }),
  match(1025, '농구', '금', fridayYmd, 'DINNER', 20, 21, 0, 0, 'SCHEDULED', { category: 'CLUB', bracketStage: 'FINAL', youtubeUrl: MOCK_YOUTUBE_URL }),
];

export const MOCK_RANKINGS: RankingEntry[] = gradeTeams.map((team, index) => ({
  team,
  played: 3,
  wins: index < 4 ? 2 : 1,
  draws: index === 4 ? 1 : 0,
  losses: index < 4 ? 1 : 2,
  goalsFor: 8 - (index % 4),
  goalsAgainst: 3 + (index % 3),
  goalDiff: 5 - (index % 4),
  points: index < 4 ? 6 : 3,
  recentForm: [],
}));
