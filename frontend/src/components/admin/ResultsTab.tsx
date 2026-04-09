'use client';

import { useEffect, useState } from 'react';
import { Match } from '@/types';
import { effectiveStatus, slotLabel } from './adminUtils';
import { getMatchScorePair } from '@/lib/matchScore';
import { getSports } from './adminConstants';
import styles from '@/app/admin/admin.module.css';

interface ResultsTabProps {
  filteredMatches: Match[];
  sportFilter: string;
  setSportFilter: (s: string) => void;
  resultsStatusFilter: '' | 'LIVE' | 'SCHEDULED' | 'DONE';
  setResultsStatusFilter: (v: '' | 'LIVE' | 'SCHEDULED' | 'DONE') => void;
  onEditResult: (
    id: number,
    data: { scoreA: number; scoreB: number; status: 'SCHEDULED' | 'LIVE' | 'DONE' },
  ) => Promise<void> | void;
  onDeleteResult: (id: number) => Promise<void> | void;
}

export function ResultsTab({
  filteredMatches,
  sportFilter,
  setSportFilter,
  resultsStatusFilter,
  setResultsStatusFilter,
  onEditResult,
  onDeleteResult,
}: ResultsTabProps) {
  const [sports, setSports] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<{
    scoreA: number;
    scoreB: number;
    status: 'SCHEDULED' | 'LIVE' | 'DONE';
  }>({ scoreA: 0, scoreB: 0, status: 'SCHEDULED' });

  useEffect(() => {
    setSports(getSports());
    const onChange = () => setSports(getSports());
    window.addEventListener('sportday:customSportsChanged', onChange);
    return () => window.removeEventListener('sportday:customSportsChanged', onChange);
  }, []);

  const startEdit = (m: Match) => {
    setEditingId(m.id);
    setEditDraft({
      scoreA: m.scoreA ?? 0,
      scoreB: m.scoreB ?? 0,
      status: m.status,
    });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: number) => {
    await onEditResult(id, editDraft);
    setEditingId(null);
  };

  const btnStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    border: '1px solid var(--border)',
    background: '#fff',
  };

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
        {sports.map(sport => (
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
            const isEditing = editingId === match.id;
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
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className={styles.resultTeamName}>{match.teamA?.name || 'Team A'}</span>
                      <input
                        type="number"
                        className={styles.formInput}
                        value={editDraft.scoreA}
                        onChange={(e) => setEditDraft({ ...editDraft, scoreA: Number(e.target.value) })}
                        style={{ width: 70, textAlign: 'center' }}
                      />
                      <span>:</span>
                      <input
                        type="number"
                        className={styles.formInput}
                        value={editDraft.scoreB}
                        onChange={(e) => setEditDraft({ ...editDraft, scoreB: Number(e.target.value) })}
                        style={{ width: 70, textAlign: 'center' }}
                      />
                      <span className={styles.resultTeamName}>{match.teamB?.name || 'Team B'}</span>
                    </div>
                    <select
                      className={styles.formInput}
                      value={editDraft.status}
                      onChange={(e) => setEditDraft({ ...editDraft, status: e.target.value as 'SCHEDULED' | 'LIVE' | 'DONE' })}
                    >
                      <option value="SCHEDULED">예정</option>
                      <option value="LIVE">LIVE</option>
                      <option value="DONE">종료</option>
                    </select>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button style={btnStyle} onClick={cancelEdit}>취소</button>
                      <button
                        style={{ ...btnStyle, background: 'var(--green)', color: '#fff', borderColor: 'var(--green)' }}
                        onClick={() => saveEdit(match.id)}
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.resultScoreRow}>
                      <span className={styles.resultTeamName}>
                        {match.teamA?.name || 'Team A'}
                      </span>
                      <span className={styles.resultScore}>{getMatchScorePair(match).a}</span>
                      <span className={styles.resultDash}>:</span>
                      <span className={styles.resultScore}>{getMatchScorePair(match).b}</span>
                      <span className={`${styles.resultTeamName} ${styles.resultTeamNameRight}`}>
                        {match.teamB?.name || 'Team B'}
                      </span>
                    </div>
                    <div className={styles.resultMeta}>
                      {match.matchDate ?? '날짜미정'} ({match.day}) {slotLabel(match.timeSlot)} | {match.category}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                      <button style={btnStyle} onClick={() => startEdit(match)}>수정</button>
                      <button
                        style={{ ...btnStyle, background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }}
                        onClick={() => {
                          if (confirm('이 결과를 삭제하시겠습니까?')) onDeleteResult(match.id);
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
