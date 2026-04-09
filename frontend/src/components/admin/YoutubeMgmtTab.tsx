'use client';

import { Match } from '@/types';
import { effectiveStatus, slotLabel } from './adminUtils';
import { StatusBadge } from './StatusBadge';
import styles from '@/app/admin/admin.module.css';

interface YoutubeMgmtTabProps {
  sortedByDate: Match[];
  onSetMatchYoutube: (matchId: number, url: string | null) => void;
  onMatchStatusChange: (matchId: number) => void;
}

export function YoutubeMgmtTab({
  sortedByDate,
  onSetMatchYoutube,
  onMatchStatusChange,
}: YoutubeMgmtTabProps) {
  return (
    <div>
      <h2 className={styles.adminSectionTitle}>{'\uD83D\uDCFA'} 유튜브 라이브 관리</h2>
      <div className={styles.matchList}>
        {sortedByDate.length === 0 ? (
          <div className={styles.noData}>등록된 경기가 없습니다</div>
        ) : (
          (['LIVE', 'SCHEDULED', 'DONE'] as const).map(group => {
            const items = sortedByDate.filter(m => effectiveStatus(m) === group);
            if (items.length === 0) return null;
            const groupLabel = group === 'LIVE' ? '🔴 진행 중' : group === 'SCHEDULED' ? '⏳ 예정' : '✅ 종료';
            return (
              <div key={group} className={styles.dateGroup}>
                <div className={styles.dateGroupHeader}>{groupLabel} · {items.length}경기</div>
                {items.map(match => (
                  <div key={match.id} className={styles.matchListItem}>
                    <div className={styles.matchListLeft}>
                      <StatusBadge match={match} />
                      <span className={styles.matchListSport}>{match.sport}</span>
                      <span className={styles.matchListTeams}>
                        {match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}
                      </span>
                      <span className={styles.matchListTime}>
                        {match.matchDate ?? '날짜미정'} {slotLabel(match.timeSlot)}
                      </span>
                    </div>
                    <div className={styles.matchListActions} style={{ gap: 6 }}>
                      <input
                        className={styles.formInput}
                        type="text"
                        defaultValue={match.youtubeUrl ?? ''}
                        placeholder="YouTube URL"
                        style={{ minWidth: 220 }}
                        id={`yt-${match.id}`}
                      />
                      <button
                        className={styles.formSubmitBtn}
                        style={{ padding: '8px 14px', fontSize: 12 }}
                        onClick={() => {
                          const el = document.getElementById(`yt-${match.id}`) as HTMLInputElement | null;
                          const url = el?.value.trim() || null;
                          onSetMatchYoutube(match.id, url);
                        }}
                      >
                        등록 / 라이브
                      </button>
                      {match.status !== 'DONE' && (
                        <button
                          className={`${styles.actionBtn} ${styles.btnEnd}`}
                          style={{ padding: '8px 14px', fontSize: 12 }}
                          onClick={() => onMatchStatusChange(match.id)}
                        >
                          경기 종료
                        </button>
                      )}
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
