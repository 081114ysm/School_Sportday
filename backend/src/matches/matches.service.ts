import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, IsNull } from 'typeorm';
import { Match } from './match.entity';
import { ScoreLog } from './score-log.entity';
import { Team } from '../teams/team.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { MatchesGateway } from './matches.gateway';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { PushService } from '../notifications/push.service';

// 종목 키 정규화: 프론트는 한국어('빅발리볼') 백엔드 시드는 영문 상수('BIG_VOLLEYBALL') 혼재.
function isVolleyball(sport: string): boolean {
  return sport === 'BIG_VOLLEYBALL' || sport === '빅발리볼';
}
function isBadminton(sport: string): boolean {
  return sport === 'BADMINTON' || sport === '배드민턴';
}
export function isMultiSetSport(sport: string): boolean {
  return isVolleyball(sport) || isBadminton(sport);
}
// 세트 완료 판정: 듀스 규칙 포함.
export function isSetComplete(sport: string, a: number, b: number): boolean {
  if (isVolleyball(sport)) {
    if (a >= 25 && a - b >= 2) return true;
    if (b >= 25 && b - a >= 2) return true;
    return false;
  }
  if (isBadminton(sport)) {
    if (a >= 30 || b >= 30) return true;
    if (a >= 21 && a - b >= 2) return true;
    if (b >= 21 && b - a >= 2) return true;
    return false;
  }
  return false;
}
function setsToWin(sport: string): number {
  return isBadminton(sport) ? 2 : 2; // best-of-3 for both
}

function ymd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

@Injectable()
export class MatchesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchesService.name);
  private autoTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(Match)
    private matchRepo: Repository<Match>,
    @InjectRepository(ScoreLog)
    private logRepo: Repository<ScoreLog>,
    @InjectRepository(Team)
    private teamRepo: Repository<Team>,
    private gateway: MatchesGateway,
    private notificationsGateway: NotificationsGateway,
    private pushService: PushService,
  ) {}

  onModuleInit() {
    // 부팅 시 한 번 실행 후 10분마다 반복. 과거 경기를 자동으로 DONE 처리해
    // 관리자가 직접 열지 않아도 사용자 화면이 올바르게 유지된다.
    void this.backfillCategories();
    void this.backfillVolleyballSets();
    void this.autoFinalizePastMatches();
    this.autoTimer = setInterval(
      () => {
        void this.autoFinalizePastMatches();
      },
      10 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.autoTimer) clearInterval(this.autoTimer);
  }

  // matchDate가 과거인 비-LIVE·비-DONE 경기를 DONE으로 전환한다.
  // LIVE는 유지되며 관리자가 직접 종료해야 한다. matchDate 없는 경기는 무시.
  async autoFinalizePastMatches(): Promise<void> {
    try {
      const today = ymd(new Date());
      const candidates = await this.matchRepo.find({
        where: {
          matchDate: LessThan(today) as any,
          status: Not('DONE') as any,
        },
      });
      const toFinalize = candidates.filter(
        (m) => m.status !== 'LIVE' && m.matchDate != null,
      );
      if (toFinalize.length === 0) return;

      for (const m of toFinalize) {
        await this.updateStatus(m.id, 'DONE');
      }
      this.logger.log(`Auto-finalized ${toFinalize.length} past match(es)`);
    } catch (err) {
      this.logger.error('autoFinalizePastMatches failed', err as Error);
    }
  }

  findAll(filters: {
    day?: string;
    status?: string;
    sport?: string;
    matchDate?: string;
  }): Promise<Match[]> {
    const where: any = {};
    if (filters.day) where.day = filters.day;
    if (filters.status) where.status = filters.status;
    if (filters.sport) where.sport = filters.sport;
    if (filters.matchDate) where.matchDate = filters.matchDate;
    return this.matchRepo.find({
      where,
      relations: ['teamA', 'teamB'],
      order: { day: 'ASC', timeSlot: 'ASC' },
    });
  }

  findLive(): Promise<Match[]> {
    return this.matchRepo.find({
      where: { status: 'LIVE' },
      relations: ['teamA', 'teamB'],
    });
  }

  async findOneOrFail(id: number): Promise<Match> {
    const match = await this.matchRepo.findOne({
      where: { id },
      relations: ['teamA', 'teamB'],
    });
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  // 두 팀에서 경기 카테고리를 결정한다. 어느 한 팀이 CLUB(A/B/C/D) 풀이면 팀전(CLUB),
  // 아니면 학년전(GRADE). ALL_UNION은 명시적으로만 지정하며 자동 결정하지 않는다.
  private async deriveCategory(
    teamAId: number,
    teamBId: number,
    explicit?: string,
  ): Promise<string> {
    if (explicit === 'ALL_UNION') return 'ALL_UNION';
    const teams = await this.teamRepo.findByIds([teamAId, teamBId]);
    const anyClub = teams.some((t) => t.category === 'CLUB');
    return anyClub ? 'CLUB' : 'GRADE';
  }

  async create(dto: CreateMatchDto): Promise<Match> {
    const category = await this.deriveCategory(
      dto.teamAId,
      dto.teamBId,
      dto.category,
    );
    const match = this.matchRepo.create({ ...dto, category });
    const saved = await this.matchRepo.save(match);
    return this.findOneOrFail(saved.id);
  }

  async update(id: number, data: Partial<Match>): Promise<Match> {
    const current = await this.findOneOrFail(id);
    const teamAId = data.teamAId ?? current.teamAId;
    const teamBId = data.teamBId ?? current.teamBId;
    const next: Partial<Match> = { ...data };
    if (data.category !== 'ALL_UNION') {
      next.category = await this.deriveCategory(
        teamAId,
        teamBId,
        data.category,
      );
    }
    // status=DONE 저장 시 result 자동 계산
    if (next.status === 'DONE') {
      const scoreA = next.scoreA ?? current.scoreA;
      const scoreB = next.scoreB ?? current.scoreB;
      const nameA = current.teamA?.name ?? 'Team A';
      const nameB = current.teamB?.name ?? 'Team B';
      if (scoreA > scoreB) next.result = `${nameA} 승`;
      else if (scoreB > scoreA) next.result = `${nameB} 승`;
      else next.result = '무승부';
    }
    await this.matchRepo.update(id, next);
    const match = await this.findOneOrFail(id);
    this.gateway.emitMatchUpdate(match);
    return match;
  }

  // BIG_VOLLEYBALL 매치 중 setsJson이 비어 있으면 기존 scoreA/scoreB를 근거로
  // 그럴듯한 세트 스코어를 생성해 채워 넣는다. 경기 전이면 빈 세트로 초기화.
  private async backfillVolleyballSets(): Promise<void> {
    try {
      const vbs = await this.matchRepo.find({
        where: { sport: 'BIG_VOLLEYBALL' },
        relations: ['teamA', 'teamB'],
      });
      let fixed = 0;
      for (const m of vbs) {
        // setsJson 있으면: 2세트 선취 시 status=DONE으로 자동 승격
        if (m.setsJson) {
          try {
            const sets = JSON.parse(m.setsJson) as { a: number; b: number }[];
            let aw = 0,
              bw = 0;
            for (const s of sets) {
              if (s.a >= 25 && s.a > s.b) aw++;
              else if (s.b >= 25 && s.b > s.a) bw++;
            }
            if ((aw >= 2 || bw >= 2) && m.status !== 'DONE') {
              const result =
                aw > bw
                  ? `${m.teamA?.name ?? 'Team A'} 승`
                  : `${m.teamB?.name ?? 'Team B'} 승`;
              await this.matchRepo.update(m.id, { status: 'DONE', result });
              fixed++;
            }
          } catch {
            /* ignore */
          }
          continue;
        }
        let sets: Array<{ a: number; b: number }>;
        if (m.status === 'DONE' && (m.scoreA > 0 || m.scoreB > 0)) {
          // 승자 추정 후 2-0 또는 2-1 세트 배분
          const aWin = m.scoreA >= m.scoreB;
          sets = aWin
            ? [
                { a: 25, b: 20 },
                { a: 25, b: 22 },
                { a: 0, b: 0 },
              ]
            : [
                { a: 20, b: 25 },
                { a: 22, b: 25 },
                { a: 0, b: 0 },
              ];
        } else {
          sets = [
            { a: 0, b: 0 },
            { a: 0, b: 0 },
            { a: 0, b: 0 },
          ];
        }
        const scoreA = sets.reduce((s, x) => s + x.a, 0);
        const scoreB = sets.reduce((s, x) => s + x.b, 0);
        await this.matchRepo.update(m.id, {
          setsJson: JSON.stringify(sets),
          scoreA,
          scoreB,
        });
        fixed++;
      }
      if (fixed > 0)
        this.logger.log(
          `Backfilled setsJson for ${fixed} volleyball match(es)`,
        );
    } catch (err) {
      this.logger.error('backfillVolleyballSets failed', err as Error);
    }
  }

  // 일회성 백필: 팀 카테고리와 맞지 않는 기존 경기의 category를 수정한다. 부팅 시 실행.
  private async backfillCategories(): Promise<void> {
    try {
      const all = await this.matchRepo.find({ relations: ['teamA', 'teamB'] });
      let fixed = 0;
      for (const m of all) {
        if (m.category === 'ALL_UNION') continue;
        const anyClub =
          m.teamA?.category === 'CLUB' || m.teamB?.category === 'CLUB';
        const want = anyClub ? 'CLUB' : 'GRADE';
        if (m.category !== want) {
          await this.matchRepo.update(m.id, { category: want });
          fixed++;
        }
      }
      if (fixed > 0)
        this.logger.log(`Backfilled category for ${fixed} match(es)`);
    } catch (err) {
      this.logger.error('backfillCategories failed', err as Error);
    }
  }

  async remove(id: number): Promise<void> {
    await this.logRepo.delete({ matchId: id });
    await this.matchRepo.delete(id);
  }

  async removeAll(): Promise<{ deleted: number }> {
    await this.logRepo.createQueryBuilder().delete().execute();
    const res = await this.matchRepo.createQueryBuilder().delete().execute();
    return { deleted: res.affected ?? 0 };
  }

  async updateScore(id: number, team: string, delta: number): Promise<Match> {
    const match = await this.findOneOrFail(id);

    if (team === 'A') {
      match.scoreA = Math.max(0, match.scoreA + delta);
    } else {
      match.scoreB = Math.max(0, match.scoreB + delta);
    }
    await this.matchRepo.save(match);

    const log = this.logRepo.create({
      matchId: id,
      team,
      delta,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
    });
    await this.logRepo.save(log);

    const updated = await this.findOneOrFail(id);
    this.gateway.emitScoreUpdate(updated);
    return updated;
  }

  async updateStatus(id: number, status: string): Promise<Match> {
    const match = await this.findOneOrFail(id);

    const prevStatus = match.status;
    match.status = status;
    if (prevStatus !== 'LIVE' && status === 'LIVE') {
      this.notificationsGateway.emitMatchLive(match.id, {
        sport: match.sport,
        teamA: match.teamA?.name,
        teamB: match.teamB?.name,
      });
      // 모든 구독자에게 PWA 푸시 전송 — 앱이 닫혀 있어도 동작한다.
      void this.pushService.sendToAll({
        title: `🔴 ${match.sport} 경기 시작`,
        body: `${match.teamA?.name ?? 'Team A'} vs ${match.teamB?.name ?? 'Team B'}`,
        url: '/today',
        tag: `match-live-${match.id}`,
      });
    }
    if (status === 'DONE') {
      if (match.scoreA > match.scoreB) {
        match.result = (match.teamA?.name ?? 'Team A') + ' 승';
      } else if (match.scoreB > match.scoreA) {
        match.result = (match.teamB?.name ?? 'Team B') + ' 승';
      } else {
        match.result = '무승부';
      }
    }
    await this.matchRepo.save(match);

    const updated = await this.findOneOrFail(id);
    this.gateway.emitMatchStatusChange(updated);
    return updated;
  }

  async setScore(id: number, scoreA: number, scoreB: number): Promise<Match> {
    const match = await this.findOneOrFail(id);
    match.scoreA = Math.max(0, Math.floor(scoreA));
    match.scoreB = Math.max(0, Math.floor(scoreB));
    await this.matchRepo.save(match);
    const updated = await this.findOneOrFail(id);
    this.gateway.emitScoreUpdate(updated);
    return updated;
  }

  async setYoutubeUrl(id: number, url: string | null): Promise<Match> {
    const match = await this.findOneOrFail(id);
    const wasEmpty = !match.youtubeUrl;
    match.youtubeUrl = url;
    await this.matchRepo.save(match);
    const updated = await this.findOneOrFail(id);
    if (url && wasEmpty) {
      this.gateway.emitYoutubeLive(updated);
      this.notificationsGateway.emitMatchLive(updated.id, {
        sport: updated.sport,
        teamA: updated.teamA?.name,
        teamB: updated.teamB?.name,
        youtubeUrl: url,
      });
      void this.pushService.sendToAll({
        title: `📺 ${updated.sport} 라이브 시작`,
        body: `${updated.teamA?.name ?? 'Team A'} vs ${updated.teamB?.name ?? 'Team B'} · 유튜브에서 시청하기`,
        url,
        tag: `youtube-live-${updated.id}`,
      });
    }
    return updated;
  }

  // ===== 다중 세트 점수 처리 (배구) =====
  // 배구 규칙: 한 팀이 25점에 도달하면 세트 종료. 경기는 3세트 중 2세트 선취제.
  // 클라이언트의 `setIndex`는 힌트로만 사용하며, 서버는 항상 첫 번째 미완료 세트에
  // 점수 변경을 적용하고, 2세트를 이미 획득한 상태면 추가 업데이트를 무시한다.
  async updateSetScore(
    id: number,
    _setIndex: number,
    team: 'A' | 'B',
    delta: number,
  ): Promise<Match> {
    const match = await this.findOneOrFail(id);
    const sport = match.sport;
    const SETS_TO_WIN = setsToWin(sport);
    let sets: Array<{ a: number; b: number }> = [];
    try {
      sets = match.setsJson ? JSON.parse(match.setsJson) : [];
    } catch {
      sets = [];
    }
    while (sets.length < 3) sets.push({ a: 0, b: 0 });

    const setWinner = (s: { a: number; b: number }): 'A' | 'B' | null => {
      if (!isSetComplete(sport, s.a, s.b)) return null;
      return s.a > s.b ? 'A' : 'B';
    };
    const countWins = () => {
      let aw = 0,
        bw = 0;
      for (const s of sets) {
        const w = setWinner(s);
        if (w === 'A') aw++;
        else if (w === 'B') bw++;
      }
      return { aw, bw };
    };

    const winsBefore = countWins();
    const matchAlreadyDone =
      winsBefore.aw >= SETS_TO_WIN || winsBefore.bw >= SETS_TO_WIN;

    if (!matchAlreadyDone) {
      // 첫 번째 미완료 세트를 찾아 현재 세트로 적용한다.
      let active = sets.findIndex((s) => setWinner(s) === null);
      if (active === -1) active = sets.length - 1;

      if (team === 'A') sets[active].a = Math.max(0, sets[active].a + delta);
      else sets[active].b = Math.max(0, sets[active].b + delta);
    }

    match.setsJson = JSON.stringify(sets);
    // 요약 뷰가 정상 동작하도록 합계를 scoreA/scoreB에 반영한다.
    match.scoreA = sets.reduce((s, x) => s + x.a, 0);
    match.scoreB = sets.reduce((s, x) => s + x.b, 0);

    // 한 팀이 2세트를 획득하면 경기를 종료 처리한다.
    const winsAfter = countWins();
    if (
      (winsAfter.aw >= SETS_TO_WIN || winsAfter.bw >= SETS_TO_WIN) &&
      match.status !== 'DONE'
    ) {
      match.status = 'DONE';
      if (winsAfter.aw > winsAfter.bw) {
        match.result = (match.teamA?.name ?? 'Team A') + ' 승';
      } else {
        match.result = (match.teamB?.name ?? 'Team B') + ' 승';
      }
    }
    await this.matchRepo.save(match);

    const log = this.logRepo.create({
      matchId: id,
      team: `${team}`,
      delta,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
    });
    await this.logRepo.save(log);

    const updated = await this.findOneOrFail(id);
    this.gateway.emitScoreUpdate(updated);
    if (updated.status === 'DONE') {
      this.gateway.emitMatchStatusChange(updated);
    }
    return updated;
  }

  // 쿼터 상태 갱신 (농구·풋살). currentQuarter와 quarterStartedAt만 갱신한다.
  async updateQuarter(
    id: number,
    currentQuarter: number | null,
    quarterStartedAt: string | null,
  ): Promise<Match> {
    const match = await this.findOneOrFail(id);
    match.currentQuarter = currentQuarter;
    match.quarterStartedAt = quarterStartedAt;
    await this.matchRepo.save(match);
    const updated = await this.findOneOrFail(id);
    this.gateway.emitMatchUpdate(updated);
    return updated;
  }

  async undoScore(id: number): Promise<Match> {
    const lastLog = await this.logRepo.findOne({
      where: { matchId: id },
      order: { id: 'DESC' },
    });
    if (!lastLog) throw new NotFoundException('No score history');

    const match = await this.findOneOrFail(id);
    if (lastLog.team === 'A') {
      match.scoreA = Math.max(0, match.scoreA - lastLog.delta);
    } else {
      match.scoreB = Math.max(0, match.scoreB - lastLog.delta);
    }
    await this.matchRepo.save(match);
    await this.logRepo.delete(lastLog.id);

    const updated = await this.findOneOrFail(id);
    this.gateway.emitScoreUpdate(updated);
    return updated;
  }
}
