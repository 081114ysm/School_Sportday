// 종목 목록
export const SPORTS = [
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

// 종목별 출전 가능 팀 규칙. grades가 비어 있으면 전 학년 허용,
// allowClub이 true면 연합(CLUB) 팀도 선택 가능.
export type SportRule = { grades?: number[]; allowClub?: boolean };
export const SPORT_RULES: Record<string, SportRule> = {
  '농구':        { grades: [3], allowClub: true },   // 3학년 / 남자연합
  '탁구':        { grades: [3] },                    // 3학년 전용
  '피구':        { allowClub: true },                // 학년별 전원 + 여자연합
  '빅발리볼':    { grades: [1], allowClub: true },   // 1학년 / 남자·여자연합
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

export const CATEGORIES = ['예선', '본선', '결승', '3/4위전'];

// 단일 점수 대신 3세트 스코어보드를 사용하는 종목.
export const MULTI_SET_SPORTS = new Set(['빅발리볼']);

export type AdminTab = 'live-input' | 'results' | 'schedule-mgmt' | 'team-mgmt' | 'youtube-mgmt';
