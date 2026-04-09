import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamSubscription } from './subscription.entity';
import { NotificationRecord } from './notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(TeamSubscription)
    private readonly subRepo: Repository<TeamSubscription>,
    @InjectRepository(NotificationRecord)
    private readonly notiRepo: Repository<NotificationRecord>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async subscribe(userSub: string, teamId: number): Promise<TeamSubscription> {
    const existing = await this.subRepo.findOne({ where: { userSub, teamId } });
    if (existing) return existing;
    return this.subRepo.save(this.subRepo.create({ userSub, teamId }));
  }

  async unsubscribe(userSub: string, teamId: number): Promise<void> {
    await this.subRepo.delete({ userSub, teamId });
  }

  async listForUser(userSub: string): Promise<NotificationRecord[]> {
    return this.notiRepo.find({
      where: { userSub },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async listSubscriptions(userSub: string): Promise<TeamSubscription[]> {
    return this.subRepo.find({ where: { userSub } });
  }

  /** 팀의 모든 구독자에게 경기 이벤트를 알린다. */
  async notifyTeam(
    teamId: number,
    title: string,
    body: string,
    kind = 'MATCH',
  ): Promise<void> {
    const subs = await this.subRepo.find({ where: { teamId } });
    for (const sub of subs) {
      const rec = await this.notiRepo.save(
        this.notiRepo.create({ userSub: sub.userSub, title, body, kind }),
      );
      this.gateway.emitNotification(sub.userSub, rec);
    }
  }
}
