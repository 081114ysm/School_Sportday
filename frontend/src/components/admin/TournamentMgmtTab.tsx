'use client';

import { useState } from 'react';
import { Match, Team } from '@/types';
import { filterTeamsForSport, slotLabel } from './adminUtils';
import { TIME_SLOTS, TOURNAMENT_SPORTS, TOURNAMENT_GRADE, BRACKET_STAGES } from './adminConstants';
import { StatusBadge } from './StatusBadge';
import styles from '@/app/admin/admin.module.css';

const TOURNAMENT_SPORTS_LIST = Array.from(TOURNAMENT_SPORTS);

interface TournamentDraft {
  sport: string;
  matchDate: string;
  timeSlot: string;
  teamAId: number;
  teamBId: number;
  bracketStage: string;
}

interface TournamentMgmtTabProps {
  matches: Match[];
  teams: Team[];
  loading: boolean;
  onCreateTournamentMatch: (draft: TournamentDraft) => Promise<void>;
  onDeleteMatch: (id: number) => void;
}

function initialDraft(): TournamentDraft {
  const today = new Date().toISOString().slice(0, 10);
  return {
    sport: TOURNAMENT_SPORTS_LIST[0],
    matchDate: today,
    timeSlot: TIME_SLOTS[0].value,
    teamAId: 0,
    teamBId: 0,
    bracketStage: BRACKET_STAGES[0].value,
  };
}

export function TournamentMgmtTab({
  matches,
  teams,
  loading,
  onCreateTournamentMatch,
  onDeleteMatch,
}: TournamentMgmtTabProps) {
  const [draft, setDraft] = useState<TournamentDraft>(initialDraft);

  // 토너먼트 경기만 (bracketStage != null)
  const tournamentMatches = matches.filter(m => m.bracketStage != null);

  // 종목별 그룹
  const grouped = TOURNAMENT_SPORTS_LIST.map(sport => ({
    sport,
    items: tournamentMatches.filter(m => m.sport === sport),
  })).filter(g => g.items.length > 0);

  // 선택된 종목의 학년에 맞는 팀만
  const gradeForSport = TOURNAMENT_GRADE[draft.sport];
  const selectable = filterTeamsForSport(teams, draft.sport).filter(
    t => t.grade === gradeForSport,
  );

  const renderOption = (t: Team) => (
    <option key={t.id} value={t.id}>
      {t.name}
      {t.grade != null ? ` (${t.grade}-${t.classNumber})` : ' (연합)'}
    </option>
  );

  const stageLabelMap = Object.fromEntries(
    BRACKET_STAGES.map(s => [s.value, s.label]),
  );

  const handleSubmit = async () => {
    if (!draft.teamAId || !draft.teamBId) {
      alert('양 팀을 선택해주세요.');
      return;
    }
    if (draft.teamAId === draft.teamBId) {
      alert('다른 팀을 선택해주세요.');
      return;
    }
    if (!draft.bracketStage) {
      alert('대진을 선택해주세요.');
      return;
    }
    await onCreateTournamentMatch(draft);
    setDraft(initialDraft());
  };

  return (
    <div>
      <h2 className={styles.adminSectionTitle}>{'\uD83C\uDFC6'} 토너먼트 일정</h2>

      {/* 경기 생성 폼 */}
      <div className={styles.formCard}>
        <div className={styles.formTitle}>토너먼트 경기 추가</div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>종목</label>
            <select
              className={styles.formSelect}
              value={draft.sport}
              onChange={e =>
                setDraft(prev => ({
                  ...prev,
                  sport: e.target.value,
                  teamAId: 0,
                  teamBId: 0,
                }))
              }
            >
              {TOURNAMENT_SPORTS_LIST.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>대진</label>
            <select
              className={styles.formSelect}
              value={draft.bracketStage}
              onChange={e => setDraft(prev => ({ ...prev, bracketStage: e.target.value }))}
            >
              {BRACKET_STAGES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>날짜</label>
            <input
              className={styles.formInput}
              type="date"
              value={draft.matchDate}
              onChange={e => setDraft(prev => ({ ...prev, matchDate: e.target.value }))}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>시간</label>
            <select
              className={styles.formSelect}
              value={draft.timeSlot}
              onChange={e => setDraft(prev => ({ ...prev, timeSlot: e.target.value }))}
            >
              {TIME_SLOTS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              팀 A ({gradeForSport}학년)
            </label>
            <select
              className={styles.formSelect}
              value={draft.teamAId}
              onChange={e => setDraft(prev => ({ ...prev, teamAId: Number(e.target.value) }))}
            >
              <option value={0}>팀 선택</option>
              {selectable.map(renderOption)}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              팀 B ({gradeForSport}학년)
            </label>
            <select
              className={styles.formSelect}
              value={draft.teamBId}
              onChange={e => setDraft(prev => ({ ...prev, teamBId: Number(e.target.value) }))}
            >
              <option value={0}>팀 선택</option>
              {selectable.map(renderOption)}
            </select>
          </div>
        </div>

        <button
          className={styles.formSubmitBtn}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '생성 중...' : '+ 토너먼트 경기 추가'}
        </button>
      </div>

      {/* 토너먼트 경기 목록 */}
      <div className={styles.formTitle}>
        등록된 토너먼트 경기 ({tournamentMatches.length})
      </div>

      {grouped.length === 0 ? (
        <div className={styles.noData}>등록된 토너먼트 경기가 없습니다</div>
      ) : (
        grouped.map(({ sport, items }) => (
          <div key={sport} className={styles.dateGroup}>
            <div className={styles.dateGroupHeader}>
              {sport} · {items.length}경기
            </div>
            {items.map(match => (
              <div key={match.id} className={styles.matchListItem}>
                <div className={styles.matchListLeft}>
                  <StatusBadge match={match} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: 'var(--accent)',
                      color: '#fff',
                      borderRadius: 4,
                      padding: '1px 6px',
                    }}
                  >
                    {stageLabelMap[match.bracketStage ?? ''] ?? match.bracketStage}
                  </span>
                  <span className={styles.matchListTeams}>
                    {match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}
                  </span>
                  {(match.scoreA != null || match.scoreB != null) && (
                    <span className={styles.matchListSport}>
                      {match.scoreA ?? 0} : {match.scoreB ?? 0}
                    </span>
                  )}
                  <span className={styles.matchListTime}>
                    {match.matchDate ?? '날짜미정'} · {slotLabel(match.timeSlot)}
                  </span>
                </div>
                <div className={styles.matchListActions}>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => onDeleteMatch(match.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
