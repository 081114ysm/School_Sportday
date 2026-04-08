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
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const team_entity_1 = require("../teams/team.entity");
const match_entity_1 = require("../matches/match.entity");
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const TODAY_KEY = (() => {
    const d = new Date().getDay();
    return ['MON', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'FRI'][d];
})();
let SeedService = class SeedService {
    teamRepo;
    matchRepo;
    constructor(teamRepo, matchRepo) {
        this.teamRepo = teamRepo;
        this.matchRepo = matchRepo;
    }
    async onModuleInit() {
        const teamCount = await this.teamRepo.count();
        if (teamCount > 0)
            return;
        console.log('Seeding database...');
        const teams = [];
        for (let grade = 1; grade <= 3; grade++) {
            for (let cls = 1; cls <= 4; cls++) {
                teams.push(await this.teamRepo.save(this.teamRepo.create({
                    name: `${grade}학년 ${cls}반`,
                    grade,
                    classNumber: cls,
                    category: 'GRADE',
                })));
            }
        }
        for (const letter of ['A', 'B', 'C', 'D']) {
            teams.push(await this.teamRepo.save(this.teamRepo.create({
                name: `${letter}팀`,
                grade: null,
                classNumber: null,
                category: 'CLUB',
            })));
        }
        const grade = teams.filter((t) => t.category === 'GRADE');
        const club = teams.filter((t) => t.category === 'CLUB');
        const g = (gr, cls) => grade.find((t) => t.grade === gr && t.classNumber === cls);
        const c = (letter) => club.find((t) => t.name === `${letter}팀`);
        const slotTime = (slot) => slot === 'LUNCH' ? { hour: 12, minute: 50 } : { hour: 18, minute: 30 };
        const now = new Date();
        const monday = new Date(now);
        const dow = now.getDay();
        const offset = dow === 0 ? -6 : 1 - dow;
        monday.setDate(now.getDate() + offset);
        monday.setHours(0, 0, 0, 0);
        const dateOf = (day, slot) => {
            const idx = DAYS.indexOf(day);
            const d = new Date(monday);
            d.setDate(monday.getDate() + idx);
            const t = slotTime(slot);
            d.setHours(t.hour, t.minute, 0, 0);
            return d;
        };
        const decideStatus = (day, slot) => {
            const target = dateOf(day, slot);
            const todayIdx = DAYS.indexOf(TODAY_KEY);
            const dayIdx = DAYS.indexOf(day);
            if (dayIdx < todayIdx)
                return 'DONE';
            if (dayIdx > todayIdx)
                return 'SCHEDULED';
            const diffMin = (now.getTime() - target.getTime()) / 60000;
            if (diffMin >= 90)
                return 'DONE';
            if (diffMin >= -10)
                return 'LIVE';
            return 'SCHEDULED';
        };
        const plans = [
            { day: 'MON', slot: 'LUNCH', sport: 'FUTSAL', a: g(1, 1), b: g(1, 2), category: 'GRADE' },
            { day: 'MON', slot: 'DINNER', sport: 'BASKETBALL', a: c('A'), b: c('B'), category: 'CLUB' },
            { day: 'TUE', slot: 'LUNCH', sport: 'DODGEBALL', a: g(2, 1), b: g(2, 2), category: 'GRADE' },
            { day: 'TUE', slot: 'DINNER', sport: 'SOCCER', a: g(3, 1), b: g(3, 2), category: 'GRADE' },
            { day: 'WED', slot: 'LUNCH', sport: 'BIG_VOLLEYBALL', a: g(3, 3), b: g(3, 4), category: 'GRADE' },
            { day: 'WED', slot: 'DINNER', sport: 'BASKETBALL', a: c('C'), b: c('D'), category: 'CLUB' },
            { day: 'THU', slot: 'LUNCH', sport: 'BADMINTON', a: g(2, 3), b: g(2, 4), category: 'GRADE' },
            { day: 'THU', slot: 'DINNER', sport: 'RELAY', a: c('A'), b: c('C'), category: 'CLUB' },
            { day: 'FRI', slot: 'LUNCH', sport: 'JUMP_ROPE', a: g(1, 3), b: g(1, 4), category: 'GRADE' },
        ];
        const scorePool = [
            [3, 1], [2, 2], [4, 0], [1, 2], [0, 3], [2, 1], [3, 3], [1, 0], [2, 0],
        ];
        const forcedLiveIdx = 0;
        let i = 0;
        for (const p of plans) {
            let status = decideStatus(p.day, p.slot);
            if (i === forcedLiveIdx)
                status = 'LIVE';
            const data = {
                sport: p.sport,
                day: p.day,
                timeSlot: p.slot,
                teamAId: p.a.id,
                teamBId: p.b.id,
                category: p.category,
                status,
            };
            if (status === 'DONE') {
                const [sa, sb] = scorePool[i % scorePool.length];
                data.scoreA = sa;
                data.scoreB = sb;
                data.result = sa > sb ? `${p.a.name} 승` : sb > sa ? `${p.b.name} 승` : '무승부';
            }
            else if (status === 'LIVE') {
                data.scoreA = 1;
                data.scoreB = 1;
            }
            await this.matchRepo.save(this.matchRepo.create(data));
            i++;
        }
        const matchCount = await this.matchRepo.count();
        console.log(`Seeding complete: ${teams.length} teams (${grade.length} grade + ${club.length} club), ${matchCount} matches`);
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(team_entity_1.Team)),
    __param(1, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SeedService);
//# sourceMappingURL=seed.service.js.map