'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Calendar, Radio, Tv, Trophy, Bell } from 'lucide-react';
import styles from './Header.module.css';

const NAV = [
  { href: '/schedule', label: '일정', icon: Calendar },
  { href: '/today', label: '실시간', icon: Radio },
  { href: '/youtube', label: '유튜브', icon: Tv },
  { href: '/rankings', label: '순위', icon: Trophy },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/logo.png"
            alt="경소마 로고"
            width={40}
            height={40}
            className={styles.logoImg}
            priority
          />
          <div className={styles.logoTextWrap}>
            <span className={styles.school}>경북소프트웨어마이스터고등학교</span>
            <span className={styles.event}>2026 체육대회 예선전</span>
          </div>
        </Link>

        <nav className={styles.nav}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
              >
                <Icon size={16} aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.right}>
          <Link href="/notifications" className={styles.iconBtn} title="알림">
            <Bell size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
