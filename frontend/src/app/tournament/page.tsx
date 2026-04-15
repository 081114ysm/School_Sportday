'use client';

import { useEffect, useState } from 'react';
import type { Match } from '@/types';
import { fetchMatches } from '@/services/api';
import { getSocket } from '@/services/socket';
import Bracket from '@/components/tournament/Bracket';
import { CLUB_TOURNAMENT_SPORTS } from '@/components/admin/adminConstants';

// 학년별 토너먼트 종목 정의
const GRADE_SPORTS: { grade: number; label: string; sports: string[] }[] = [
  { grade: 1, label: '1학년', sports: ['피구', '빅발리볼'] },
  { grade: 2, label: '2학년', sports: ['피구', '빅발리볼'] },
  { grade: 3, label: '3학년', sports: ['탁구', '피구', '빅발리볼'] },
];

// 종목별 영문 키 매핑 (백엔드 시드값 대응)
const SPORT_ALIASES: Record<string, string[]> = {
  '탁구': ['탁구', 'TABLE_TENNIS'],
  '피구': ['피구', 'DODGEBALL'],
  '빅발리볼': ['빅발리볼', 'BIG_VOLLEYBALL'],
  '배드민턴': ['배드민턴', 'BADMINTON'],
  '농구': ['농구', 'BASKETBALL'],
};

type MainTab = 'grade' | 'club';

const TAB_STYLE_BASE: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 14,
  transition: 'background 0.15s, color 0.15s',
};

const SPORT_BTN_BASE: React.CSSProperties = {
  padding: '6px 16px',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
  transition: 'all 0.15s',
};

export default function TournamentPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [mainTab, setMainTab] = useState<MainTab>('grade');

  // 학년 탭 상태
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [selectedGradeSport, setSelectedGradeSport] = useState('피구');

  // 연합 탭 상태
  const [selectedClubSport, setSelectedClubSport] = useState<string>(CLUB_TOURNAMENT_SPORTS[0]);

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

  const handleGradeChange = (grade: number) => {
    setSelectedGrade(grade);
    const g = GRADE_SPORTS.find((x) => x.grade === grade)!;
    setSelectedGradeSport(g.sports[0]);
  };

  const currentGrade = GRADE_SPORTS.find((g) => g.grade === selectedGrade)!;
  const gradeSportAliases = SPORT_ALIASES[selectedGradeSport] ?? [selectedGradeSport];
  const clubSportAliases = SPORT_ALIASES[selectedClubSport] ?? [selectedClubSport];

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
          준결승 2경기 + 결승으로 우승팀이 결정됩니다.
        </p>
      </header>

      {/* 메인 탭: 학년 / 연합 */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--border)', paddingBottom: 2 }}>
        <button
          type="button"
          onClick={() => setMainTab('grade')}
          style={{
            ...TAB_STYLE_BASE,
            background: mainTab === 'grade' ? 'var(--green)' : 'transparent',
            color: mainTab === 'grade' ? '#fff' : 'var(--text2)',
          }}
        >
          학년
        </button>
        <button
          type="button"
          onClick={() => setMainTab('club')}
          style={{
            ...TAB_STYLE_BASE,
            background: mainTab === 'club' ? 'var(--green)' : 'transparent',
            color: mainTab === 'club' ? '#fff' : 'var(--text2)',
          }}
        >
          연합
        </button>
      </div>

      {mainTab === 'grade' && (
        <>
          {/* 학년 선택 */}
          <div style={{ display: 'flex', gap: 8 }}>
            {GRADE_SPORTS.map((g) => (
              <button
                key={g.grade}
                type="button"
                onClick={() => handleGradeChange(g.grade)}
                style={{
                  ...TAB_STYLE_BASE,
                  background: selectedGrade === g.grade ? 'var(--green)' : 'var(--card)',
                  color: selectedGrade === g.grade ? '#fff' : 'var(--text)',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* 종목 버튼 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {currentGrade.sports.map((sport) => (
              <button
                key={sport}
                type="button"
                onClick={() => setSelectedGradeSport(sport)}
                style={{
                  ...SPORT_BTN_BASE,
                  border: `2px solid ${selectedGradeSport === sport ? 'var(--green)' : 'var(--border)'}`,
                  background: selectedGradeSport === sport ? 'var(--green-subtle, rgba(34,197,94,0.12))' : 'transparent',
                  color: selectedGradeSport === sport ? 'var(--green)' : 'var(--text2)',
                }}
              >
                {sport}
              </button>
            ))}
          </div>

          <Bracket
            key={`grade-${selectedGrade}-${selectedGradeSport}`}
            title={`${selectedGrade}학년 ${selectedGradeSport}`}
            sport={selectedGradeSport}
            grade={selectedGrade}
            matches={matches.filter((m) => gradeSportAliases.includes(m.sport))}
          />
        </>
      )}

      {mainTab === 'club' && (
        <>
          {/* 종목 버튼 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CLUB_TOURNAMENT_SPORTS.map((sport) => (
              <button
                key={sport}
                type="button"
                onClick={() => setSelectedClubSport(sport)}
                style={{
                  ...SPORT_BTN_BASE,
                  border: `2px solid ${selectedClubSport === sport ? 'var(--green)' : 'var(--border)'}`,
                  background: selectedClubSport === sport ? 'var(--green-subtle, rgba(34,197,94,0.12))' : 'transparent',
                  color: selectedClubSport === sport ? 'var(--green)' : 'var(--text2)',
                }}
              >
                {sport}
              </button>
            ))}
          </div>

          <Bracket
            key={`club-${selectedClubSport}`}
            title={`연합 ${selectedClubSport}`}
            sport={selectedClubSport}
            clubGroup=""
            matches={matches.filter((m) => clubSportAliases.includes(m.sport))}
          />
        </>
      )}
    </div>
  );
}
