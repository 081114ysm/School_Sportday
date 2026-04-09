import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { NotificationRecord } from './notification.entity';

// FRONTEND_URL 환경변수(콤마 구분)가 없으면 로컬 개발 기본값 사용
function getGatewayOrigins(): string | string[] {
  const envVal = process.env.FRONTEND_URL;
  if (envVal) {
    return envVal.split(',').map((u) => u.trim()).filter(Boolean);
  }
  return ['http://localhost:3000', 'http://localhost:3001'];
}

@WebSocketGateway({ cors: { origin: getGatewayOrigins() } })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  emitNotification(userSub: string, rec: NotificationRecord) {
    // userSub를 키로 하는 룸에 브로드캐스트한다. 클라이언트는 연결 시 룸에 참가해야 한다.
    this.server.to(`user:${userSub}`).emit('notification', rec);
    // 미인증 클라이언트도 테스트 트래픽을 볼 수 있도록 전역 이벤트도 발행한다.
    this.server.emit('notification:global', { userSub, rec });
  }

  /** 특정 매치가 라이브로 전이되었음을 모든 구독자에게 브로드캐스트한다. */
  emitMatchLive(matchId: number, payload: Record<string, unknown>) {
    this.server.emit('match:live', { matchId, ...payload });
  }
}
