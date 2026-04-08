import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>&copy; 2026 경북소프트웨어마이스터고등학교 체육대회 예선전</span>
        <div className={styles.links}>
          <Link href="/admin">관리자</Link>
        </div>
      </div>
    </footer>
  );
}
