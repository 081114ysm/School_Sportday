"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchesGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let MatchesGateway = class MatchesGateway {
    server;
    emitScoreUpdate(match) {
        this.server.emit('scoreUpdate', {
            matchId: match.id,
            scoreA: match.scoreA,
            scoreB: match.scoreB,
            match,
        });
    }
    emitMatchStatusChange(match) {
        this.server.emit('matchStatusChange', match);
        if (match?.status === 'DONE') {
            this.server.emit('match:ended', { matchId: match.id, match });
        }
    }
    emitMatchUpdate(match) {
        this.server.emit('matchUpdate', match);
    }
    emitYoutubeLive(match) {
        this.server.emit('match:live', {
            matchId: match.id,
            youtubeUrl: match.youtubeUrl,
            sport: match.sport,
            teamA: match.teamA?.name,
            teamB: match.teamB?.name,
        });
    }
};
exports.MatchesGateway = MatchesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MatchesGateway.prototype, "server", void 0);
exports.MatchesGateway = MatchesGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } })
], MatchesGateway);
//# sourceMappingURL=matches.gateway.js.map