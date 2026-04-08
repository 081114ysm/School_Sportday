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
    status: 'LIVE',
    category: 'GRADE',
    youtubeUrl: null as string | null,
    teamA: { name: 'A' },
    teamB: { name: 'B' },
    ...over,
  });

  function build(initial: any) {
    let current = makeMatch(initial);
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
    };
    const logRepo: any = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((d: any) => d),
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
    const svc = new MatchesService(matchRepo, logRepo, gateway, notiGateway, pushService);
    return { svc, matchRepo, gateway, notiGateway, get current() { return current; } };
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
