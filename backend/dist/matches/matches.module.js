"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const match_entity_1 = require("./match.entity");
const score_log_entity_1 = require("./score-log.entity");
const matches_service_1 = require("./matches.service");
const matches_controller_1 = require("./matches.controller");
const matches_gateway_1 = require("./matches.gateway");
const teams_module_1 = require("../teams/teams.module");
const notifications_module_1 = require("../notifications/notifications.module");
let MatchesModule = class MatchesModule {
};
exports.MatchesModule = MatchesModule;
exports.MatchesModule = MatchesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([match_entity_1.Match, score_log_entity_1.ScoreLog]), teams_module_1.TeamsModule, notifications_module_1.NotificationsModule],
        controllers: [matches_controller_1.MatchesController],
        providers: [matches_service_1.MatchesService, matches_gateway_1.MatchesGateway],
        exports: [matches_service_1.MatchesService],
    })
], MatchesModule);
//# sourceMappingURL=matches.module.js.map