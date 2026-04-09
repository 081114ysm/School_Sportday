'use client';

import { useState } from 'react';
import { Team } from '@/types';
import { updateTeamPoints } from '@/services/api';
import styles from '@/app/admin/admin.module.css';

interface PointsMgmtTabProps {
  teams: Team[];
  onRefresh: () => void;
}

export function PointsMgmtTab({ teams, onRefresh }: PointsMgmtTabProps) {
  const nonClubTeams = teams.filter((t) => t.category !== 'CLUB');

  const [inputValues, setInputValues] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  async function handleDelta(team: Team, delta: number) {
    const current = team.pointsAdjustment ?? 0;
    const next = current + delta;
    setSaving((prev) => ({ ...prev, [team.id]: true }));
    try {
      await updateTeamPoints(team.id, next);
      onRefresh();
    } finally {
      setSaving((prev) => ({ ...prev, [team.id]: false }));
    }
  }

  async function handleSave(team: Team) {
    const raw = inputValues[team.id];
    const val = parseInt(raw ?? '', 10);
    if (isNaN(val)) return;
    setSaving((prev) => ({ ...prev, [team.id]: true }));
    try {
      await updateTeamPoints(team.id, val);
      setInputValues((prev) => ({ ...prev, [team.id]: '' }));
      onRefresh();
    } finally {
      setSaving((prev) => ({ ...prev, [team.id]: false }));
    }
  }

  async function handleReset(team: Team) {
    setSaving((prev) => ({ ...prev, [team.id]: true }));
    try {
      await updateTeamPoints(team.id, 0);
      onRefresh();
    } finally {
      setSaving((prev) => ({ ...prev, [team.id]: false }));
    }
  }

  return (
    <div>
      <h2 className={styles.adminSectionTitle}>🎯 승점 관리</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
        팀별 승점을 수동으로 가감합니다. 조정값은 자동 계산 승점에 더해집니다.
      </p>

      {nonClubTeams.length === 0 ? (
        <div className={styles.noData}>등록된 팀이 없습니다</div>
      ) : (
        <div className={styles.teamList}>
          {nonClubTeams.map((team) => {
            const adj = team.pointsAdjustment ?? 0;
            const isBusy = saving[team.id] ?? false;
            return (
              <div key={team.id} className={styles.teamListItem}>
                <div className={styles.teamListInfo}>
                  <div className={styles.teamListAvatar}>{team.name.charAt(0)}</div>
                  <div>
                    <div className={styles.teamListName}>{team.name}</div>
                    <div className={styles.teamListGrade}>
                      조정 승점:{' '}
                      <strong
                        style={{
                          color: adj > 0 ? 'var(--green)' : adj < 0 ? 'var(--red)' : 'var(--text2)',
                        }}
                      >
                        {adj > 0 ? `+${adj}` : adj}
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    className={styles.deleteBtn}
                    style={{ background: 'var(--green)', border: 'none', color: '#fff', minWidth: 36 }}
                    onClick={() => handleDelta(team, 1)}
                    disabled={isBusy}
                  >
                    +1
                  </button>
                  <button
                    className={styles.deleteBtn}
                    style={{ background: 'var(--red)', border: 'none', color: '#fff', minWidth: 36 }}
                    onClick={() => handleDelta(team, -1)}
                    disabled={isBusy}
                  >
                    -1
                  </button>
                  <input
                    className={styles.formInput}
                    type="number"
                    placeholder="직접 입력"
                    style={{ width: 90, padding: '4px 8px', fontSize: 13 }}
                    value={inputValues[team.id] ?? ''}
                    onChange={(e) =>
                      setInputValues((prev) => ({ ...prev, [team.id]: e.target.value }))
                    }
                  />
                  <button
                    className={styles.formSubmitBtn}
                    style={{ padding: '4px 12px', fontSize: 13 }}
                    onClick={() => handleSave(team)}
                    disabled={isBusy || !inputValues[team.id]}
                  >
                    저장
                  </button>
                  <button
                    className={styles.deleteBtn}
                    style={{ fontSize: 12 }}
                    onClick={() => handleReset(team)}
                    disabled={isBusy}
                  >
                    초기화
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
