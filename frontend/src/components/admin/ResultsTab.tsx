'use client';

import { Match } from '@/types';
import { effectiveStatus, slotLabel } from './adminUtils';
import { SPORTS } from './adminConstants';
import styles from '@/app/admin/admin.module.css';

interface ResultsTabProps {
  filteredMatches: Match[];
  sportFilter: string;
  setSportFilter: (s: string) => void;
  resultsStatusFilter: '' | 'LIVE' | 'SCHEDULED' | 'DONE';
  setResultsStatusFilter: (v: '' | 'LIVE' | 'SCHEDULED' | 'DONE') => void;
}

export function ResultsTab({
  filteredMatches,
  sportFilter,
  setSportFilter,
  resultsStatusFilter,
  setResultsStatusFilter,
}: ResultsTabProps) {
  return (
    <div>
      <h2 className={styles.adminSectionTitle}>{'\uD83D\uDCCB'} 경기 결과</h2>
      <div className={styles.filterRow}>
        <button
          className={`${styles.filterBtn} ${sportFilter === '' ? styles.filterBtnActive : ''}`}
          onClick={() => setSportFilter('')}
        >
          전체 종목
        </button>
        {SPORTS.map(sport => (
          <button
            key={sport}
            className={`${styles.filterBtn} ${sportFilter === sport ? styles.filterBtnActive : ''}`}
            onClick={() => setSportFilter(sport)}
          >
            {sport}
          </button>
        ))}
      </div>
      <div className={styles.filterRow}>
        {([
          { v: '', label: '전체 상태' },
          { v: 'LIVE', label: 'LIVE' },
          { v: 'SCHEDULED', label: '예정' },
          { v: 'DONE', label: '종료' },
        ] as const).map(opt => (
          <button
            key={opt.v}
            className={`${styles.filterBtn} ${resultsStatusFilter === opt.v ? styles.filterBtnActive : ''}`}
            onClick={() => setResultsStatusFilter(opt.v)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 ? (
        <div className={styles.noData}>경기 데이터가 없습니다</div>
      ) : (
        <div className={styles.resultCards}>
          {filteredMatches.map(match => {
            const eff = effectiveStatus(match);
            return (
              <div key={match.id} className={styles.resultCard}>
                <div className={styles.resultCardHeader}>
                  <span className={styles.resultSport}>{match.sport}</span>
                  <span className={`${styles.resultBadge} ${
                    eff === 'LIVE' ? styles.resultBadgeLive :
                    eff === 'DONE' ? styles.resultBadgeDone :
                    styles.resultBadgeScheduled
                  }`}>
                    {eff === 'LIVE' ? 'LIVE' :
                     eff === 'DONE' ? '종료' : '예정'}
                  </span>
                </div>
                <div className={styles.resultScoreRow}>
                  <span className={styles.resultTeamName}>
                    {match.teamA?.name || 'Team A'}
                  </span>
                  <span className={styles.resultScore}>{match.scoreA}</span>
                  <span className={styles.resultDash}>:</span>
                  <span className={styles.resultScore}>{match.scoreB}</span>
                  <span className={`${styles.resultTeamName} ${styles.resultTeamNameRight}`}>
                    {match.teamB?.name || 'Team B'}
                  </span>
                </div>
                <div className={styles.resultMeta}>
                  {match.matchDate ?? '날짜미정'} ({match.day}) {slotLabel(match.timeSlot)} | {match.category}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
