import { Match } from '@/types';
import { effectiveStatus } from './adminUtils';
import styles from '@/app/admin/admin.module.css';

export function StatusBadge({ match }: { match: Match }) {
  const eff = effectiveStatus(match);
  const cls =
    eff === 'LIVE' ? styles.resultBadgeLive :
    eff === 'DONE' ? styles.resultBadgeDone :
    styles.resultBadgeScheduled;
  const text = eff === 'LIVE' ? 'LIVE' : eff === 'DONE' ? '종료' : '예정';
  return <span className={`${styles.resultBadge} ${cls}`}>{text}</span>;
}
