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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MatchesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const match_entity_1 = require("./match.entity");
const score_log_entity_1 = require("./score-log.entity");
const matches_gateway_1 = require("./matches.gateway");
const notifications_gateway_1 = require("../notifications/notifications.gateway");
const push_service_1 = require("../notifications/push.service");
function ymd(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}
let MatchesService = MatchesService_1 = class MatchesService {
    matchRepo;
    logRepo;
    gateway;
    notificationsGateway;
    pushService;
    logger = new common_1.Logger(MatchesService_1.name);
    autoTimer = null;
    constructor(matchRepo, logRepo, gateway, notificationsGateway, pushService) {
        this.matchRepo = matchRepo;
        this.logRepo = logRepo;
        this.gateway = gateway;
        this.notificationsGateway = notificationsGateway;
        this.pushService = pushService;
    }
    onModuleInit() {
        void this.autoFinalizePastMatches();
        this.autoTimer = setInterval(() => {
            void this.autoFinalizePastMatches();
        }, 10 * 60 * 1000);
    }
    onModuleDestroy() {
        if (this.autoTimer)
            clearInterval(this.autoTimer);
    }
    async autoFinalizePastMatches() {
        try {
            const today = ymd(new Date());
            const candidates = await this.matchRepo.find({
                where: {
                    matchDate: (0, typeorm_2.LessThan)(today),
                    status: (0, typeorm_2.Not)('DONE'),
                },
            });
            const toFinalize = candidates.filter((m) => m.status !== 'LIVE' && m.matchDate != null);
            if (toFinalize.length === 0)
                return;
            for (const m of toFinalize) {
                await this.updateStatus(m.id, 'DONE');
            }
            this.logger.log(`Auto-finalized ${toFinalize.length} past match(es)`);
        }
        catch (err) {
            this.logger.error('autoFinalizePastMatches failed', err);
        }
    }
    findAll(filters) {
        const where = {};
        if (filters.day)
            where.day = filters.day;
        if (filters.status)
            where.status = filters.status;
        if (filters.sport)
            where.sport = filters.sport;
        if (filters.matchDate)
            where.matchDate = filters.matchDate;
        return this.matchRepo.find({ where, relations: ['teamA', 'teamB'], order: { day: 'ASC', timeSlot: 'ASC' } });
    }
    findLive() {
        return this.matchRepo.find({ where: { status: 'LIVE' }, relations: ['teamA', 'teamB'] });
    }
    async findOneOrFail(id) {
        const match = await this.matchRepo.findOne({ where: { id }, relations: ['teamA', 'teamB'] });
        if (!match)
            throw new common_1.NotFoundException('Match not found');
        return match;
    }
    async create(dto) {
        const match = this.matchRepo.create({ ...dto, category: dto.category || 'GRADE' });
        const saved = await this.matchRepo.save(match);
        return this.findOneOrFail(saved.id);
    }
    async update(id, data) {
        await this.matchRepo.update(id, data);
        const match = await this.findOneOrFail(id);
        this.gateway.emitMatchUpdate(match);
        return match;
    }
    async remove(id) {
        await this.logRepo.delete({ matchId: id });
        await this.matchRepo.delete(id);
    }
    async updateScore(id, team, delta) {
        const match = await this.findOneOrFail(id);
        if (team === 'A') {
            match.scoreA = Math.max(0, match.scoreA + delta);
        }
        else {
            match.scoreB = Math.max(0, match.scoreB + delta);
        }
        await this.matchRepo.save(match);
        const log = this.logRepo.create({
            matchId: id,
            team,
            delta,
            scoreA: match.scoreA,
            scoreB: match.scoreB,
        });
        await this.logRepo.save(log);
        const updated = await this.findOneOrFail(id);
        this.gateway.emitScoreUpdate(updated);
        return updated;
    }
    async updateStatus(id, status) {
        const match = await this.findOneOrFail(id);
        const prevStatus = match.status;
        match.status = status;
        if (prevStatus !== 'LIVE' && status === 'LIVE') {
            this.notificationsGateway.emitMatchLive(match.id, {
                sport: match.sport,
                teamA: match.teamA?.name,
                teamB: match.teamB?.name,
            });
            void this.pushService.sendToAll({
                title: `🔴 ${match.sport} 경기 시작`,
                body: `${match.teamA?.name ?? 'Team A'} vs ${match.teamB?.name ?? 'Team B'}`,
                url: '/today',
                tag: `match-live-${match.id}`,
            });
        }
        if (status === 'DONE') {
            if (match.scoreA > match.scoreB) {
                match.result = (match.teamA?.name ?? 'Team A') + ' 승';
            }
            else if (match.scoreB > match.scoreA) {
                match.result = (match.teamB?.name ?? 'Team B') + ' 승';
            }
            else {
                match.result = '무승부';
            }
        }
        await this.matchRepo.save(match);
        const updated = await this.findOneOrFail(id);
        this.gateway.emitMatchStatusChange(updated);
        return updated;
    }
    async setScore(id, scoreA, scoreB) {
        const match = await this.findOneOrFail(id);
        match.scoreA = Math.max(0, Math.floor(scoreA));
        match.scoreB = Math.max(0, Math.floor(scoreB));
        await this.matchRepo.save(match);
        const updated = await this.findOneOrFail(id);
        this.gateway.emitScoreUpdate(updated);
        return updated;
    }
    async setYoutubeUrl(id, url) {
        const match = await this.findOneOrFail(id);
        const wasEmpty = !match.youtubeUrl;
        match.youtubeUrl = url;
        await this.matchRepo.save(match);
        const updated = await this.findOneOrFail(id);
        if (url && wasEmpty) {
            this.gateway.emitYoutubeLive(updated);
            this.notificationsGateway.emitMatchLive(updated.id, {
                sport: updated.sport,
                teamA: updated.teamA?.name,
                teamB: updated.teamB?.name,
                youtubeUrl: url,
            });
            void this.pushService.sendToAll({
                title: `📺 ${updated.sport} 라이브 시작`,
                body: `${updated.teamA?.name ?? 'Team A'} vs ${updated.teamB?.name ?? 'Team B'} · 유튜브에서 시청하기`,
                url,
                tag: `youtube-live-${updated.id}`,
            });
        }
        return updated;
    }
    async updateSetScore(id, _setIndex, team, delta) {
        const SET_TARGET = 25;
        const SETS_TO_WIN = 2;
        const match = await this.findOneOrFail(id);
        let sets = [];
        try {
            sets = match.setsJson ? JSON.parse(match.setsJson) : [];
        }
        catch {
            sets = [];
        }
        while (sets.length < 3)
            sets.push({ a: 0, b: 0 });
        const setWinner = (s) => {
            if (s.a >= SET_TARGET && s.a > s.b)
                return 'A';
            if (s.b >= SET_TARGET && s.b > s.a)
                return 'B';
            return null;
        };
        const countWins = () => {
            let aw = 0, bw = 0;
            for (const s of sets) {
                const w = setWinner(s);
                if (w === 'A')
                    aw++;
                else if (w === 'B')
                    bw++;
            }
            return { aw, bw };
        };
        const winsBefore = countWins();
        const matchAlreadyDone = winsBefore.aw >= SETS_TO_WIN || winsBefore.bw >= SETS_TO_WIN;
        if (!matchAlreadyDone) {
            let active = sets.findIndex((s) => setWinner(s) === null);
            if (active === -1)
                active = sets.length - 1;
            if (team === 'A')
                sets[active].a = Math.max(0, sets[active].a + delta);
            else
                sets[active].b = Math.max(0, sets[active].b + delta);
            if (sets[active].a > SET_TARGET)
                sets[active].a = SET_TARGET;
            if (sets[active].b > SET_TARGET)
                sets[active].b = SET_TARGET;
        }
        match.setsJson = JSON.stringify(sets);
        match.scoreA = sets.reduce((s, x) => s + x.a, 0);
        match.scoreB = sets.reduce((s, x) => s + x.b, 0);
        const winsAfter = countWins();
        if ((winsAfter.aw >= SETS_TO_WIN || winsAfter.bw >= SETS_TO_WIN) &&
            match.status !== 'DONE') {
            match.status = 'DONE';
            if (winsAfter.aw > winsAfter.bw) {
                match.result = (match.teamA?.name ?? 'Team A') + ' 승';
            }
            else {
                match.result = (match.teamB?.name ?? 'Team B') + ' 승';
            }
        }
        await this.matchRepo.save(match);
        const log = this.logRepo.create({
            matchId: id,
            team: `${team}`,
            delta,
            scoreA: match.scoreA,
            scoreB: match.scoreB,
        });
        await this.logRepo.save(log);
        const updated = await this.findOneOrFail(id);
        this.gateway.emitScoreUpdate(updated);
        if (updated.status === 'DONE') {
            this.gateway.emitMatchStatusChange(updated);
        }
        return updated;
    }
    async undoScore(id) {
        const lastLog = await this.logRepo.findOne({
            where: { matchId: id },
            order: { id: 'DESC' },
        });
        if (!lastLog)
            throw new common_1.NotFoundException('No score history');
        const match = await this.findOneOrFail(id);
        if (lastLog.team === 'A') {
            match.scoreA = Math.max(0, match.scoreA - lastLog.delta);
        }
        else {
            match.scoreB = Math.max(0, match.scoreB - lastLog.delta);
        }
        await this.matchRepo.save(match);
        await this.logRepo.delete(lastLog.id);
        const updated = await this.findOneOrFail(id);
        this.gateway.emitScoreUpdate(updated);
        return updated;
    }
};
exports.MatchesService = MatchesService;
exports.MatchesService = MatchesService = MatchesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __param(1, (0, typeorm_1.InjectRepository)(score_log_entity_1.ScoreLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        matches_gateway_1.MatchesGateway,
        notifications_gateway_1.NotificationsGateway,
        push_service_1.PushService])
], MatchesService);
//# sourceMappingURL=matches.service.js.map