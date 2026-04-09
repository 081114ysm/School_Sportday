'use client';

import { useEffect, useState } from 'react';
import { Match, Team } from '@/types';
import { effectiveStatus, filterTeamsForSport, sportRestrictionLabel, slotLabel } from './adminUtils';
import { getSports, TIME_SLOTS, CATEGORIES, QUARTER_SPORTS, TOURNAMENT_SPORTS, BRACKET_STAGES } from './adminConstants';
import { StatusBadge } from './StatusBadge';
import styles from '@/app/admin/admin.module.css';

interface NewMatchForm {
  sport: string;
  matchDate: string;
  timeSlot: string;
  teamAId: number;
  teamBId: number;
  category: string;
  quarterCount?: number;
  quarterMinutes?: number;
  bracketStage?: string | null;
}

interface ScheduleMgmtTabProps {
  scheduleMatches: Match[];
  matches: Match[];
  teams: Team[];
  loading: boolean;
  newMatch: NewMatchForm;
  setNewMatch: (updater: (prev: NewMatchForm) => NewMatchForm) => void;
  onCreateMatch: () => void;
  onDeleteMatch: (id: number) => void;
  scheduleSportFilter: string;
  setScheduleSportFilter: (s: string) => void;
  scheduleDateFilter: string;
  setScheduleDateFilter: (s: string) => void;
}

export function ScheduleMgmtTab({
  scheduleMatches,
  matches,
  teams,
  loading,
  newMatch,
  setNewMatch,
  onCreateMatch,
  onDeleteMatch,
  scheduleSportFilter,
  setScheduleSportFilter,
  scheduleDateFilter,
  setScheduleDateFilter,
}: ScheduleMgmtTabProps) {
  const [sports, setSports] = useState<string[]>([]);
  useEffect(() => {
    setSports(getSports());
    const onChange = () => setSports(getSports());
    window.addEventListener('sportday:customSportsChanged', onChange);
    return () => window.removeEventListener('sportday:customSportsChanged', onChange);
  }, []);
  const selectable = filterTeamsForSport(teams, newMatch.sport);
  const label = sportRestrictionLabel(newMatch.sport);
  const suffix = label ? ` (${label})` : '';
  const renderOption = (t: Team) => (
    <option key={t.id} value={t.id}>
      {t.name}
      {t.grade != null ? ` (${t.grade}-${t.classNumber})` : ' (연합)'}
    </option>
  );

  return (
    <div>
      <h2 className={styles.adminSectionTitle}>{'\uD83D\uDCC5'} 일정 관리</h2>

      {/* 경기 생성 폼 */}
      <div className={styles.formCard}>
        <div className={styles.formTitle}>새 경기 추가</div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>종목</label>
            <select
              className={styles.formSelect}
              value={newMatch.sport}
              onChange={e =>
                setNewMatch(prev => ({
                  ...prev,
                  sport: e.target.value,
                  // 종목이 바뀌면 학년 제한이 달라질 수 있으므로 팀 선택 리셋
                  teamAId: 0,
                  teamBId: 0,
                }))
              }
            >
              {sports.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>날짜</label>
            <input
              className={styles.formInput}
              type="date"
              value={newMatch.matchDate}
              onChange={e => setNewMatch(prev => ({ ...prev, matchDate: e.target.value }))}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>시간</label>
            <select
              className={styles.formSelect}
              value={newMatch.timeSlot}
              onChange={e => setNewMatch(prev => ({ ...prev, timeSlot: e.target.value }))}
            >
              {TIME_SLOTS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>카테고리</label>
            <select
              className={styles.formSelect}
              value={newMatch.category}
              onChange={e => setNewMatch(prev => ({ ...prev, category: e.target.value }))}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {TOURNAMENT_SPORTS.has(newMatch.sport) && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>대진</label>
              <select
                className={styles.formSelect}
                value={newMatch.bracketStage ?? ''}
                onChange={e =>
                  setNewMatch(prev => ({
                    ...prev,
                    bracketStage: e.target.value || null,
                  }))
                }
              >
                <option value="">(없음)</option>
                {BRACKET_STAGES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}
          {QUARTER_SPORTS.has(newMatch.sport) && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>쿼터 수</label>
                <input
                  className={styles.formInput}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newMatch.quarterCount ?? 4}
                  onChange={e => {
                    const v = e.target.value.replace(/[^0-9]/g, '');
                    setNewMatch(prev => ({ ...prev, quarterCount: v === '' ? 4 : Number(v) }));
                  }}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>쿼터 시간(분)</label>
                <input
                  className={styles.formInput}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newMatch.quarterMinutes ?? 10}
                  onChange={e => {
                    const v = e.target.value.replace(/[^0-9]/g, '');
                    setNewMatch(prev => ({ ...prev, quarterMinutes: v === '' ? 10 : Number(v) }));
                  }}
                />
              </div>
            </>
          )}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>팀 A{suffix}</label>
            <select
              className={styles.formSelect}
              value={newMatch.teamAId}
              onChange={e => setNewMatch(prev => ({ ...prev, teamAId: Number(e.target.value) }))}
            >
              <option value={0}>팀 선택</option>
              {selectable.map(renderOption)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>팀 B{suffix}</label>
            <select
              className={styles.formSelect}
              value={newMatch.teamBId}
              onChange={e => setNewMatch(prev => ({ ...prev, teamBId: Number(e.target.value) }))}
            >
              <option value={0}>팀 선택</option>
              {selectable.map(renderOption)}
            </select>
          </div>
        </div>
        <button
          className={styles.formSubmitBtn}
          onClick={onCreateMatch}
          disabled={loading}
        >
          {loading ? '생성 중...' : '+ 경기 추가'}
        </button>
      </div>

      {/* 필터 */}
      <div className={styles.filterRow}>
        <button
          className={`${styles.filterBtn} ${scheduleSportFilter === '' ? styles.filterBtnActive : ''}`}
          onClick={() => setScheduleSportFilter('')}
        >
          전체 종목
        </button>
        {sports.map(s => (
          <button
            key={s}
            className={`${styles.filterBtn} ${scheduleSportFilter === s ? styles.filterBtnActive : ''}`}
            onClick={() => setScheduleSportFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className={styles.filterRow}>
        <input
          className={styles.formInput}
          type="date"
          value={scheduleDateFilter}
          onChange={e => setScheduleDateFilter(e.target.value)}
          style={{ maxWidth: 180 }}
        />
        {scheduleDateFilter && (
          <button
            className={styles.filterBtn}
            onClick={() => setScheduleDateFilter('')}
          >
            날짜 초기화
          </button>
        )}
      </div>

      {/* 날짜별 경기 목록 */}
      <div className={styles.formTitle}>
        등록된 경기 ({scheduleMatches.length}{scheduleMatches.length !== matches.length ? ` / ${matches.length}` : ''})
      </div>
      <div className={styles.matchList}>
        {scheduleMatches.length === 0 ? (
          <div className={styles.noData}>표시할 경기가 없습니다</div>
        ) : (
          (['LIVE', 'SCHEDULED'] as const).map(group => {
            const items = scheduleMatches.filter(m => effectiveStatus(m) === group);
            if (items.length === 0) return null;
            const groupLabel = group === 'LIVE' ? '🔴 진행 중' : '⏳ 예정';
            return (
              <div key={group} className={styles.dateGroup}>
                <div className={styles.dateGroupHeader}>
                  {groupLabel} · {items.length}경기
                </div>
                {items.map(match => (
                  <div key={match.id} className={styles.matchListItem}>
                    <div className={styles.matchListLeft}>
                      <StatusBadge match={match} />
                      <span className={styles.matchListSport}>{match.sport}</span>
                      <span className={styles.matchListTeams}>
                        {match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}
                      </span>
                      <span className={styles.matchListTime}>
                        {match.matchDate ?? '날짜미정'} · {slotLabel(match.timeSlot)} · {match.category}
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
            );
          })
        )}
      </div>
    </div>
  );
}
