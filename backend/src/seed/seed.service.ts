import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../teams/team.entity';
import { Match } from '../matches/match.entity';

type Day = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';
type Slot = 'LUNCH' | 'DINNER';
type Status = 'SCHEDULED' | 'LIVE' | 'DONE';

const DAYS: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

// JS Date.getDay() -> Day key (Sat/Sun fallback to FRI)
const TODAY_KEY: Day = (() => {
  const d = new Date().getDay();
  return (['MON', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'FRI'] as Day[])[d];
})();

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Team)
    private teamRepo: Repository<Team>,
    @InjectRepository(Match)
    private matchRepo: Repository<Match>,
  ) {}

  async onModuleInit() {
    const teamCount = await this.teamRepo.count();
    if (teamCount > 0) return;

    console.log('Seeding database...');

    // ── Teams: 8 학년 팀 + 4 클럽 팀 = 12 ─────────────────────────────────
    const teams: Team[] = [];
    for (let grade = 1; grade <= 3; grade++) {
      for (let cls = 1; cls <= 4; cls++) {
        teams.push(
          await this.teamRepo.save(
            this.teamRepo.create({
              name: `${grade}학년 ${cls}반`,
              grade,
              classNumber: cls,
              category: 'GRADE',
            }),
          ),
        );
      }
    }
    for (const letter of ['A', 'B', 'C', 'D']) {
      teams.push(
        await this.teamRepo.save(
          this.teamRepo.create({
            name: `${letter}팀`,
            grade: null,
            classNumber: null,
            category: 'CLUB',
          }),
        ),
      );
    }

    const grade = teams.filter((t) => t.category === 'GRADE');
    const club = teams.filter((t) => t.category === 'CLUB');
    const g = (gr: number, cls: number) =>
      grade.find((t) => t.grade === gr && t.classNumber === cls)!;
    const c = (letter: string) => club.find((t) => t.name === `${letter}팀`)!;

    // ── 슬롯별 시간(Asia/Seoul 기준 로컬 시간) ────────────────────────────
    const slotTime = (slot: Slot): { hour: number; minute: number } =>
      slot === 'LUNCH' ? { hour: 12, minute: 50 } : { hour: 18, minute: 30 };

    // 이번 주의 월요일 0시(Asia/Seoul). 서버 TZ가 KST가 아니더라도
    // 표시는 매치 day/slot 키로 결정되므로 충분.
    const now = new Date();
    const monday = new Date(now);
    const dow = now.getDay(); // 0=Sun..6=Sat
    const offset = dow === 0 ? -6 : 1 - dow;
    monday.setDate(now.getDate() + offset);
    monday.setHours(0, 0, 0, 0);

    const dateOf = (day: Day, slot: Slot): Date => {
      const idx = DAYS.indexOf(day);
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const t = slotTime(slot);
      d.setHours(t.hour, t.minute, 0, 0);
      return d;
    };

    // ── Status 결정: 과거=DONE, 오늘=시간 따라 LIVE/DONE/SCHEDULED, 미래=SCHEDULED
    const decideStatus = (day: Day, slot: Slot): Status => {
      const target = dateOf(day, slot);
      const todayIdx = DAYS.indexOf(TODAY_KEY);
      const dayIdx = DAYS.indexOf(day);
      if (dayIdx < todayIdx) return 'DONE';
      if (dayIdx > todayIdx) return 'SCHEDULED';
      // 오늘
      const diffMin = (now.getTime() - target.getTime()) / 60000;
      if (diffMin >= 90) return 'DONE';
      if (diffMin >= -10) return 'LIVE';
      return 'SCHEDULED';
    };

    // ── 매치 정의: (day, slot, sport, teamA, teamB, category) ──────────
    type Plan = {
      day: Day;
      slot: Slot;
      sport: string;
      a: Team;
      b: Team;
      category: 'GRADE' | 'CLUB';
    };

    const plans: Plan[] = [
      // 월요일
      { day: 'MON', slot: 'LUNCH',  sport: 'FUTSAL',         a: g(1,1), b: g(1,2), category: 'GRADE' },
      { day: 'MON', slot: 'DINNER', sport: 'BASKETBALL',     a: c('A'), b: c('B'), category: 'CLUB'  },
      // 화요일
      { day: 'TUE', slot: 'LUNCH',  sport: 'DODGEBALL',      a: g(2,1), b: g(2,2), category: 'GRADE' },
      { day: 'TUE', slot: 'DINNER', sport: 'SOCCER',         a: g(3,1), b: g(3,2), category: 'GRADE' },
      // 수요일
      { day: 'WED', slot: 'LUNCH',  sport: 'BIG_VOLLEYBALL', a: g(3,3), b: g(3,4), category: 'GRADE' },
      { day: 'WED', slot: 'DINNER', sport: 'BASKETBALL',     a: c('C'), b: c('D'), category: 'CLUB'  },
      // 목요일
      { day: 'THU', slot: 'LUNCH',  sport: 'BADMINTON',      a: g(2,3), b: g(2,4), category: 'GRADE' },
      { day: 'THU', slot: 'DINNER', sport: 'RELAY',          a: c('A'), b: c('C'), category: 'CLUB'  },
      // 금요일 (점심만)
      { day: 'FRI', slot: 'LUNCH',  sport: 'JUMP_ROPE',      a: g(1,3), b: g(1,4), category: 'GRADE' },
    ];

    // 점수 풀: 결정적 분배로 랭킹이 다양하게 나오도록
    const scorePool: Array<[number, number]> = [
      [3, 1], [2, 2], [4, 0], [1, 2], [0, 3], [2, 1], [3, 3], [1, 0], [2, 0],
    ];

    // 강제 LIVE 매치 (시연용): 첫 번째 플랜은 항상 LIVE
    const forcedLiveIdx = 0;
    let i = 0;
    for (const p of plans) {
      let status = decideStatus(p.day, p.slot);
      if (i === forcedLiveIdx) status = 'LIVE';
      const data: Partial<Match> = {
        sport: p.sport,
        day: p.day,
        timeSlot: p.slot,
        teamAId: p.a.id,
        teamBId: p.b.id,
        category: p.category,
        status,
      };
      if (status === 'DONE') {
        const [sa, sb] = scorePool[i % scorePool.length];
        data.scoreA = sa;
        data.scoreB = sb;
        data.result = sa > sb ? `${p.a.name} 승` : sb > sa ? `${p.b.name} 승` : '무승부';
      } else if (status === 'LIVE') {
        data.scoreA = 1;
        data.scoreB = 1;
      }
      await this.matchRepo.save(this.matchRepo.create(data as any));
      i++;
    }

    const matchCount = await this.matchRepo.count();
    console.log(
      `Seeding complete: ${teams.length} teams (${grade.length} grade + ${club.length} club), ${matchCount} matches`,
    );
  }
}
