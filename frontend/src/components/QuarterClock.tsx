'use client';

import { useEffect, useState } from 'react';
import type { Match } from '@/types';
import { isQuarterSport } from '@/lib/matchScore';

interface QuarterClockProps {
  match: Match;
}

// 농구·풋살용 쿼터 카운트다운. 1초마다 갱신된다.
// quarterStartedAt이 null이면 일시정지로 간주한다.
export function QuarterClock({ match }: QuarterClockProps) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (!isQuarterSport(match.sport)) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [match.sport]);

  if (!isQuarterSport(match.sport)) return null;
  const total = match.quarterCount ?? 4;
  const cur = match.currentQuarter ?? 0;
  const minutes = match.quarterMinutes ?? 10;
  const startedAt = match.quarterStartedAt ? new Date(match.quarterStartedAt).getTime() : null;
  let label: string;
  if (startedAt == null) {
    label = '일시정지';
  } else {
    const elapsedSec = Math.max(0, Math.floor((now - startedAt) / 1000));
    const remain = minutes * 60 - elapsedSec;
    if (remain <= 0) {
      label = '종료';
    } else {
      const mm = Math.floor(remain / 60);
      const ss = remain % 60;
      label = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')} 남음`;
    }
  }
  return (
    <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: '#334155' }}>
      {cur || 1}쿼터 / 총 {total}쿼터 · {label}
    </div>
  );
}
