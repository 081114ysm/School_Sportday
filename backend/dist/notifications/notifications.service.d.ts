import { Repository } from 'typeorm';
import { TeamSubscription } from './subscription.entity';
import { NotificationRecord } from './notification.entity';
import { NotificationsGateway } from './notifications.gateway';
export declare class NotificationsService {
    private readonly subRepo;
    private readonly notiRepo;
    private readonly gateway;
    constructor(subRepo: Repository<TeamSubscription>, notiRepo: Repository<NotificationRecord>, gateway: NotificationsGateway);
    subscribe(userSub: string, teamId: number): Promise<TeamSubscription>;
    unsubscribe(userSub: string, teamId: number): Promise<void>;
    listForUser(userSub: string): Promise<NotificationRecord[]>;
    listSubscriptions(userSub: string): Promise<TeamSubscription[]>;
    notifyTeam(teamId: number, title: string, body: string, kind?: string): Promise<void>;
}
