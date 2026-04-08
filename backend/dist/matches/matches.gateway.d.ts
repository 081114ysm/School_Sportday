import { Server } from 'socket.io';
export declare class MatchesGateway {
    server: Server;
    emitScoreUpdate(match: any): void;
    emitMatchStatusChange(match: any): void;
    emitMatchUpdate(match: any): void;
    emitYoutubeLive(match: any): void;
}
