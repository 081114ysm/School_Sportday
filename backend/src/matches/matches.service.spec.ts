import { MatchesService } from './matches.service';

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
    setsJson: null as string | null,
    status: 'LIVE',
    category: 'GRADE',
    youtubeUrl: null as string | null,
    teamA: { name: 'A' },
    teamB: { name: 'B' },
    ...over,
  });

  function build(initial: any) {
    let current = makeMatch(initial);
    let currentLog: any = null;
    const manager: any = {};
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
    Object.assign(manager, {
      findOne: jest.fn(async (_entity: any, options: any) => {
        if (options?.where?.matchId !== undefined) return currentLog;
        return { ...current };
      }),
      save: jest.fn(async (_entity: any, value: any) => {
        if (value?.matchId !== undefined) {
          currentLog = { ...value, id: currentLog?.id ?? 1 };
          return currentLog;
        }
        current = { ...current, ...value };
        return current;
      }),
      create: jest.fn((_entity: any, value: any) => value),
      delete: jest.fn(async () => {
        currentLog = null;
      }),
      transaction: jest.fn(async (callback: (tx: any) => Promise<unknown>) =>
        callback(manager),
      ),
    });
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
      get lastLog() {
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

  it('updates the score and ScoreLog in one transaction', async () => {
    const ctx = build({});

    const result = await ctx.svc.updateScore(1, 'A', 2);

    expect(result.scoreA).toBe(2);
    expect(ctx.lastLog).toMatchObject({
      matchId: 1,
      team: 'A',
      delta: 2,
      scoreA: 2,
      scoreB: 0,
    });
    expect(ctx.matchRepo.manager.transaction).toHaveBeenCalledTimes(1);
  });

  it('undoes the latest score log in one transaction', async () => {
    const ctx = build({});
    await ctx.svc.updateScore(1, 'A', 2);

    const result = await ctx.svc.undoScore(1);

    expect(result.scoreA).toBe(0);
    expect(ctx.lastLog).toBeNull();
    expect(ctx.matchRepo.manager.transaction).toHaveBeenCalledTimes(2);
  });

  it('restores set scores and status from the score snapshot', async () => {
    const initialSets = JSON.stringify([
      { a: 24, b: 20 },
      { a: 0, b: 0 },
      { a: 0, b: 0 },
    ]);
    const ctx = build({
      sport: 'BIG_VOLLEYBALL',
      scoreA: 24,
      scoreB: 20,
      setsJson: initialSets,
      status: 'LIVE',
      result: null,
    });

    await ctx.svc.updateSetScore(1, 0, 'A', 1);
    expect(ctx.current.setsJson).not.toBe(initialSets);
    expect(ctx.lastLog).toMatchObject({
      previousScoreA: 24,
      previousScoreB: 20,
      previousSetsJson: initialSets,
      previousStatus: 'LIVE',
      previousResult: null,
    });

    const result = await ctx.svc.undoScore(1);

    expect(result.scoreA).toBe(24);
    expect(result.scoreB).toBe(20);
    expect(result.setsJson).toBe(initialSets);
    expect(result.status).toBe('LIVE');
    expect(ctx.gateway.emitMatchStatusChange).not.toHaveBeenCalled();
  });

  it('restores DONE status and result when undoing the set that ended a match', async () => {
    const initialSets = JSON.stringify([
      { a: 25, b: 20 },
      { a: 24, b: 20 },
      { a: 0, b: 0 },
    ]);
    const ctx = build({
      sport: 'BIG_VOLLEYBALL',
      scoreA: 49,
      scoreB: 40,
      setsJson: initialSets,
      status: 'LIVE',
      result: null,
    });

    const finished = await ctx.svc.updateSetScore(1, 1, 'A', 1);
    expect(finished.status).toBe('DONE');
    expect(finished.result).toBe('A 승');

    const restored = await ctx.svc.undoScore(1);

    expect(restored.scoreA).toBe(49);
    expect(restored.scoreB).toBe(40);
    expect(restored.setsJson).toBe(initialSets);
    expect(restored.status).toBe('LIVE');
    expect(restored.result).toBeNull();
    expect(ctx.gateway.emitMatchStatusChange).toHaveBeenCalledTimes(2);
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
