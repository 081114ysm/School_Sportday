// 기본 종목 목록
export const DEFAULT_SPORTS = [
  '농구',
  '탁구',
  '피구',
  '빅발리볼',
  '줄다리기',
  '단체 줄넘기',
  '축구',
  '배드민턴',
  '이어달리기',
];

const CUSTOM_SPORTS_KEY = 'sportday.customSports';

export function getCustomSports(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_SPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function setCustomSports(list: string[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CUSTOM_SPORTS_KEY, JSON.stringify(list));
  try {
    window.dispatchEvent(new Event('sportday:customSportsChanged'));
  } catch {
    /* ignore */
  }
}

// 기본 + localStorage 커스텀 종목 병합 결과.
export function getSports(): string[] {
  return [...DEFAULT_SPORTS, ...getCustomSports()];
}

// 기존 코드 호환용: SPORTS는 getSports()의 동기 스냅샷.
// 서버사이드에서는 기본값만 반환한다.
export const SPORTS: string[] = typeof window === 'undefined' ? DEFAULT_SPORTS : getSports();

// 종목별 출전 가능 팀 규칙. grades가 비어 있으면 전 학년 허용,
// allowClub이 true면 연합(CLUB) 팀도 선택 가능.
export type SportRule = { grades?: number[]; allowClub?: boolean };
export const SPORT_RULES: Record<string, SportRule> = {
  '농구':        { grades: [3], allowClub: true },   // 3학년 / 남자연합
  '탁구':        { grades: [3] },                    // 3학년 전용
  '피구':        { allowClub: true },                // 학년별 전원 + 여자연합
  '빅발리볼':    { allowClub: true },                // 전 학년 / 남자·여자연합
  '줄다리기':    {},                                 // 학년별 전원
  '단체 줄넘기': {},                                 // 학년별 전원
  '축구':        { allowClub: true },                // 남자연합
  '배드민턴':    { allowClub: true },                // 전체연합
  '이어달리기':  { allowClub: true },                // 전체연합
};

export const TIME_SLOTS = [
  { value: 'LUNCH', label: '점심 (12:50)' },
  { value: 'DINNER', label: '저녁 (18:30)' },
] as const;

export const CATEGORIES = ['GRADE', 'CLUB', 'ALL_UNION'] as const;
export const CATEGORY_LABELS: Record<string, string> = {
  GRADE: '학년전',
  CLUB: '팀전',
  ALL_UNION: '연합전',
};

// 단일 점수 대신 3세트 스코어보드를 사용하는 종목.
export const MULTI_SET_SPORTS = new Set(['빅발리볼', '배드민턴', '1학년 빅발리볼']);

// 쿼터제를 사용하는 종목.
export const QUARTER_SPORTS = new Set(['농구', '풋살']);

// 토너먼트(준결승+결승) 대진을 사용하는 종목 (하위 호환).
export const TOURNAMENT_SPORTS = new Set(['탁구', '피구', '빅발리볼', '1학년 빅발리볼']);

// 학년별 토너먼트 종목 설정. label=표시명, sport=DB 저장명.
export interface TournamentSportConfig {
  label: string;
  sport: string;
}
export const TOURNAMENT_GRADE_SPORTS: Record<number, TournamentSportConfig[]> = {
  1: [
    { label: '피구',            sport: '피구' },
    { label: '학년별 빅발리볼', sport: '빅발리볼' },
    { label: '1학년 빅발리볼', sport: '1학년 빅발리볼' },
  ],
  2: [
    { label: '피구',            sport: '피구' },
    { label: '학년별 빅발리볼', sport: '빅발리볼' },
  ],
  3: [
    { label: '탁구',            sport: '탁구' },
    { label: '피구',            sport: '피구' },
    { label: '학년별 빅발리볼', sport: '빅발리볼' },
  ],
};

// 연합(CLUB) 토너먼트 종목 목록.
export const CLUB_TOURNAMENT_SPORTS = ['빅발리볼', '배드민턴', '농구'] as const;
export const BRACKET_STAGES = [
  { value: 'SEMI1', label: '준결승 1' },
  { value: 'SEMI2', label: '준결승 2' },
  { value: 'FINAL', label: '결승' },
] as const;

// 빅발리볼·피구에서만 선택 가능한 여자연합 합동팀.
export const WOMENS_UNION_TEAMS: Record<string, string> = {
  '빅발리볼': '여자연합',
  '피구': '여자연합',
};
export const WOMENS_UNION_A = '여자연합 AC';
export const WOMENS_UNION_B = '여자연합 BD';

export type AdminTab = 'live-input' | 'results' | 'schedule-mgmt' | 'team-mgmt' | 'youtube-mgmt' | 'sport-mgmt' | 'tournament-mgmt' | 'points-mgmt';
