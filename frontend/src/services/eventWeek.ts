// 한글 요일(월/화/수/목/금)을 *현재* 이벤트 주의 실제 날짜로 매핑하는 공유 헬퍼.
// 주는 오늘 기준 월요일을 기점으로 결정된다. 달력이 다음 주로 넘어가면
// 관리자·일정 페이지 등 모든 소비처가 별도 수정 없이 자동으로 새 날짜를 반영한다.

export const KO_DAYS = ['월', '화', '수', '목', '금'] as const;
export type KoDay = (typeof KO_DAYS)[number];

function ymd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function mmdd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}.${day}`;
}

// `ref`가 속한 주의 월요일(주 시작일)을 반환한다.
// JS getDay(): 일=0..토=6. 일요일은 *다음* 주로 취급한다.
function startOfWeek(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const offset = dow === 0 ? 1 : 1 - dow; // Sun → +1, Mon → 0, Tue → -1 ...
  d.setDate(d.getDate() + offset);
  return d;
}

// 월 → 현재 이벤트 주의 'YYYY-MM-DD'.
export function getEventWeekDates(now: Date = new Date()): Record<KoDay, string> {
  const monday = startOfWeek(now);
  const out = {} as Record<KoDay, string>;
  KO_DAYS.forEach((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    out[label] = ymd(d);
  });
  return out;
}

// 같은 주를 UI 요일 선택기용 'MM.DD' 형식으로 반환한다.
export function getEventWeekShortDates(now: Date = new Date()): Record<KoDay, string> {
  const monday = startOfWeek(now);
  const out = {} as Record<KoDay, string>;
  KO_DAYS.forEach((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    out[label] = mmdd(d);
  });
  return out;
}

export function todayYmd(now: Date = new Date()): string {
  return ymd(now);
}
