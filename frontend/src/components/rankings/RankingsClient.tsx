'use client';

import { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import type { RankingEntry } from '@/types';
import styles from './rankings.module.css';

type TabKey = 'ALL' | 'G1' | 'G2' | 'G3' | 'CLUB';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'ALL', label: '전체' },
  { key: 'G1', label: '1학년' },
  { key: 'G2', label: '2학년' },
  { key: 'G3', label: '3학년' },
  { key: 'CLUB', label: '팀별' },
];

export default function RankingsClient({ initial }: { initial: RankingEntry[] }) {
  const [tab, setTab] = useState<TabKey>('ALL');

  const filtered = useMemo(() => {
    const notClub = (r: RankingEntry) => r.team.category !== 'CLUB';
    switch (tab) {
      case 'G1':
        return initial.filter((r) => r.team.grade === 1 && notClub(r));
      case 'G2':
        return initial.filter((r) => r.team.grade === 2 && notClub(r));
      case 'G3':
        return initial.filter((r) => r.team.grade === 3 && notClub(r));
      case 'CLUB':
        return initial.filter((r) => r.team.category === 'CLUB');
      default:
        return initial.filter(notClub);
    }
  }, [initial, tab]);

  const topThree = useMemo(() => filtered.slice(0, 3), [filtered]);

  const PODIUM_META = [
    { label: '1위', accent: styles.gold, rank: 1 },
    { label: '2위', accent: styles.silver, rank: 2 },
    { label: '3위', accent: styles.bronze, rank: 3 },
  ];

  return (
    <div className="page-container">
      <div className={styles.header}>
        <h1>순위</h1>
      </div>

      {topThree.length > 0 && (
        <div className={styles.podiumGrid}>
          {topThree.map((r, i) => (
            <div
              key={r.team.id}
              className={`${styles.podiumCard} ${PODIUM_META[i].accent}`}
            >
              <div className={styles.podiumRank}>
                <Star size={16} fill="currentColor" stroke="currentColor" />
                {PODIUM_META[i].label}
              </div>
              <div className={styles.podiumName}>{r.team.name}</div>
              <div className={styles.podiumPts}>
                <span className={styles.podiumPtsNum}>{r.points}</span>
                <span className={styles.podiumPtsLabel}>승점</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>순위</th>
                <th className={styles.alignLeft}>팀</th>
                <th>경기</th>
                <th>승</th>
                <th>무</th>
                <th>패</th>
                <th>득점</th>
                <th>실점</th>
                <th>득실차</th>
                <th>승점</th>
                <th className={styles.alignLeft}>최근 5경기</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className={styles.emptyRow}>
                    데이터 없음
                  </td>
                </tr>
              )}
              {filtered.map((r, i) => (
                <tr key={r.team.id} className={i < 3 ? styles.podium : ''}>
                  <td>
                    <span
                      className={`${styles.pos} ${
                        i === 0
                          ? styles.gold
                          : i === 1
                          ? styles.silver
                          : i === 2
                          ? styles.bronze
                          : ''
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className={styles.teamCell}>
                    <span className={styles.teamName}>{r.team.name}</span>
                    {r.team.grade != null && (
                      <span className={styles.teamGrade}>
                        {r.team.grade}학년 {r.team.classNumber}반
                      </span>
                    )}
                  </td>
                  <td>{r.played}</td>
                  <td className={styles.wColor}>{r.wins}</td>
                  <td>{r.draws}</td>
                  <td className={styles.lColor}>{r.losses}</td>
                  <td>{r.goalsFor}</td>
                  <td>{r.goalsAgainst}</td>
                  <td
                    className={
                      r.goalDiff > 0
                        ? styles.diffPos
                        : r.goalDiff < 0
                        ? styles.diffNeg
                        : ''
                    }
                  >
                    {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
                  </td>
                  <td className={styles.pts}>{r.points}</td>
                  <td>
                    <div className={styles.formCol}>
                      {r.recentForm.slice(0, 5).map((f, idx) => (
                        <div
                          key={idx}
                          className={styles.formItem}
                          title={`vs ${f.opponent}`}
                        >
                          <span
                            className={`${styles.formChip} ${
                              f.result === 'W'
                                ? styles.formW
                                : f.result === 'D'
                                ? styles.formD
                                : styles.formL
                            }`}
                          >
                            {f.result === 'W' ? '승' : f.result === 'D' ? '무' : '패'}
                          </span>
                          <span className={styles.formDetail}>
                            vs {f.opponent}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
