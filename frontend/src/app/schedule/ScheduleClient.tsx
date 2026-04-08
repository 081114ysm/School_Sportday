'use client';

import { useMemo, useState } from 'react';
import { MapPin, Clock, Trophy, Flag, Medal, Play } from 'lucide-react';
import { displayScore, type Match } from '@/lib/types';
import { getEventWeekShortDates } from '@/lib/eventWeek';
import styles from './schedule.module.css';

const WEEK_DATES = getEventWeekShortDates();
// 백엔드/관리자 페이지는 day를 한글 한 글자(`월`,`화`,…)로 저장하므로
// 키도 동일하게 한글로 맞춘다. 영문(MON/TUE…)으로 두면 매칭 실패해서
// 일정이 비어 보인다.
const DAYS = [
  { key: '월', label: '월요일', en: 'MON', date: WEEK_DATES['월'] },
  { key: '화', label: '화요일', en: 'TUE', date: WEEK_DATES['화'] },
  { key: '수', label: '수요일', en: 'WED', date: WEEK_DATES['수'] },
  { key: '목', label: '목요일', en: 'THU', date: WEEK_DATES['목'] },
  { key: '금', label: '금요일', en: 'FRI', date: WEEK_DATES['금'] },
];

const SLOT_META: Record<string, { label: string; time: string; place: string }> = {
  LUNCH: { label: '점심 경기', time: '12:50', place: '중앙 운동장' },
  DINNER: { label: '저녁 경기', time: '18:30', place: '체육관 A' },
};

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

export default function ScheduleClient({ initial }: { initial: Match[] }) {
  const [activeDay, setActiveDay] = useState<string>(() => {
    const map = ['월', '월', '화', '수', '목', '금', '금'];
    return map[new Date().getDay()];
  });

  const byDay = useMemo(() => {
    const map = new Map<string, Match[]>();
    DAYS.forEach((d) => map.set(d.key, []));
    initial.forEach((m) => {
      const arr = map.get(m.day);
      if (arr) arr.push(m);
    });
    return map;
  }, [initial]);

  const todayMatches = byDay.get(activeDay) ?? [];
  const SLOT_ORDER: Record<string, number> = { LUNCH: 0, DINNER: 1 };
  const sorted = [...todayMatches].sort(
    (a, b) => (SLOT_ORDER[a.timeSlot] ?? 99) - (SLOT_ORDER[b.timeSlot] ?? 99),
  );
  const currentDay = DAYS.find((d) => d.key === activeDay)!;

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>경기 일정</h1>
          <p className={styles.subtitle}>요일을 선택하면 해당일 경기 일정이 표시됩니다.</p>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotLive}`} /> 진행
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotDone}`} /> 종료
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotScheduled}`} /> 예정
          </span>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.dayList} aria-label="요일 선택">
          {DAYS.map((d) => {
            const count = byDay.get(d.key)?.length ?? 0;
            const live = byDay.get(d.key)?.some((m) => m.status === 'LIVE') ?? false;
            const isActive = d.key === activeDay;
            return (
              <button
                key={d.key}
                onClick={() => setActiveDay(d.key)}
                className={`${styles.dayItem} ${isActive ? styles.dayItemActive : ''}`}
              >
                <div className={styles.dayDate}>{d.date}</div>
                <div className={styles.dayMain}>
                  <div className={styles.dayLabel}>{d.label}</div>
                  <div className={styles.dayMeta}>
                    {count}경기
                    {live && <span className={styles.dayLive}>LIVE</span>}
                  </div>
                </div>
                <div className={styles.dayEn}>{d.en}</div>
              </button>
            );
          })}
        </aside>

        <section className={styles.timeline}>
          <div className={styles.timelineHead}>
            <div>
              <div className={styles.timelineDate}>{currentDay.date} · {currentDay.label}</div>
              <div className={styles.timelineCount}>총 {sorted.length}경기</div>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className={styles.emptyBox}>이 날에는 편성된 경기가 없습니다.</div>
          ) : (
            <ol className={styles.events}>
              {sorted.map((m) => {
                const meta = SLOT_META[m.timeSlot] ?? { label: m.timeSlot, time: '--:--', place: '미정' };
                const sport = SPORT_LABELS[m.sport] ?? m.sport;
                const Icon = m.status === 'LIVE' ? Trophy : m.status === 'DONE' ? Medal : Flag;
                return (
                  <li
                    key={m.id}
                    className={`${styles.event} ${
                      m.status === 'LIVE'
                        ? styles.eventLive
                        : m.status === 'DONE'
                        ? styles.eventDone
                        : ''
                    }`}
                  >
                    <div className={styles.eventTime}>
                      <div className={styles.eventHour}>{meta.time}</div>
                      <div className={styles.eventSlot}>{meta.label}</div>
                    </div>
                    <div className={styles.eventRail}>
                      <span className={styles.eventDot} />
                    </div>
                    <div className={styles.eventBody}>
                      <div className={styles.eventTopRow}>
                        <span className={styles.eventSport}>
                          <Icon size={12} />
                          {sport}
                        </span>
                        {m.status === 'LIVE' && <span className={styles.badgeLive}>LIVE</span>}
                        {m.status === 'DONE' && <span className={styles.badgeDone}>종료</span>}
                        {m.status === 'SCHEDULED' && <span className={styles.badgeSched}>예정</span>}
                        {m.status === 'LIVE' && m.youtubeUrl && (
                          <a
                            href={m.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.watchBtn}
                          >
                            <Play size={11} />
                            유튜브 보기
                          </a>
                        )}
                      </div>
                      <div className={styles.eventTeams}>
                        <span className={styles.teamName}>{m.teamA?.name ?? 'TBD'}</span>
                        {m.status === 'DONE' ? (
                          <span className={styles.eventScore}>
                            {displayScore(m).a} <span className={styles.scoreSep}>:</span> {displayScore(m).b}
                          </span>
                        ) : (
                          <span className={styles.vs}>VS</span>
                        )}
                        <span className={styles.teamName}>{m.teamB?.name ?? 'TBD'}</span>
                      </div>
                      <div className={styles.eventFoot}>
                        <span className={styles.footItem}>
                          <MapPin size={11} />
                          {meta.place}
                        </span>
                        <span className={styles.footItem}>
                          <Clock size={11} />
                          {m.category === 'ALL_UNION' ? '연합전' : '학년전'}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
