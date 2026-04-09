import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.brandTitle}>
            경북소프트웨어마이스터고등학교
          </div>
          <div className={styles.brandSub}>2026 체육대회 예선전</div>
          <p className={styles.brandDesc}>
            예선부터 결승까지, 모든 경기를 한 곳에서. 경기 일정·실시간 중계·
            순위표를 실시간으로 확인하세요.
          </p>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>바로가기</div>
          <ul className={styles.list}>
            <li><Link href="/schedule">경기 일정</Link></li>
            <li><Link href="/today">오늘 경기</Link></li>
            <li><Link href="/rankings">랭킹표</Link></li>
            <li><Link href="/youtube">유튜브 중계</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>학교 정보</div>
          <ul className={styles.list}>
            <li>경상북도 경주시</li>
            <li>경북소프트웨어마이스터고</li>
            <li>학생자치회 주관</li>
          </ul>
        </div>
      </div>
      <div className={styles.copy}>
        &copy; 2026 경북소프트웨어마이스터고등학교 체육대회 예선전. All rights reserved.
      </div>
    </footer>
  );
}
