'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Calendar, Trophy, Radio, Tv, ArrowRight, Swords, Settings } from 'lucide-react';
import styles from './home.module.css';
import PhotoCarousel from '@/components/main/PhotoCarousel';
import { fetchMatches, fetchTeams, fetchLiveMatches } from '@/services/api';

export default function HomePage() {
  const [stats, setStats] = useState({ total: 0, done: 0, live: 0, teams: 0 });

  useEffect(() => {
    Promise.all([
      fetchMatches().catch(() => []),
      fetchTeams().catch(() => []),
      fetchLiveMatches().catch(() => []),
    ]).then(([matches, teams, live]) => {
      setStats({
        total: matches.length,
        done: matches.filter((m) => m.status === 'DONE').length,
        live: live.length,
        teams: teams.filter((t) => t.category !== 'CLUB').length,
      });
    });
  }, []);

  return (
    <div className={styles.wrap}>
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>
            2026 경소마고<br />
            <span className={styles.heroAccent}>체육대회 예선전</span>
          </h1>
          <p className={styles.heroDesc}>
            예선부터 결승까지, 전 경기 실시간으로 따라가기.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/schedule" className={styles.ctaPrimary}>
              <Calendar size={16} />
              경기 일정
              <ArrowRight size={14} />
            </Link>
            <Link href="/rankings" className={styles.ctaSecondary}>
              <Trophy size={16} />
              리그전 순위
            </Link>
          </div>

          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>총 경기</dt>
              <dd>{stats.total}</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>완료</dt>
              <dd>{stats.done}</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>진행 중</dt>
              <dd>
                {stats.live}
                {stats.live > 0 && <span className={styles.liveDot} aria-hidden />}
              </dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>참가팀</dt>
              <dd>{stats.teams}</dd>
            </div>
          </dl>
        </div>
        <div className={styles.heroRight}>
          <PhotoCarousel />
        </div>
      </section>

      <nav className={styles.shortcuts} aria-label="바로가기">
        <Shortcut href="/schedule" icon={<Calendar size={16} />} label="경기 일정" />
        <Shortcut href="/today" icon={<Radio size={16} />} label="오늘 경기" live={stats.live > 0} />
        <Shortcut href="/tournament" icon={<Swords size={16} />} label="토너먼트" />
        <Shortcut href="/rankings" icon={<Trophy size={16} />} label="랭킹표" />
        <Shortcut href="/youtube" icon={<Tv size={16} />} label="유튜브 중계" />
        <Shortcut href="/admin" icon={<Settings size={16} />} label="관리자" />
      </nav>
    </div>
  );
}

function Shortcut({
  href,
  icon,
  label,
  live,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  live?: boolean;
}) {
  return (
    <Link href={href} className={styles.shortcut}>
      <span className={styles.shortcutIcon}>{icon}</span>
      <span className={styles.shortcutLabel}>{label}</span>
      {live && <span className={styles.shortcutLive}>LIVE</span>}
      <ArrowRight size={14} className={styles.shortcutArrow} />
    </Link>
  );
}
