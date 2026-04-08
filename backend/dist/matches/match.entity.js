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
exports.Match = void 0;
const typeorm_1 = require("typeorm");
const team_entity_1 = require("../teams/team.entity");
let Match = class Match {
    id;
    sport;
    day;
    matchDate;
    timeSlot;
    teamAId;
    teamBId;
    scoreA;
    scoreB;
    status;
    result;
    category;
    youtubeUrl;
    setsJson;
    teamA;
    teamB;
    createdAt;
};
exports.Match = Match;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Match.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Match.prototype, "sport", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Match.prototype, "day", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], Match.prototype, "matchDate", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Match.prototype, "timeSlot", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Match.prototype, "teamAId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Match.prototype, "teamBId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Match.prototype, "scoreA", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Match.prototype, "scoreB", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'SCHEDULED' }),
    __metadata("design:type", String)
], Match.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Match.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'GRADE' }),
    __metadata("design:type", String)
], Match.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], Match.prototype, "youtubeUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", Object)
], Match.prototype, "setsJson", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => team_entity_1.Team, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'teamAId' }),
    __metadata("design:type", team_entity_1.Team)
], Match.prototype, "teamA", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => team_entity_1.Team, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'teamBId' }),
    __metadata("design:type", team_entity_1.Team)
], Match.prototype, "teamB", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Match.prototype, "createdAt", void 0);
exports.Match = Match = __decorate([
    (0, typeorm_1.Entity)()
], Match);
//# sourceMappingURL=match.entity.js.map