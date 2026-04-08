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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const match_entity_1 = require("../matches/match.entity");
const teams_service_1 = require("../teams/teams.service");
let RankingsService = class RankingsService {
    matchRepo;
    teamsService;
    constructor(matchRepo, teamsService) {
        this.matchRepo = matchRepo;
        this.teamsService = teamsService;
    }
    async getRankings(grade, category) {
        const teams = await this.teamsService.findAll(grade, category);
        const doneMatches = await this.matchRepo.find({
            where: { status: 'DONE' },
            relations: ['teamA', 'teamB'],
            order: { id: 'DESC' },
        });
        const rankings = teams.map((team) => {
            const teamMatches = doneMatches.filter((m) => m.teamAId === team.id || m.teamBId === team.id);
            let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
            teamMatches.forEach((m) => {
                const isA = m.teamAId === team.id;
                const myScore = isA ? m.scoreA : m.scoreB;
                const opScore = isA ? m.scoreB : m.scoreA;
                goalsFor += myScore;
                goalsAgainst += opScore;
                if (myScore > opScore)
                    wins++;
                else if (myScore === opScore)
                    draws++;
                else
                    losses++;
            });
            const recentForm = teamMatches.slice(0, 5).map((m) => {
                const isA = m.teamAId === team.id;
                const myScore = isA ? m.scoreA : m.scoreB;
                const opScore = isA ? m.scoreB : m.scoreA;
                const opponent = isA ? m.teamB?.name ?? '' : m.teamA?.name ?? '';
                const score = `${myScore}-${opScore}`;
                let result;
                if (myScore > opScore)
                    result = 'W';
                else if (myScore === opScore)
                    result = 'D';
                else
                    result = 'L';
                return { result, opponent, score };
            });
            return {
                team,
                played: teamMatches.length,
                wins,
                draws,
                losses,
                goalsFor,
                goalsAgainst,
                goalDiff: goalsFor - goalsAgainst,
                points: wins * 3 + draws,
                recentForm,
            };
        });
        rankings.sort((a, b) => {
            if (b.points !== a.points)
                return b.points - a.points;
            return b.goalDiff - a.goalDiff;
        });
        return rankings;
    }
};
exports.RankingsService = RankingsService;
exports.RankingsService = RankingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        teams_service_1.TeamsService])
], RankingsService);
//# sourceMappingURL=rankings.service.js.map