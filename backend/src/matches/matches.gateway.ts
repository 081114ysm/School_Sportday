import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class MatchesGateway {
  @WebSocketServer()
  server: Server;

  emitScoreUpdate(match: any) {
    this.server.emit('scoreUpdate', {
      matchId: match.id,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      match,
    });
  }

  emitMatchStatusChange(match: any) {
    this.server.emit('matchStatusChange', match);
    if (match?.status === 'DONE') {
      this.server.emit('match:ended', { matchId: match.id, match });
    }
  }

  emitMatchUpdate(match: any) {
    this.server.emit('matchUpdate', match);
  }

  emitYoutubeLive(match: any) {
    this.server.emit('match:live', {
      matchId: match.id,
      youtubeUrl: match.youtubeUrl,
      sport: match.sport,
      teamA: match.teamA?.name,
      teamB: match.teamB?.name,
    });
  }
}
