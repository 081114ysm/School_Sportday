import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { TeamSubscription } from './subscription.entity';
import { NotificationRecord } from './notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const subs: TeamSubscription[] = [];
  const notis: NotificationRecord[] = [];

  const subRepo = {
    findOne: jest.fn(({ where }) =>
      Promise.resolve(
        subs.find(
          (s) => s.userSub === where.userSub && s.teamId === where.teamId,
        ) ?? null,
      ),
    ),
    find: jest.fn(({ where }) =>
      Promise.resolve(subs.filter((s) => s.teamId === where.teamId)),
    ),
    create: jest.fn(
      (dto: Partial<TeamSubscription>) => ({ ...dto }) as TeamSubscription,
    ),
    save: jest.fn((s: TeamSubscription) => {
      const saved = { ...s, id: subs.length + 1 } as TeamSubscription;
      subs.push(saved);
      return Promise.resolve(saved);
    }),
    delete: jest.fn(({ userSub, teamId }) => {
      const idx = subs.findIndex(
        (s) => s.userSub === userSub && s.teamId === teamId,
      );
      if (idx >= 0) subs.splice(idx, 1);
      return Promise.resolve({ affected: 1 });
    }),
  };

  const notiRepo = {
    create: jest.fn(
      (dto: Partial<NotificationRecord>) => ({ ...dto }) as NotificationRecord,
    ),
    save: jest.fn((n: NotificationRecord) => {
      const saved = { ...n, id: notis.length + 1 } as NotificationRecord;
      notis.push(saved);
      return Promise.resolve(saved);
    }),
    find: jest.fn(({ where }) =>
      Promise.resolve(notis.filter((n) => n.userSub === where.userSub)),
    ),
  };

  const gateway = {
    emitNotification: jest.fn(),
  } as unknown as NotificationsGateway;

  beforeEach(async () => {
    subs.length = 0;
    notis.length = 0;
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(TeamSubscription), useValue: subRepo },
        { provide: getRepositoryToken(NotificationRecord), useValue: notiRepo },
        { provide: NotificationsGateway, useValue: gateway },
      ],
    }).compile();
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('subscribes a user and prevents duplicates', async () => {
    await service.subscribe('userA', 5);
    await service.subscribe('userA', 5);
    expect(subs.length).toBe(1);
  });

  it('notifies all subscribers of a team and persists records', async () => {
    await service.subscribe('userA', 7);
    await service.subscribe('userB', 7);
    await service.notifyTeam(7, '경기 시작', '2학년 1반 vs 2학년 2반');
    expect(notis.length).toBe(2);
    expect(gateway.emitNotification).toHaveBeenCalledTimes(2);
  });

  it('unsubscribe removes the row', async () => {
    await service.subscribe('userC', 9);
    await service.unsubscribe('userC', 9);
    expect(subs.length).toBe(0);
  });
});
