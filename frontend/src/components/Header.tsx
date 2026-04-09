'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Calendar, Radio, Tv, Trophy, Bell, Swords, Menu, X, ShieldCheck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import styles from './Header.module.css';

const NAV = [
  { href: '/schedule', label: '일정', icon: Calendar },
  { href: '/today', label: '실시간', icon: Radio },
  { href: '/tournament', label: '토너먼트', icon: Swords },
  { href: '/youtube', label: '유튜브', icon: Tv },
  { href: '/rankings', label: '순위', icon: Trophy },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isAdmin = pathname?.startsWith('/admin');

  return (
    <header className={`${styles.header}${isAdmin ? ` ${styles.adminHidden}` : ''}`}>
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

        {/* Desktop nav */}
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

        {/* Desktop right */}
        <div className={`${styles.right} ${styles.rightDesktop}`}>
          <Link href="/notifications" className={styles.iconBtn} title="알림">
            <Bell size={18} />
          </Link>
          <Link href="/admin" className={styles.iconBtn} title="관리자">
            <ShieldCheck size={18} />
          </Link>
        </div>

        {/* Mobile right group */}
        <div className={`${styles.right} ${styles.rightMobile}`} ref={menuRef}>
          <Link href="/notifications" className={styles.iconBtn} title="알림">
            <Bell size={18} />
          </Link>
          <Link href="/admin" className={styles.iconBtn} title="관리자">
            <ShieldCheck size={18} />
          </Link>
          <button
            className={styles.iconBtn}
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Mobile dropdown */}
          <nav
            className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}
            aria-hidden={!menuOpen}
          >
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`${styles.mobileNavItem} ${active ? styles.navItemActive : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={16} aria-hidden />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
