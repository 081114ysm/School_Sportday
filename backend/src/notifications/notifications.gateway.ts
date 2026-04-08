import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { NotificationRecord } from './notification.entity';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  emitNotification(userSub: string, rec: NotificationRecord) {
    // Broadcast on a room keyed by userSub. Clients should join on connect.
    this.server.to(`user:${userSub}`).emit('notification', rec);
    // Also fire a global event so unauthenticated clients see test traffic.
    this.server.emit('notification:global', { userSub, rec });
  }

  /** 특정 매치가 라이브로 전이되었음을 모든 구독자에게 브로드캐스트한다. */
  emitMatchLive(matchId: number, payload: Record<string, unknown>) {
    this.server.emit('match:live', { matchId, ...payload });
  }
}
