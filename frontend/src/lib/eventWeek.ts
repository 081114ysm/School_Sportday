// Shared helper for mapping Korean weekday labels (월/화/수/목/금) to actual
// dates of the *current* event week. The week is anchored on the Monday of
// "today". When the calendar rolls forward to the next week, all consumers
// (admin, schedule page, etc.) automatically pick up the new dates without
// any manual edit.

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

// Returns the Monday (start) of the week containing `ref`.
// JS getDay(): Sun=0..Sat=6. Treats Sun as part of the *upcoming* week.
function startOfWeek(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const offset = dow === 0 ? 1 : 1 - dow; // Sun → +1, Mon → 0, Tue → -1 ...
  d.setDate(d.getDate() + offset);
  return d;
}

// 월 → 'YYYY-MM-DD' for current event week.
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

// Same week, formatted as 'MM.DD' for UI day pickers.
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
