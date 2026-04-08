import { Injectable, NotFoundException, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, IsNull } from 'typeorm';
import { Match } from './match.entity';
import { ScoreLog } from './score-log.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { MatchesGateway } from './matches.gateway';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { PushService } from '../notifications/push.service';

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
    private gateway: MatchesGateway,
    private notificationsGateway: NotificationsGateway,
    private pushService: PushService,
  ) {}

  onModuleInit() {
    // Run once on boot, then every 10 minutes. Past matches auto-flip to DONE
    // so user-facing pages stay correct without anyone opening admin.
    void this.autoFinalizePastMatches();
    this.autoTimer = setInterval(() => {
      void this.autoFinalizePastMatches();
    }, 10 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.autoTimer) clearInterval(this.autoTimer);
  }

  // Flip any non-LIVE, non-DONE match whose matchDate is now in the past to
  // DONE. LIVE is preserved (admin must end it explicitly). Matches without a
  // matchDate are ignored.
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

  findAll(filters: { day?: string; status?: string; sport?: string; matchDate?: string }): Promise<Match[]> {
    const where: any = {};
    if (filters.day) where.day = filters.day;
    if (filters.status) where.status = filters.status;
    if (filters.sport) where.sport = filters.sport;
    if (filters.matchDate) where.matchDate = filters.matchDate;
    return this.matchRepo.find({ where, relations: ['teamA', 'teamB'], order: { day: 'ASC', timeSlot: 'ASC' } });
  }

  findLive(): Promise<Match[]> {
    return this.matchRepo.find({ where: { status: 'LIVE' }, relations: ['teamA', 'teamB'] });
  }

  async findOneOrFail(id: number): Promise<Match> {
    const match = await this.matchRepo.findOne({ where: { id }, relations: ['teamA', 'teamB'] });
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  async create(dto: CreateMatchDto): Promise<Match> {
    const match = this.matchRepo.create({ ...dto, category: dto.category || 'GRADE' });
    const saved = await this.matchRepo.save(match);
    return this.findOneOrFail(saved.id);
  }

  async update(id: number, data: Partial<Match>): Promise<Match> {
    await this.matchRepo.update(id, data);
    const match = await this.findOneOrFail(id);
    this.gateway.emitMatchUpdate(match);
    return match;
  }

  async remove(id: number): Promise<void> {
    await this.logRepo.delete({ matchId: id });
    await this.matchRepo.delete(id);
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
      // PWA push to all subscribers — works even when app is closed.
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

  // ===== Multi-set scoring (volleyball) =====
  // Volleyball rules: each set ends when a side reaches 25 points. Match is
  // best-of-3 — first team to win 2 sets wins the match. The `setIndex`
  // parameter from the client is treated as a hint only; the server always
  // applies score deltas to the first unfinished set, and ignores any updates
  // once 2 sets have been won.
  async updateSetScore(
    id: number,
    _setIndex: number,
    team: 'A' | 'B',
    delta: number,
  ): Promise<Match> {
    const SET_TARGET = 25;
    const SETS_TO_WIN = 2;
    const match = await this.findOneOrFail(id);
    let sets: Array<{ a: number; b: number }> = [];
    try {
      sets = match.setsJson ? JSON.parse(match.setsJson) : [];
    } catch {
      sets = [];
    }
    while (sets.length < 3) sets.push({ a: 0, b: 0 });

    const setWinner = (s: { a: number; b: number }): 'A' | 'B' | null => {
      if (s.a >= SET_TARGET && s.a > s.b) return 'A';
      if (s.b >= SET_TARGET && s.b > s.a) return 'B';
      return null;
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
      // Find first unfinished set; that's the "current" set we apply to.
      let active = sets.findIndex((s) => setWinner(s) === null);
      if (active === -1) active = sets.length - 1;

      if (team === 'A') sets[active].a = Math.max(0, sets[active].a + delta);
      else sets[active].b = Math.max(0, sets[active].b + delta);

      // Cap at SET_TARGET so a single set can't run away past 25.
      if (sets[active].a > SET_TARGET) sets[active].a = SET_TARGET;
      if (sets[active].b > SET_TARGET) sets[active].b = SET_TARGET;
    }

    match.setsJson = JSON.stringify(sets);
    // Mirror total sum into scoreA/scoreB so summary views keep working.
    match.scoreA = sets.reduce((s, x) => s + x.a, 0);
    match.scoreB = sets.reduce((s, x) => s + x.b, 0);

    // If a team has now won 2 sets, finalize the match.
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
