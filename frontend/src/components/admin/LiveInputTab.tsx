'use client';

import { Match } from '@/types';
import { effectiveStatus, isMultiSet, parseSets, slotLabel } from './adminUtils';
import styles from '@/app/admin/admin.module.css';

interface LiveInputTabProps {
  liveAndScheduledMatches: Match[];
  selectedMatchId: number | null;
  setSelectedMatchId: (id: number | null) => void;
  selectedMatch: Match | null;
  activeSet: number;
  setActiveSet: (i: number) => void;
  loading: boolean;
  onScoreUpdate: (team: 'A' | 'B', delta: number) => void;
  onUndo: () => void;
  onStatusChange: (status: 'SCHEDULED' | 'LIVE' | 'DONE') => void;
}

export function LiveInputTab({
  liveAndScheduledMatches,
  selectedMatchId,
  setSelectedMatchId,
  selectedMatch,
  activeSet,
  setActiveSet,
  loading,
  onScoreUpdate,
  onUndo,
  onStatusChange,
}: LiveInputTabProps) {
  return (
    <div>
      <h2 className={styles.adminSectionTitle}>{'\uD83C\uDFAE'} 실시간 점수 입력</h2>
      <select
        className={styles.matchSelector}
        value={selectedMatchId ?? ''}
        onChange={e => setSelectedMatchId(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">경기를 선택하세요</option>
        {liveAndScheduledMatches.map(match => (
          <option key={match.id} value={match.id}>
            [{effectiveStatus(match) === 'LIVE' ? '🔴 LIVE' : '⏳ 예정'}] {match.sport} · {match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'} · {match.matchDate ?? '날짜미정'} {slotLabel(match.timeSlot)}
          </option>
        ))}
      </select>

      {selectedMatch ? (
        <div className={styles.scoreBoard}>
          <div className={styles.scoreBoardHeader}>
            <div className={styles.scoreBoardSport}>{selectedMatch.sport} - {selectedMatch.category}</div>
            <div className={styles.scoreBoardStatus}>
              {(() => {
                const eff = effectiveStatus(selectedMatch);
                return eff === 'LIVE' ? '\uD83D\uDD34 진행 중' :
                       eff === 'DONE' ? '\u2705 종료' : '\u23F3 예정';
              })()}
            </div>
          </div>

          {isMultiSet(selectedMatch.sport) && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
              {parseSets(selectedMatch.setsJson).map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSet(i)}
                  className={`${styles.filterBtn} ${activeSet === i ? styles.filterBtnActive : ''}`}
                  style={{ minWidth: 110 }}
                >
                  {i + 1}세트 &nbsp; <strong>{s.a} : {s.b}</strong>
                </button>
              ))}
            </div>
          )}

          <div className={styles.scoreArea}>
            <div className={styles.scoreTeam}>
              <div className={styles.scoreTeamName}>{selectedMatch.teamA?.name || 'Team A'}</div>
              <div className={styles.scoreNum}>
                {isMultiSet(selectedMatch.sport)
                  ? parseSets(selectedMatch.setsJson)[activeSet].a
                  : selectedMatch.scoreA}
              </div>
              <div className={styles.scoreButtons}>
                <button
                  className={styles.scoreBtnPlus}
                  onClick={() => onScoreUpdate('A', 1)}
                  disabled={loading || selectedMatch.status !== 'LIVE'}
                >
                  +
                </button>
                <button
                  className={styles.scoreBtnMinus}
                  onClick={() => onScoreUpdate('A', -1)}
                  disabled={loading || selectedMatch.status !== 'LIVE' || selectedMatch.scoreA <= 0}
                >
                  -
                </button>
              </div>
            </div>

            <div className={styles.scoreVs}>VS</div>

            <div className={styles.scoreTeam}>
              <div className={styles.scoreTeamName}>{selectedMatch.teamB?.name || 'Team B'}</div>
              <div className={styles.scoreNum}>
                {isMultiSet(selectedMatch.sport)
                  ? parseSets(selectedMatch.setsJson)[activeSet].b
                  : selectedMatch.scoreB}
              </div>
              <div className={styles.scoreButtons}>
                <button
                  className={styles.scoreBtnPlus}
                  onClick={() => onScoreUpdate('B', 1)}
                  disabled={loading || selectedMatch.status !== 'LIVE'}
                >
                  +
                </button>
                <button
                  className={styles.scoreBtnMinus}
                  onClick={() => onScoreUpdate('B', -1)}
                  disabled={loading || selectedMatch.status !== 'LIVE' || selectedMatch.scoreB <= 0}
                >
                  -
                </button>
              </div>
            </div>
          </div>

          <div className={styles.actionRow}>
            <button
              className={`${styles.actionBtn} ${styles.btnUndo}`}
              onClick={onUndo}
              disabled={loading || selectedMatch.status !== 'LIVE'}
            >
              {'\u21A9'} 실행 취소
            </button>
            {selectedMatch.status === 'SCHEDULED' && (
              <button
                className={`${styles.actionBtn} ${styles.btnStart}`}
                onClick={() => onStatusChange('LIVE')}
                disabled={loading}
              >
                {'\u25B6'} 경기 시작
              </button>
            )}
            {selectedMatch.status === 'LIVE' && (
              <button
                className={`${styles.actionBtn} ${styles.btnEnd}`}
                onClick={() => onStatusChange('DONE')}
                disabled={loading}
              >
                {'\u23F9'} 경기 종료
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.noData}>
          경기를 선택해주세요
        </div>
      )}
    </div>
  );
}
