'use client';

import { useEffect, useState } from 'react';
import { Trophy, Radio, Clock } from 'lucide-react';
import { fetchMatches, fetchLiveMatches } from '@/services/api';
import { getSocket, disconnectSocket } from '@/services/socket';
import { displayScore, type Match } from '@/types';
import { isQuarterSport, isSetBasedSport, isSetComplete } from '@/lib/matchScore';
import { QuarterClock } from '@/components/QuarterClock';
import styles from './today.module.css';

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];
const TODAY_DATE = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
})();

const SLOT_ORDER: Record<string, number> = { LUNCH: 0, DINNER: 1 };
function sortBySlot<T extends { timeSlot?: string; kickoffAt?: string; startTime?: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const ta = a.kickoffAt ?? a.startTime;
    const tb = b.kickoffAt ?? b.startTime;
    if (ta && tb) return new Date(ta).getTime() - new Date(tb).getTime();
    return (SLOT_ORDER[a.timeSlot ?? ''] ?? 99) - (SLOT_ORDER[b.timeSlot ?? ''] ?? 99);
  });
}

const SPORT_LABELS: Record<string, string> = {
  BASKETBALL: '농구',
  FUTSAL: '풋살',
  BIG_VOLLEYBALL: '빅발리볼',
  DODGEBALL: '피구',
  TUG_OF_WAR: '줄다리기',
  BADMINTON: '배드민턴',
  RELAY: '이어달리기',
  JUMP_ROPE: '단체줄넘기',
  BASEBALL: '발야구',
  SOCCER: '축구',
};

export default function TodayPage() {
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [live, setLive] = useState<Match | null>(null);

  useEffect(() => {
    fetchMatches({ matchDate: TODAY_DATE })
      .then((arr) => setTodayMatches(sortBySlot(arr)))
      .catch(() => {});
    fetchLiveMatches()
      .then((arr) => setLive(sortBySlot(arr)[0] ?? null))
      .catch(() => {});

    const socket = getSocket();
    socket.on('scoreUpdate', (data: { matchId: number; scoreA: number; scoreB: number; match?: Match }) => {
      const patch = data.match
        ? { scoreA: data.match.scoreA, scoreB: data.match.scoreB, setsJson: data.match.setsJson, status: data.match.status }
        : { scoreA: data.scoreA, scoreB: data.scoreB };
      setLive((prev) =>
        prev && prev.id === data.matchId ? { ...prev, ...patch } : prev,
      );
      setTodayMatches((prev) =>
        prev.map((m) => (m.id === data.matchId ? { ...m, ...patch } : m)),
      );
    });
    socket.on('matchUpdate', (m: Match) => {
      setTodayMatches((prev) => prev.map((x) => (x.id === m.id ? m : x)));
      if (m.status === 'LIVE') setLive(m);
    });
    return () => {
      socket.off('scoreUpdate');
      socket.off('matchUpdate');
      disconnectSocket();
    };
  }, []);

  const liveSets = (() => {
    if (!live || !isSetBasedSport(live.sport) || !live.setsJson) return [];
    try {
      const sets = JSON.parse(live.setsJson) as { a: number; b: number }[];
      return sets.filter((s) => s.a > 0 || s.b > 0);
    } catch {
      return [];
    }
  })();

  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}/${today.getDate()} (${DAY_KO[today.getDay()]})`;

  return (
    <div className={`page-container ${styles.pageWrap}`}>
      <div className={styles.heading}>
        <h1 className={styles.bigTitle}>오늘 경기</h1>
        <span className={styles.dateBadge}>
          <Clock size={14} /> {dateLabel}
        </span>
      </div>

      <div className={styles.layout}>
        {/* 왼쪽: 오늘 경기 일정표 */}
        <section className={styles.tableSection}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>
              <Clock size={18} /> 오늘 경기 일정표
            </h2>
            <span className={styles.count}>{todayMatches.length}경기</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>시간</th>
                  <th>종목</th>
                  <th>대결</th>
                  <th>상태</th>
                  <th>점수</th>
                </tr>
              </thead>
              <tbody>
                {todayMatches.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyRow}>
                      오늘 예정된 경기가 없습니다
                    </td>
                  </tr>
                )}
                {todayMatches.map((m) => (
                  <tr key={m.id} className={m.status === 'LIVE' ? styles.rowLive : ''}>
                    <td className={styles.timeCell}>{m.timeSlot === 'LUNCH' ? '점심' : '저녁'}</td>
                    <td>{SPORT_LABELS[m.sport] ?? m.sport}</td>
                    <td className={styles.teamsCell}>
                      {m.teamA?.name ?? '?'} <span className={styles.vsSm}>vs</span>{' '}
                      {m.teamB?.name ?? '?'}
                    </td>
                    <td>
                      {m.status === 'LIVE' && <span className={styles.tagLive}>LIVE</span>}
                      {m.status === 'DONE' && <span className={styles.tagDone}>종료</span>}
                      {m.status === 'SCHEDULED' && (
                        <span className={styles.tagScheduled}>예정</span>
                      )}
                    </td>
                    <td className={styles.scoreCell}>
                      {m.status === 'SCHEDULED' ? '-' : `${displayScore(m).a} : ${displayScore(m).b}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 오른쪽: 실시간 스코어보드 */}
        <section className={styles.liveSection}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>
              <Radio size={18} /> 실시간 스코어
            </h2>
            {live && (
              <span className={styles.livePill}>
                <span className={styles.liveDot} /> LIVE
              </span>
            )}
          </div>

          {live ? (
            <div className={styles.scoreCard}>
              <div className={styles.sportRow}>
                <Trophy size={16} />
                <span>{SPORT_LABELS[live.sport] ?? live.sport}</span>
              </div>
              <div className={styles.teamLine}>
                <div className={styles.teamName}>{live.teamA?.name ?? 'Team A'}</div>
                <div className={styles.bigScore}>{displayScore(live).a}</div>
              </div>
              <div className={styles.divider}>VS</div>
              <div className={styles.teamLine}>
                <div className={styles.teamName}>{live.teamB?.name ?? 'Team B'}</div>
                <div className={styles.bigScore}>{displayScore(live).b}</div>
              </div>
              {liveSets.length > 0 && (
                <div className={styles.setsRow}>
                  {liveSets.map((s, i) => {
                    const done = isSetComplete(live.sport, s.a, s.b);
                    return (
                      <span
                        key={i}
                        className={`${styles.setChip} ${done ? styles.setChipDone : styles.setChipLive}`}
                      >
                        {i + 1}세트 {s.a}:{s.b}
                      </span>
                    );
                  })}
                </div>
              )}
              <div className={styles.metaRow}>
                <span>{live.category === 'ALL_UNION' ? '연합전' : live.category === 'CLUB' ? '팀전' : '학년전'}</span>
                <span>·</span>
                <span>{live.timeSlot === 'LUNCH' ? '점심 라운드' : '저녁 라운드'}</span>
              </div>
              {isQuarterSport(live.sport) && (
                <QuarterClock match={live} />
              )}
            </div>
          ) : (
            <div className={styles.noLive}>
              <Radio size={32} />
              <div className={styles.noLiveText}>진행 중인 경기 없음</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
