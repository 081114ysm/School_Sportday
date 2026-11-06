import { MatchesService } from './matches.service';
import { Match } from './match.entity';
import { ScoreLog } from './score-log.entity';

describe('MatchesService (unit)', () => {
  const makeMatch = (over: any = {}) => ({
    id: 1,
    sport: 'SOCCER',
    day: 'MON',
    timeSlot: 'LUNCH',
    teamAId: 1,
    teamBId: 2,
    scoreA: 0,
    scoreB: 0,
    status: 'LIVE',
    category: 'GRADE',
    youtubeUrl: null as string | null,
    teamA: { name: 'A' },
    teamB: { name: 'B' },
    ...over,
  });

  function build(initial: any, options: { failScoreLogSave?: boolean } = {}) {
    let current = makeMatch(initial);
    let currentLog: any = null;
    const manager: any = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Match) return { ...current };
        if (entity === ScoreLog) return currentLog ? { ...currentLog } : null;
        return null;
      }),
      create: jest.fn((_entity: unknown, data: any) => ({
        id: currentLog?.id ?? 1,
        ...data,
      })),
      save: jest.fn(async (entity: unknown, value: any) => {
        if (entity === Match) {
          current = { ...current, ...value };
          return current;
        }
        if (entity === ScoreLog) {
          if (options.failScoreLogSave) throw new Error('ScoreLog save failed');
          currentLog = { ...value };
          return currentLog;
        }
        return value;
      }),
      delete: jest.fn(async (entity: unknown) => {
        if (entity === ScoreLog) currentLog = null;
      }),
    };
    manager.transaction = jest.fn(async (callback: (tx: any) => Promise<unknown>) => {
      const previousMatch = { ...current };
      const previousLog = currentLog ? { ...currentLog } : null;
      try {
        return await callback(manager);
      } catch (error) {
        current = previousMatch;
        currentLog = previousLog;
        throw error;
      }
    });
    const matchRepo: any = {
      findOne: jest.fn(async () => ({ ...current })),
      save: jest.fn(async (m: any) => {
        current = { ...current, ...m };
        return current;
      }),
      update: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
      create: jest.fn((d: any) => d),
      manager,
    };
    const logRepo: any = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((d: any) => d),
    };
    const teamRepo: any = {
      findByIds: jest.fn(async () => []),
    };
    const gateway: any = {
      emitScoreUpdate: jest.fn(),
      emitMatchStatusChange: jest.fn(),
      emitMatchUpdate: jest.fn(),
      emitYoutubeLive: jest.fn(),
    };
    const notiGateway: any = {
      emitMatchLive: jest.fn(),
    };
    const pushService: any = { sendToAll: jest.fn(), sendToTeam: jest.fn() };
    const svc = new MatchesService(
      matchRepo,
      logRepo,
      teamRepo,
      gateway,
      notiGateway,
      pushService,
    );
    return {
      svc,
      matchRepo,
      gateway,
      notiGateway,
      get current() {
        return current;
      },
      get currentLog() {
        return currentLog;
      },
    };
  }

  it('setScore updates both scores and emits update', async () => {
    const ctx = build({});
    const result = await ctx.svc.setScore(1, 3, 2);
    expect(result.scoreA).toBe(3);
    expect(result.scoreB).toBe(2);
    expect(ctx.gateway.emitScoreUpdate).toHaveBeenCalled();
  });

  it('setScore floors negatives to zero', async () => {
    const ctx = build({});
    const result = await ctx.svc.setScore(1, -5, 7);
    expect(result.scoreA).toBe(0);
    expect(result.scoreB).toBe(7);
  });

  it('saves the score and ScoreLog in one transaction', async () => {
    const ctx = build({ scoreA: 10 });

    const result = await ctx.svc.updateScore(1, 'A', 1);

    expect(result.scoreA).toBe(11);
    expect(ctx.current.scoreA).toBe(11);
    expect(ctx.currentLog).toMatchObject({
      matchId: 1,
      team: 'A',
      delta: 1,
      scoreA: 11,
      scoreB: 0,
    });
    expect(ctx.matchRepo.manager.transaction).toHaveBeenCalledTimes(1);
    expect(ctx.gateway.emitScoreUpdate).toHaveBeenCalledTimes(1);
  });

  it('rolls back the Match when ScoreLog save fails', async () => {
    const ctx = build({ scoreA: 10 }, { failScoreLogSave: true });

    await expect(ctx.svc.updateScore(1, 'A', 1)).rejects.toThrow(
      'ScoreLog save failed',
    );

    expect(ctx.current.scoreA).toBe(10);
    expect(ctx.currentLog).toBeNull();
    expect(ctx.gateway.emitScoreUpdate).not.toHaveBeenCalled();
  });

  it('saves a set score and ScoreLog in one transaction', async () => {
    const ctx = build({
      sport: 'BIG_VOLLEYBALL',
      setsJson: JSON.stringify([{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }]),
    });

    const result = await ctx.svc.updateSetScore(1, 0, 'A', 1);

    expect(result.scoreA).toBe(1);
    expect(ctx.currentLog).toMatchObject({ matchId: 1, team: 'A', delta: 1 });
    expect(ctx.matchRepo.manager.transaction).toHaveBeenCalledTimes(1);
  });

  it('rolls back a set score when ScoreLog save fails', async () => {
    const initialSets = JSON.stringify([
      { a: 10, b: 8 },
      { a: 0, b: 0 },
      { a: 0, b: 0 },
    ]);
    const ctx = build(
      {
        sport: 'BIG_VOLLEYBALL',
        scoreA: 10,
        scoreB: 8,
        setsJson: initialSets,
      },
      { failScoreLogSave: true },
    );

    await expect(ctx.svc.updateSetScore(1, 0, 'A', 1)).rejects.toThrow(
      'ScoreLog save failed',
    );

    expect(ctx.current.scoreA).toBe(10);
    expect(ctx.current.scoreB).toBe(8);
    expect(ctx.current.setsJson).toBe(initialSets);
    expect(ctx.currentLog).toBeNull();
    expect(ctx.gateway.emitScoreUpdate).not.toHaveBeenCalled();
  });

  it('setYoutubeUrl stores url and emits live event when first set', async () => {
    const ctx = build({ youtubeUrl: null });
    await ctx.svc.setYoutubeUrl(1, 'https://youtu.be/abc');
    expect(ctx.gateway.emitYoutubeLive).toHaveBeenCalled();
    expect(ctx.notiGateway.emitMatchLive).toHaveBeenCalled();
  });

  it('setYoutubeUrl does not re-emit when url already set', async () => {
    const ctx = build({ youtubeUrl: 'https://youtu.be/old' });
    await ctx.svc.setYoutubeUrl(1, 'https://youtu.be/new');
    expect(ctx.gateway.emitYoutubeLive).not.toHaveBeenCalled();
  });
});
