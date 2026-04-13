'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Calendar, Bell, BellRing, History } from 'lucide-react';
import { fetchMatches } from '@/services/api';
import { getSocket, disconnectSocket } from '@/services/socket';
import type { Match } from '@/types';
import { formatMatchScore, isQuarterSport } from '@/lib/matchScore';
import { effectiveStatus } from '@/components/admin/adminUtils';
import { QuarterClock } from '@/components/QuarterClock';
import styles from './youtube.module.css';

interface YtVideo {
  id: string | null;
  title: string;
  category: string;
  date: string;
  time: string;
  badge?: 'LIVE' | 'UPCOMING';
  matchId?: number;
  done?: boolean;
  youtubeUrl?: string | null;
}

const SPORT_LABELS: Record<string, string> = {
  BASKETBALL: '농구',
  FUTSAL: '풋살',
  BIG_VOLLEYBALL: '빅발리볼',
  DODGEBALL: '피구',
  TUG_OF_WAR: '줄다리기',
  BADMINTON: '배드민턴',
  RELAY: '이어달리기',
  JUMP_ROPE: '단체줄넘기',
  BASEBALL: '발야구',
  SOCCER: '축구',
};

const DAY_LABELS: Record<string, string> = {
  MON: '04.06(月)',
  TUE: '04.07(火)',
  WED: '04.08(水)',
  THU: '04.09(木)',
  FRI: '04.10(金)',
};

const SLOT_TIME: Record<string, string> = {
  LUNCH: '12:50',
  DINNER: '18:30',
};

const NOTIF_KEY = 'sportday:matchNotifs';

function loadNotifs(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(NOTIF_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveNotifs(set: Set<number>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NOTIF_KEY, JSON.stringify([...set]));
}

function extractYoutubeId(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
    if (u.hostname.endsWith('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex((p) => p === 'embed' || p === 'live' || p === 'shorts');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch {
    /* ignore */
  }
  return null;
}

function matchToVideo(m: Match): YtVideo | null {
  const id = extractYoutubeId(m.youtubeUrl);
  if (!id) return null;
  const teamA = m.teamA?.name ?? '미정';
  const teamB = m.teamB?.name ?? '미정';
  const sport = SPORT_LABELS[m.sport] ?? m.sport;
  return {
    id,
    title: `${sport} · ${teamA} vs ${teamB}`,
    category: m.category === 'CLUB' ? '클럽 리그' : '학년 리그',
    date: DAY_LABELS[m.day] ?? m.day,
    time: SLOT_TIME[m.timeSlot] ?? m.timeSlot,
    badge: m.status === 'LIVE' ? 'LIVE' : 'UPCOMING',
    matchId: m.id,
    done: m.status === 'DONE',
    youtubeUrl: m.youtubeUrl ?? null,
  };
}

// 링크 유무와 관계없이 모든 경기를 카드로 변환 (다가오는/지난 섹션용).
function matchToCard(m: Match): YtVideo {
  const id = extractYoutubeId(m.youtubeUrl);
  const teamA = m.teamA?.name ?? '미정';
  const teamB = m.teamB?.name ?? '미정';
  const sport = SPORT_LABELS[m.sport] ?? m.sport;
  return {
    id,
    title: `${sport} · ${teamA} vs ${teamB}`,
    category: m.category === 'CLUB' ? '클럽 리그' : '학년 리그',
    date: DAY_LABELS[m.day] ?? m.day,
    time: SLOT_TIME[m.timeSlot] ?? m.timeSlot,
    badge: m.status === 'LIVE' ? 'LIVE' : 'UPCOMING',
    matchId: m.id,
    done: m.status === 'DONE',
    youtubeUrl: m.youtubeUrl ?? null,
  };
}

export default function YoutubePage() {
  const [active, setActive] = useState<YtVideo | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [notifs, setNotifs] = useState<Set<number>>(new Set());

  useEffect(() => {
    const initial = loadNotifs();
    setNotifs(initial);
    fetchMatches()
      .then(setMatches)
      .catch(() => setMatches([]));

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }

    const socket = getSocket();
    const showNotif = (title: string, body: string) => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      try {
        new Notification(title, { body, icon: '/logo.png' });
      } catch {
        /* ignore */
      }
    };

    socket.on('match:live', (data: { matchId: number; sport?: string; teamA?: string; teamB?: string }) => {
      const subs = loadNotifs();
      if (subs.has(data.matchId)) {
        showNotif('경기 라이브 시작', `${data.sport ?? '경기'} · ${data.teamA ?? ''} vs ${data.teamB ?? ''}`);
      }
      fetchMatches().then(setMatches).catch(() => {});
    });

    socket.on('match:ended', () => {
      fetchMatches().then(setMatches).catch(() => {});
    });

    socket.on('matchStatusChange', () => {
      fetchMatches().then(setMatches).catch(() => {});
    });

    return () => {
      socket.off('match:live');
      socket.off('match:ended');
      socket.off('matchStatusChange');
      disconnectSocket();
    };
  }, []);

  const liveMatches = useMemo(
    () => matches.filter((m) => effectiveStatus(m) === 'LIVE'),
    [matches],
  );
  const liveVideos = useMemo(
    () => liveMatches.map(matchToVideo).filter((v): v is YtVideo => v !== null),
    [liveMatches],
  );
  const SLOT_ORDER: Record<string, number> = { LUNCH: 0, DINNER: 1 };
  const upcoming = useMemo(
    () =>
      matches
        .filter((m) => effectiveStatus(m) === 'SCHEDULED')
        .sort((a, b) => {
          const dateDiff = (a.matchDate ?? a.day ?? '').localeCompare(b.matchDate ?? b.day ?? '');
          if (dateDiff !== 0) return dateDiff;
          return (SLOT_ORDER[a.timeSlot] ?? 99) - (SLOT_ORDER[b.timeSlot] ?? 99);
        })
        .map(matchToCard),
    [matches],
  );
  const past = useMemo(
    () => matches.filter((m) => effectiveStatus(m) === 'DONE').map(matchToCard),
    [matches],
  );

  // 초기 로드 시 첫 번째 LIVE 경기를 플레이어에 표시한다.
  // 이후에는 라이브 경기가 없어질 때만 null로 초기화한다.
  useEffect(() => {
    setActive((cur) => {
      if (cur == null) return liveVideos[0] ?? null;
      if (cur.badge === 'LIVE' && !liveVideos.some((v) => v.matchId === cur.matchId)) {
        return liveVideos[0] ?? null;
      }
      return cur;
    });
  }, [liveVideos]);

  const toggleNotif = async (matchId: number) => {
    const next = new Set(notifs);
    const subscribing = !next.has(matchId);
    if (subscribing) next.add(matchId);
    else next.delete(matchId);
    setNotifs(next);
    saveNotifs(next);
    // 백엔드 엔드포인트가 별도 매치 구독을 지원하면 호출, 실패해도 무시
    try {
      await fetch('http://localhost:4001/api/notifications/subscribe', {
        method: subscribing ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sub: 'guest', teamId: matchId }),
      });
    } catch {
      /* localStorage-only fallback */
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.headTitle}>유튜브 중계</h1>
          <span className={styles.headSub}>경소마 공식 채널 실시간 송출</span>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.player}>
          {active && active.id ? (
            <>
              <div className={styles.playerTags}>
                <span className={styles.tagOn}>한국어</span>
                <span className={styles.tagOff}>공식</span>
              </div>
              <div className={styles.embed}>
                <iframe
                  src={`https://www.youtube.com/embed/${active.id}`}
                  title={active.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {active.badge === 'LIVE' && <span className={styles.liveBadge}>LIVE</span>}
              </div>
              <div className={styles.playerInfo}>
                <h2 className={styles.playerTitle}>{active.title}</h2>
                <div className={styles.playerMeta}>
                  {active.category} · {active.date} · {active.time}
                </div>
                {(() => {
                  const m = matches.find((mm) => mm.id === active.matchId);
                  if (!m) return null;
                  return (
                    <>
                      <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800 }}>
                        {formatMatchScore(m)}
                      </div>
                      {m.status === 'LIVE' && isQuarterSport(m.sport) && (
                        <QuarterClock match={m} />
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          ) : liveMatches.length > 0 ? (
            <div className={styles.noLive}>
              <div className={styles.noLiveIcon}>🔴</div>
              <div className={styles.noLiveTitle}>LIVE 경기가 진행 중입니다</div>
              <div className={styles.noLiveSub}>
                {liveMatches.map((m) => {
                  const sport = SPORT_LABELS[m.sport] ?? m.sport;
                  const teamA = m.teamA?.name ?? '미정';
                  const teamB = m.teamB?.name ?? '미정';
                  return (
                    <div key={m.id} style={{ marginTop: 6, fontWeight: 700 }}>
                      {sport} · {teamA} vs {teamB}
                    </div>
                  );
                })}
                <div style={{ marginTop: 8, opacity: 0.7 }}>중계 링크가 아직 등록되지 않았습니다.</div>
              </div>
            </div>
          ) : (
            <div className={styles.noLive}>
              <div className={styles.noLiveIcon}>📡</div>
              <div className={styles.noLiveTitle}>지금 진행 중인 생중계가 없습니다</div>
              <div className={styles.noLiveSub}>
                경기가 LIVE로 전환되면 이곳에서 바로 시청할 수 있습니다.
              </div>
            </div>
          )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sectionHead}>
            <Calendar size={15} />
            <h3>다가오는 일정</h3>
            <span className={styles.sectionCount}>{upcoming.length}건</span>
          </div>
          <div className={styles.list}>
            {upcoming.length === 0 && (
              <div className={styles.emptyHint}>예정된 경기가 없습니다.</div>
            )}
            {upcoming.map((v) => {
              const subscribed = v.matchId != null && notifs.has(v.matchId);
              const hasLink = !!v.id;
              return (
                <div
                  key={`u-${v.matchId}`}
                  className={styles.cardWrap}
                  style={!hasLink ? { opacity: 0.6 } : undefined}
                >
                  <button
                    className={`${styles.card} ${active?.matchId === v.matchId ? styles.cardActive : ''}`}
                    onClick={() => {
                      if (hasLink) setActive(v);
                    }}
                    disabled={!hasLink}
                  >
                    <div className={styles.cardTime}>
                      <span className={styles.cardTimeHour}>{v.time}</span>
                      <span className={styles.cardTimeDate}>{v.date.slice(0, 5)}</span>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTitle}>{v.title}</div>
                      <div className={styles.cardCategory}>{v.category}</div>
                    </div>
                    <ChevronRight size={14} className={styles.cardArrow} />
                  </button>
                  {!hasLink ? (
                    <span className={`${styles.notifBtn} ${styles.notifBtnDone}`}>
                      중계 링크 미등록
                    </span>
                  ) : (
                    v.matchId != null && (
                      <button
                        type="button"
                        className={`${styles.notifBtn} ${subscribed ? styles.notifBtnOn : ''}`}
                        onClick={() => toggleNotif(v.matchId!)}
                        aria-pressed={subscribed}
                      >
                        {subscribed ? <BellRing size={12} /> : <Bell size={12} />}
                        {subscribed ? '알림 설정됨' : '알림 받기'}
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.sectionHead}>
            <History size={15} />
            <h3>지난 경기</h3>
            <span className={styles.sectionCount}>{past.length}건</span>
          </div>
          <div className={styles.list}>
            {past.length === 0 && (
              <div className={styles.emptyHint}>아직 종료된 경기가 없습니다.</div>
            )}
            {past.map((v) => {
              const hasLink = !!v.youtubeUrl;
              return (
                <div
                  key={`p-${v.matchId}`}
                  className={styles.cardWrap}
                  style={!hasLink ? { opacity: 0.6 } : undefined}
                >
                  <button
                    className={styles.card}
                    disabled={!hasLink}
                    onClick={() => {
                      if (hasLink && v.youtubeUrl) {
                        window.open(v.youtubeUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    <div className={styles.cardTime}>
                      <span className={styles.cardTimeHour}>{v.time}</span>
                      <span className={styles.cardTimeDate}>{v.date.slice(0, 5)}</span>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTitle}>{v.title}</div>
                      <div className={styles.cardCategory}>{v.category}</div>
                    </div>
                    <ChevronRight size={14} className={styles.cardArrow} />
                  </button>
                  <span className={`${styles.notifBtn} ${styles.notifBtnDone}`}>
                    {hasLink ? '다시보기' : '다시보기 없음'}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
