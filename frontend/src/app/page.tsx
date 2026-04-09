'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Calendar, Trophy, Radio, Tv, ArrowRight } from 'lucide-react';
import styles from './home.module.css';
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
        teams: teams.length,
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
          <AthleteIllustration />
        </div>
      </section>

      <nav className={styles.shortcuts} aria-label="바로가기">
        <Shortcut href="/schedule" icon={<Calendar size={16} />} label="경기 일정" />
        <Shortcut href="/today" icon={<Radio size={16} />} label="오늘 경기" live={stats.live > 0} />
        <Shortcut href="/rankings" icon={<Trophy size={16} />} label="랭킹표" />
        <Shortcut href="/youtube" icon={<Tv size={16} />} label="유튜브 중계" />
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

function AthleteIllustration() {
  return (
    <svg
      viewBox="0 0 360 420"
      className={styles.athleteSvg}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#d9f5e6" />
          <stop offset="100%" stopColor="#f6f8fa" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="skinGrad" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffe2c2" />
          <stop offset="60%" stopColor="#f2c8a0" />
          <stop offset="100%" stopColor="#c99570" />
        </radialGradient>
        <radialGradient id="jerseyGrad" cx="35%" cy="25%" r="95%">
          <stop offset="0%" stopColor="#6fe6a8" />
          <stop offset="45%" stopColor="#2bbf7e" />
          <stop offset="100%" stopColor="#0f6d44" />
        </radialGradient>
        <radialGradient id="jerseyGradDark" cx="60%" cy="70%" r="80%">
          <stop offset="0%" stopColor="#1d9a63" />
          <stop offset="100%" stopColor="#0a5433" />
        </radialGradient>
        <radialGradient id="shortsGrad" cx="40%" cy="25%" r="90%">
          <stop offset="0%" stopColor="#3a4453" />
          <stop offset="60%" stopColor="#111827" />
          <stop offset="100%" stopColor="#05070b" />
        </radialGradient>
        <radialGradient id="legGrad" cx="40%" cy="20%" r="90%">
          <stop offset="0%" stopColor="#2a3442" />
          <stop offset="70%" stopColor="#0d1117" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <radialGradient id="hairGrad" cx="40%" cy="25%" r="80%">
          <stop offset="0%" stopColor="#3a3f47" />
          <stop offset="70%" stopColor="#0d1117" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <radialGradient id="ballGrad" cx="32%" cy="28%" r="85%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#eef0f3" />
          <stop offset="100%" stopColor="#9ca3af" />
        </radialGradient>
        <linearGradient id="shoeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a3442" />
          <stop offset="100%" stopColor="#000" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
        <filter id="drop" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="4" result="off" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.35" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 배경 원형 */}
      <circle cx="180" cy="200" r="170" fill="url(#bgGrad)" />

      {/* 바닥 그림자 */}
      <ellipse cx="180" cy="388" rx="118" ry="10" fill="#0d1117" opacity="0.18" />
      <ellipse cx="180" cy="388" rx="90" ry="6" fill="#0d1117" opacity="0.15" />

      <g filter="url(#drop)">
        {/* 뒷다리 */}
        <path
          d="M165 275 Q150 325 135 375 L160 378 Q172 330 182 285 Z"
          fill="url(#legGrad)"
        />
        {/* 뒷다리 하이라이트 */}
        <path d="M168 280 Q158 325 150 372" stroke="#4b5563" strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round" />

        {/* 앞다리 */}
        <path
          d="M195 275 Q210 325 215 378 L240 378 Q230 325 220 285 Z"
          fill="url(#legGrad)"
        />
        <path d="M205 280 Q215 325 222 372" stroke="#4b5563" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round" />

        {/* 신발 */}
        <rect x="128" y="370" width="40" height="14" rx="5" fill="url(#shoeGrad)" />
        <rect x="208" y="370" width="42" height="14" rx="5" fill="url(#shoeGrad)" />
        <rect x="128" y="370" width="40" height="3" rx="1.5" fill="#2bbf7e" />
        <rect x="208" y="370" width="42" height="3" rx="1.5" fill="#2bbf7e" />
        <ellipse cx="148" cy="384" rx="20" ry="1.5" fill="#fff" opacity="0.25" />
        <ellipse cx="229" cy="384" rx="20" ry="1.5" fill="#fff" opacity="0.25" />

        {/* 반바지 */}
        <path
          d="M140 250 Q180 235 230 250 L232 292 Q180 302 138 292 Z"
          fill="url(#shortsGrad)"
        />
        <path d="M178 252 L182 292" stroke="#2bbf7e" strokeWidth="3" opacity="0.85" strokeLinecap="round" />
        <path d="M146 254 Q160 248 178 248" stroke="#fff" strokeWidth="1.2" opacity="0.25" fill="none" />

        {/* 저지 몸통 */}
        <path
          d="M128 175 Q180 158 238 175 L232 262 Q180 275 138 262 Z"
          fill="url(#jerseyGrad)"
        />
        {/* 저지 오른쪽 그림자 */}
        <path
          d="M190 162 Q215 170 234 178 L232 262 Q212 270 192 272 Z"
          fill="url(#jerseyGradDark)"
          opacity="0.7"
        />
        {/* 저지 왼쪽 하이라이트 */}
        <path
          d="M132 178 Q150 168 172 162 L172 258 Q150 258 138 260 Z"
          fill="#ffffff"
          opacity="0.12"
        />
        {/* 칼라 */}
        <path d="M168 160 Q180 168 192 160 L192 170 Q180 176 168 170 Z" fill="#0a5433" />

        {/* 등번호 */}
        <text
          x="180"
          y="232"
          textAnchor="middle"
          fontSize="54"
          fontWeight="900"
          fill="#ffffff"
          fontFamily="'Noto Sans KR', sans-serif"
          filter="url(#soft)"
        >
          10
        </text>
        <text
          x="180"
          y="232"
          textAnchor="middle"
          fontSize="54"
          fontWeight="900"
          fill="none"
          stroke="#0a5433"
          strokeWidth="1"
          fontFamily="'Noto Sans KR', sans-serif"
          opacity="0.5"
        >
          10
        </text>

        {/* 오른팔 (들어 올려 공을 잡은 상태) */}
        <path
          d="M232 180 Q270 150 282 105 L262 95 Q248 135 220 168 Z"
          fill="url(#jerseyGrad)"
        />
        <path
          d="M250 128 Q268 110 278 92"
          stroke="#ffffff"
          strokeWidth="2"
          opacity="0.25"
          fill="none"
          strokeLinecap="round"
        />
        {/* 오른쪽 전완부 피부 */}
        <path
          d="M262 95 Q276 70 272 48 L248 48 Q246 72 244 100 Z"
          fill="url(#skinGrad)"
        />
        {/* 손목 밴드 */}
        <rect x="244" y="60" width="32" height="10" rx="3" fill="#0d1117" />
        <rect x="244" y="60" width="32" height="2" rx="1" fill="#2bbf7e" />

        {/* 왼팔 (내린 상태) */}
        <path
          d="M128 182 Q108 220 116 270 L140 272 Q138 230 150 192 Z"
          fill="url(#jerseyGradDark)"
        />
        <path d="M130 190 Q118 228 122 268" stroke="#ffffff" strokeWidth="1.5" opacity="0.18" fill="none" />
        <circle cx="128" cy="274" r="11" fill="url(#skinGrad)" />
        <rect x="114" y="260" width="28" height="8" rx="2.5" fill="#0d1117" />
        <rect x="114" y="260" width="28" height="2" rx="1" fill="#2bbf7e" />

        {/* 목 */}
        <path d="M168 150 L192 150 L190 172 L170 172 Z" fill="url(#skinGrad)" />
        <path d="M168 165 Q180 170 192 165" stroke="#000" strokeWidth="0.8" opacity="0.2" fill="none" />

        {/* 머리 */}
        <circle cx="180" cy="125" r="34" fill="url(#skinGrad)" />
        {/* 볼 홍조 */}
        <circle cx="166" cy="135" r="4" fill="#f59b7a" opacity="0.45" />
        <circle cx="194" cy="135" r="4" fill="#f59b7a" opacity="0.45" />
        {/* 얼굴 하이라이트 */}
        <ellipse cx="170" cy="115" rx="10" ry="14" fill="#ffffff" opacity="0.18" />
        {/* 머리카락 */}
        <path
          d="M146 120 Q148 85 180 82 Q214 85 214 120 Q204 100 180 98 Q158 100 146 120 Z"
          fill="url(#hairGrad)"
        />
        <path d="M152 115 Q170 98 188 100" stroke="#ffffff" strokeWidth="1.2" opacity="0.25" fill="none" />
        {/* 헤드밴드 */}
        <rect x="146" y="110" width="68" height="8" rx="2" fill="#2bbf7e" />
        <rect x="146" y="110" width="68" height="2" rx="1" fill="#6fe6a8" />
        {/* 눈 */}
        <ellipse cx="170" cy="128" rx="2.4" ry="3" fill="#0d1117" />
        <ellipse cx="190" cy="128" rx="2.4" ry="3" fill="#0d1117" />
        <circle cx="170.8" cy="127" r="0.7" fill="#fff" />
        <circle cx="190.8" cy="127" r="0.7" fill="#fff" />
        {/* 눈썹 */}
        <path d="M164 120 Q170 118 176 121" stroke="#0d1117" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M184 121 Q190 118 196 120" stroke="#0d1117" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* 입 */}
        <path d="M172 141 Q180 148 188 141" stroke="#0d1117" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* 배구공 */}
        <g transform="translate(260, 38)">
          <ellipse cx="4" cy="6" rx="32" ry="6" fill="#0d1117" opacity="0.18" />
          <circle cx="0" cy="0" r="34" fill="url(#ballGrad)" />
          <circle cx="0" cy="0" r="34" fill="none" stroke="#0d1117" strokeWidth="1.5" opacity="0.85" />
          <path d="M-32 -6 Q0 -14 32 -6" stroke="#0d1117" strokeWidth="1.8" fill="none" />
          <path d="M-30 10 Q0 18 30 10" stroke="#0d1117" strokeWidth="1.8" fill="none" />
          <path d="M-10 -32 Q-4 0 -12 32" stroke="#0d1117" strokeWidth="1.8" fill="none" />
          <path d="M10 -32 Q4 0 12 32" stroke="#0d1117" strokeWidth="1.8" fill="none" />
          <ellipse cx="-10" cy="-12" rx="10" ry="6" fill="#ffffff" opacity="0.55" />
          <ellipse cx="-14" cy="-16" rx="3" ry="2" fill="#ffffff" opacity="0.9" />
        </g>
      </g>

      {/* 동작선 */}
      <path d="M300 130 L322 118" stroke="#2bbf7e" strokeWidth="3" strokeLinecap="round" />
      <path d="M305 150 L330 144" stroke="#2bbf7e" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      <path d="M302 170 L324 170" stroke="#2bbf7e" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
