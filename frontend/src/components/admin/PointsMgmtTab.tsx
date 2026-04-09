'use client';

import { useState } from 'react';
import { Team } from '@/types';
import { updateTeamPoints } from '@/services/api';
import adminStyles from '@/app/admin/admin.module.css';
import styles from './PointsMgmtTab.module.css';

interface PointsMgmtTabProps {
  teams: Team[];
  onRefresh: () => void;
}

export function PointsMgmtTab({ teams, onRefresh }: PointsMgmtTabProps) {
  const nonClubTeams = teams
    .filter((t) => t.category !== 'CLUB')
    .sort((a, b) => {
      if ((a.grade ?? 0) !== (b.grade ?? 0)) return (a.grade ?? 0) - (b.grade ?? 0);
      return (a.classNumber ?? 0) - (b.classNumber ?? 0);
    });

  const [inputValues, setInputValues] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  async function commit(teamId: number, next: number) {
    setSaving((p) => ({ ...p, [teamId]: true }));
    try {
      await updateTeamPoints(teamId, next);
      onRefresh();
    } finally {
      setSaving((p) => ({ ...p, [teamId]: false }));
    }
  }

  const grouped = new Map<number, Team[]>();
  nonClubTeams.forEach((t) => {
    const g = t.grade ?? 0;
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push(t);
  });

  return (
    <div>
      <h2 className={adminStyles.adminSectionTitle}>🎯 승점 관리</h2>
      <p className={styles.desc}>
        팀별 승점을 수동으로 가감합니다. 조정값은 경기 결과로 계산된 승점에
        더해져 순위 페이지에 반영됩니다.
      </p>

      {nonClubTeams.length === 0 ? (
        <div className={adminStyles.noData}>등록된 팀이 없습니다</div>
      ) : (
        Array.from(grouped.entries()).map(([grade, list]) => (
          <section key={grade} className={styles.gradeSection}>
            <div className={styles.gradeHeader}>{grade}학년</div>
            <div className={styles.grid}>
              {list.map((team) => {
                const adj = team.pointsAdjustment ?? 0;
                const busy = saving[team.id] ?? false;
                const inputVal = inputValues[team.id] ?? '';
                const cls =
                  adj > 0 ? styles.valuePos : adj < 0 ? styles.valueNeg : styles.valueZero;
                return (
                  <div key={team.id} className={styles.card}>
                    <div className={styles.cardHead}>
                      <div className={styles.teamBadge}>{team.name.slice(-2)}</div>
                      <div className={styles.teamName}>{team.name}</div>
                    </div>

                    <div className={styles.valueRow}>
                      <span className={styles.valueLabel}>조정 승점</span>
                      <span className={`${styles.valueNum} ${cls}`}>
                        {adj > 0 ? `+${adj}` : adj}
                      </span>
                    </div>

                    <div className={styles.stepRow}>
                      <button
                        type="button"
                        className={`${styles.stepBtn} ${styles.stepMinus}`}
                        onClick={() => commit(team.id, adj - 1)}
                        disabled={busy}
                      >
                        −1
                      </button>
                      <button
                        type="button"
                        className={`${styles.stepBtn} ${styles.stepPlus}`}
                        onClick={() => commit(team.id, adj + 1)}
                        disabled={busy}
                      >
                        +1
                      </button>
                    </div>

                    <div className={styles.directRow}>
                      <input
                        type="number"
                        className={styles.directInput}
                        placeholder="직접 입력"
                        value={inputVal}
                        onChange={(e) =>
                          setInputValues((p) => ({ ...p, [team.id]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className={styles.saveBtn}
                        onClick={() => {
                          const v = parseInt(inputVal, 10);
                          if (isNaN(v)) return;
                          commit(team.id, v);
                          setInputValues((p) => ({ ...p, [team.id]: '' }));
                        }}
                        disabled={busy || inputVal === ''}
                      >
                        저장
                      </button>
                    </div>

                    <button
                      type="button"
                      className={styles.resetBtn}
                      onClick={() => commit(team.id, 0)}
                      disabled={busy || adj === 0}
                    >
                      초기화
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
