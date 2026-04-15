'use client';

import { useState } from 'react';
import { Match, Team } from '@/types';
import { slotLabel } from './adminUtils';
import {
  TIME_SLOTS,
  BRACKET_STAGES,
  TOURNAMENT_GRADE_SPORTS,
  CLUB_TOURNAMENT_SPORTS,
} from './adminConstants';
import { StatusBadge } from './StatusBadge';
import { getMatchScorePair } from '@/lib/matchScore';
import styles from '@/app/admin/admin.module.css';

function getSemiWinner(match: Match | undefined): Team | undefined {
  if (!match || match.status !== 'DONE') return undefined;
  const { a, b } = getMatchScorePair(match);
  if (a > b) return match.teamA ?? undefined;
  if (b > a) return match.teamB ?? undefined;
  return undefined;
}

interface CreatePayload {
  sport: string;
  grade?: number;
  category?: string;
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
  onCreateTournamentMatch: (draft: CreatePayload) => Promise<void>;
  onDeleteMatch: (id: number) => void;
}

interface TournamentForm {
  tournamentMode: 'grade' | 'club'; // 학년전 / 연합전
  grade: number;
  sportIndex: number;   // index into TOURNAMENT_GRADE_SPORTS[grade] (grade 모드)
  clubSport: string;    // 연합 모드 종목
  batchSemis: boolean;  // true = SEMI1+SEMI2 일괄 추가
  bracketStage: string; // single 모드 대진
  matchDate: string;
  timeSlot: string;
  // SEMI1 (single 모드에서도 사용)
  teamAId: number;
  teamBId: number;
  // SEMI2 batch 전용
  semi2TeamAId: number;
  semi2TeamBId: number;
}

function initialForm(): TournamentForm {
  const today = new Date().toISOString().slice(0, 10);
  return {
    tournamentMode: 'grade',
    grade: 1,
    sportIndex: 0,
    clubSport: CLUB_TOURNAMENT_SPORTS[0],
    batchSemis: false,
    bracketStage: 'SEMI1',
    matchDate: today,
    timeSlot: TIME_SLOTS[0].value,
    teamAId: 0,
    teamBId: 0,
    semi2TeamAId: 0,
    semi2TeamBId: 0,
  };
}

const GRADE_LABELS: Record<number, string> = { 1: '1학년', 2: '2학년', 3: '3학년' };

export function TournamentMgmtTab({
  matches,
  teams,
  loading,
  onCreateTournamentMatch,
  onDeleteMatch,
}: TournamentMgmtTabProps) {
  const [form, setForm] = useState<TournamentForm>(initialForm);

  const isClubMode = form.tournamentMode === 'club';

  // 학년전 모드
  const sportConfigs = TOURNAMENT_GRADE_SPORTS[form.grade] ?? [];
  const currentSport = sportConfigs[form.sportIndex] ?? sportConfigs[0];
  const activeSportName = isClubMode ? form.clubSport : (currentSport?.sport ?? '');

  // 팀 목록: 학년전=해당 학년 팀, 연합전=CLUB 팀
  const gradeTeams = teams.filter(
    t => t.grade === form.grade && t.category !== 'CLUB',
  );
  const clubTeams = teams.filter(t => t.category === 'CLUB');
  const activeTeams = isClubMode ? clubTeams : gradeTeams;

  // 결승 시 준결승 승자만 선택 가능 (학년전 전용)
  const semi1Match = !isClubMode ? matches.find(
    m =>
      m.sport === activeSportName &&
      m.bracketStage === 'SEMI1' &&
      (m.teamA?.grade === form.grade || m.teamB?.grade === form.grade),
  ) : undefined;
  const semi2Match = !isClubMode ? matches.find(
    m =>
      m.sport === activeSportName &&
      m.bracketStage === 'SEMI2' &&
      (m.teamA?.grade === form.grade || m.teamB?.grade === form.grade),
  ) : undefined;
  const semi1Winner = getSemiWinner(semi1Match);
  const semi2Winner = getSemiWinner(semi2Match);
  const semiWinners = [semi1Winner, semi2Winner].filter((t): t is Team => !!t);

  const isFinal = !form.batchSemis && form.bracketStage === 'FINAL';
  const selectableTeams =
    !isClubMode && isFinal && semiWinners.length > 0 ? semiWinners : activeTeams;

  const finalHint =
    isFinal && semiWinners.length < 2
      ? `준결승 결과 대기 중 (${semiWinners.length}/2 확정)`
      : null;

  const stageLabelMap = Object.fromEntries(
    BRACKET_STAGES.map(s => [s.value, s.label]),
  );

  // 토너먼트 경기 목록 (bracketStage 있는 것만)
  const tournamentMatches = matches.filter(m => m.bracketStage != null);
  const allSports = Array.from(new Set(tournamentMatches.map(m => m.sport)));
  const grouped = allSports
    .map(sport => ({
      sport,
      items: tournamentMatches.filter(m => m.sport === sport),
    }))
    .filter(g => g.items.length > 0);

  const renderOption = (t: Team) => (
    <option key={t.id} value={t.id}>
      {t.name} ({t.grade}-{t.classNumber})
    </option>
  );

  const handleSubmit = async () => {
    if (!currentSport) {
      alert('종목을 선택해주세요.');
      return;
    }

    const category = isClubMode ? 'CLUB' : 'GRADE';
    const grade = isClubMode ? undefined : form.grade;

    if (form.batchSemis) {
      if (!form.teamAId || !form.teamBId) {
        alert('준결승 1 양 팀을 선택해주세요.');
        return;
      }
      if (form.teamAId === form.teamBId) {
        alert('준결승 1: 다른 팀을 선택해주세요.');
        return;
      }
      if (!form.semi2TeamAId || !form.semi2TeamBId) {
        alert('준결승 2 양 팀을 선택해주세요.');
        return;
      }
      if (form.semi2TeamAId === form.semi2TeamBId) {
        alert('준결승 2: 다른 팀을 선택해주세요.');
        return;
      }
      await onCreateTournamentMatch({
        sport: activeSportName,
        grade,
        category,
        matchDate: form.matchDate,
        timeSlot: form.timeSlot,
        teamAId: form.teamAId,
        teamBId: form.teamBId,
        bracketStage: 'SEMI1',
      });
      await onCreateTournamentMatch({
        sport: activeSportName,
        grade,
        category,
        matchDate: form.matchDate,
        timeSlot: form.timeSlot,
        teamAId: form.semi2TeamAId,
        teamBId: form.semi2TeamBId,
        bracketStage: 'SEMI2',
      });
    } else {
      if (!form.teamAId || !form.teamBId) {
        alert('양 팀을 선택해주세요.');
        return;
      }
      if (form.teamAId === form.teamBId) {
        alert('다른 팀을 선택해주세요.');
        return;
      }
      await onCreateTournamentMatch({
        sport: activeSportName,
        grade,
        category,
        matchDate: form.matchDate,
        timeSlot: form.timeSlot,
        teamAId: form.teamAId,
        teamBId: form.teamBId,
        bracketStage: form.bracketStage,
      });
    }

    setForm(initialForm());
  };

  return (
    <div>
      <h2 className={styles.adminSectionTitle}>🏆 토너먼트 일정</h2>

      {/* 경기 생성 폼 */}
      <div className={styles.formCard}>
        <div className={styles.formTitle}>토너먼트 경기 추가</div>
        <div className={styles.formGrid}>

          {/* 학년전 / 연합전 모드 선택 */}
          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.formLabel}>모드</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['grade', 'club'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    setForm(prev => ({
                      ...prev,
                      tournamentMode: mode,
                      teamAId: 0,
                      teamBId: 0,
                      semi2TeamAId: 0,
                      semi2TeamBId: 0,
                    }))
                  }
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                    background: form.tournamentMode === mode ? 'var(--accent)' : 'var(--card2, var(--card))',
                    color: form.tournamentMode === mode ? '#fff' : 'var(--text)',
                  }}
                >
                  {mode === 'grade' ? '🎓 학년전' : '🤝 연합전'}
                </button>
              ))}
            </div>
          </div>

          {/* 학년전: 학년 선택 */}
          {!isClubMode && (
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.formLabel}>학년</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([1, 2, 3] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() =>
                      setForm(prev => ({
                        ...prev,
                        grade: g,
                        sportIndex: 0,
                        teamAId: 0,
                        teamBId: 0,
                        semi2TeamAId: 0,
                        semi2TeamBId: 0,
                      }))
                    }
                    style={{
                      padding: '6px 16px',
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 13,
                      background: form.grade === g ? 'var(--green)' : 'var(--card2, var(--card))',
                      color: form.grade === g ? '#fff' : 'var(--text)',
                    }}
                  >
                    {GRADE_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 학년전: 종목 선택 (선택 학년에 해당하는 종목만) */}
          {!isClubMode && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>종목</label>
              <select
                className={styles.formSelect}
                value={form.sportIndex}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    sportIndex: Number(e.target.value),
                    teamAId: 0,
                    teamBId: 0,
                    semi2TeamAId: 0,
                    semi2TeamBId: 0,
                  }))
                }
              >
                {sportConfigs.map((cfg, idx) => (
                  <option key={idx} value={idx}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 연합전: 종목 선택 */}
          {isClubMode && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>종목</label>
              <select
                className={styles.formSelect}
                value={form.clubSport}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    clubSport: e.target.value,
                    teamAId: 0,
                    teamBId: 0,
                    semi2TeamAId: 0,
                    semi2TeamBId: 0,
                  }))
                }
              >
                {CLUB_TOURNAMENT_SPORTS.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 추가 방식: 단일 / 준결승 일괄 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>추가 방식</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, batchSemis: false, teamAId: 0, teamBId: 0 }))}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 12,
                  background: !form.batchSemis ? 'var(--green)' : 'var(--card2, var(--card))',
                  color: !form.batchSemis ? '#fff' : 'var(--text)',
                }}
              >
                단일 추가
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, batchSemis: true, teamAId: 0, teamBId: 0, semi2TeamAId: 0, semi2TeamBId: 0 }))}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 12,
                  background: form.batchSemis ? 'var(--green)' : 'var(--card2, var(--card))',
                  color: form.batchSemis ? '#fff' : 'var(--text)',
                }}
              >
                준결승 일괄
              </button>
            </div>
          </div>

          {/* 단일 모드: 대진 선택 */}
          {!form.batchSemis && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>대진</label>
              <select
                className={styles.formSelect}
                value={form.bracketStage}
                onChange={e =>
                  setForm(prev => ({ ...prev, bracketStage: e.target.value, teamAId: 0, teamBId: 0 }))
                }
              >
                {BRACKET_STAGES.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>날짜</label>
            <input
              className={styles.formInput}
              type="date"
              value={form.matchDate}
              onChange={e => setForm(prev => ({ ...prev, matchDate: e.target.value }))}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>시간</label>
            <select
              className={styles.formSelect}
              value={form.timeSlot}
              onChange={e => setForm(prev => ({ ...prev, timeSlot: e.target.value }))}
            >
              {TIME_SLOTS.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {finalHint && (
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
                ⚠ {finalHint}
              </div>
            </div>
          )}

          {/* 팀 선택 */}
          {form.batchSemis ? (
            <>
              {/* 준결승 1 */}
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
                  준결승 1
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <select
                    className={styles.formSelect}
                    value={form.teamAId}
                    onChange={e => setForm(prev => ({ ...prev, teamAId: Number(e.target.value) }))}
                  >
                    <option value={0}>팀 A 선택</option>
                    {activeTeams.map(renderOption)}
                  </select>
                  <select
                    className={styles.formSelect}
                    value={form.teamBId}
                    onChange={e => setForm(prev => ({ ...prev, teamBId: Number(e.target.value) }))}
                  >
                    <option value={0}>팀 B 선택</option>
                    {activeTeams.map(renderOption)}
                  </select>
                </div>
              </div>
              {/* 준결승 2 */}
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
                  준결승 2
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <select
                    className={styles.formSelect}
                    value={form.semi2TeamAId}
                    onChange={e => setForm(prev => ({ ...prev, semi2TeamAId: Number(e.target.value) }))}
                  >
                    <option value={0}>팀 A 선택</option>
                    {activeTeams.map(renderOption)}
                  </select>
                  <select
                    className={styles.formSelect}
                    value={form.semi2TeamBId}
                    onChange={e => setForm(prev => ({ ...prev, semi2TeamBId: Number(e.target.value) }))}
                  >
                    <option value={0}>팀 B 선택</option>
                    {activeTeams.map(renderOption)}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  팀 A{isFinal ? ' (준결승 승자)' : ''}
                </label>
                <select
                  className={styles.formSelect}
                  value={form.teamAId}
                  onChange={e => setForm(prev => ({ ...prev, teamAId: Number(e.target.value) }))}
                >
                  <option value={0}>팀 선택</option>
                  {selectableTeams.map(renderOption)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  팀 B{isFinal ? ' (준결승 승자)' : ''}
                </label>
                <select
                  className={styles.formSelect}
                  value={form.teamBId}
                  onChange={e => setForm(prev => ({ ...prev, teamBId: Number(e.target.value) }))}
                >
                  <option value={0}>팀 선택</option>
                  {selectableTeams.map(renderOption)}
                </select>
              </div>
            </>
          )}
        </div>

        <button
          className={styles.formSubmitBtn}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? '생성 중...'
            : form.batchSemis
            ? '+ 준결승 1·2 일괄 추가'
            : '+ 토너먼트 경기 추가'}
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
