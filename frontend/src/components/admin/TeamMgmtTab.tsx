'use client';

import { Team } from '@/types';
import styles from '@/app/admin/admin.module.css';

interface NewTeamForm {
  name: string;
  grade: number;
  classNumber: number;
}

interface TeamMgmtTabProps {
  teams: Team[];
  loading: boolean;
  newTeam: NewTeamForm;
  setNewTeam: (updater: (prev: NewTeamForm) => NewTeamForm) => void;
  onCreateTeam: () => void;
  onDeleteTeam: (id: number) => void;
}

export function TeamMgmtTab({
  teams,
  loading,
  newTeam,
  setNewTeam,
  onCreateTeam,
  onDeleteTeam,
}: TeamMgmtTabProps) {
  return (
    <div>
      <h2 className={styles.adminSectionTitle}>{'\uD83D\uDC65'} 팀 관리</h2>

      {/* 팀 생성 폼 */}
      <div className={styles.teamFormCard}>
        <div className={styles.formTitle}>새 팀 추가</div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>팀 이름</label>
            <input
              className={styles.formInput}
              type="text"
              placeholder="팀 이름 입력"
              value={newTeam.name}
              onChange={e => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>학년</label>
            <select
              className={styles.formSelect}
              value={newTeam.grade}
              onChange={e => setNewTeam(prev => ({ ...prev, grade: Number(e.target.value) }))}
            >
              <option value={1}>1학년</option>
              <option value={2}>2학년</option>
              <option value={3}>3학년</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>반</label>
            <select
              className={styles.formSelect}
              value={newTeam.classNumber}
              onChange={e => setNewTeam(prev => ({ ...prev, classNumber: Number(e.target.value) }))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={n}>{n}반</option>
              ))}
            </select>
          </div>
        </div>
        <button
          className={styles.formSubmitBtn}
          onClick={onCreateTeam}
          disabled={loading}
        >
          {loading ? '생성 중...' : '+ 팀 추가'}
        </button>
      </div>

      {/* 팀 목록 */}
      <div className={styles.formTitle}>등록된 팀 ({teams.length})</div>
      {teams.length === 0 ? (
        <div className={styles.noData}>등록된 팀이 없습니다</div>
      ) : (
        <div className={styles.teamList}>
          {teams.map(team => (
            <div key={team.id} className={styles.teamListItem}>
              <div className={styles.teamListInfo}>
                <div className={styles.teamListAvatar}>
                  {team.name.charAt(0)}
                </div>
                <div>
                  <div className={styles.teamListName}>{team.name}</div>
                  <div className={styles.teamListGrade}>{team.grade}학년 {team.classNumber}반</div>
                </div>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={() => onDeleteTeam(team.id)}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
