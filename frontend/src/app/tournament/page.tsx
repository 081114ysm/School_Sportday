'use client';

import { useEffect, useState } from 'react';
import type { Match } from '@/types';
import { fetchMatches } from '@/services/api';
import { getSocket } from '@/services/socket';
import Bracket from '@/components/tournament/Bracket';

const TOURNAMENTS: Array<{
  title: string;
  sports: string[];
  grade: number;
}> = [
  { title: '3학년 탁구', sports: ['탁구', 'TABLE_TENNIS'], grade: 3 },
  { title: '2학년 피구', sports: ['피구', 'DODGEBALL'], grade: 2 },
  { title: '1학년 빅발리볼', sports: ['빅발리볼', 'BIG_VOLLEYBALL'], grade: 1 },
];

export default function TournamentPage() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchMatches()
        .then((data) => {
          if (!cancelled) setMatches(data);
        })
        .catch(() => {});
    };
    load();

    const socket = getSocket();
    const onUpdate = (m: Match) => {
      setMatches((prev) =>
        prev.some((x) => x.id === m.id)
          ? prev.map((x) => (x.id === m.id ? m : x))
          : [...prev, m],
      );
    };
    const onScore = (data: { matchId: number; scoreA: number; scoreB: number }) => {
      setMatches((prev) =>
        prev.map((x) =>
          x.id === data.matchId
            ? { ...x, scoreA: data.scoreA, scoreB: data.scoreB }
            : x,
        ),
      );
    };
    socket.on('matchUpdate', onUpdate);
    socket.on('scoreUpdate', onScore);
    socket.on('matchCreated', onUpdate);

    // 포커스 복귀 시 재조회 (웹소켓 놓친 이벤트 보정)
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      socket.off('matchUpdate', onUpdate);
      socket.off('scoreUpdate', onScore);
      socket.off('matchCreated', onUpdate);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <header style={{ marginBottom: 4 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            marginBottom: 6,
          }}
        >
          토너먼트 <span style={{ color: 'var(--green)' }}>대진표</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>
          탁구·피구·빅발리볼 단일 토너먼트. 준결승 2경기 + 결승으로 우승팀이 결정됩니다.
        </p>
      </header>
      {TOURNAMENTS.map((t) => (
        <Bracket
          key={t.title}
          title={t.title}
          sport={t.sports[0]}
          grade={t.grade}
          matches={matches.filter((m) => t.sports.includes(m.sport))}
        />
      ))}
    </div>
  );
}
