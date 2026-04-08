import { Server } from 'socket.io';
import { NotificationRecord } from './notification.entity';
export declare class NotificationsGateway {
    server: Server;
    emitNotification(userSub: string, rec: NotificationRecord): void;
    emitMatchLive(matchId: number, payload: Record<string, unknown>): void;
}
