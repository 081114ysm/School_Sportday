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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("./notifications.service");
const push_service_1 = require("./push.service");
let NotificationsController = class NotificationsController {
    service;
    push;
    constructor(service, push) {
        this.service = service;
        this.push = push;
    }
    publicKey() {
        return { key: this.push.getPublicKey() };
    }
    async pushSubscribe(body) {
        const saved = await this.push.saveSubscription(body.subscription, body.userSub ?? null, body.teamId ?? null);
        return { ok: true, endpoint: saved.endpoint };
    }
    async pushUnsubscribe(body) {
        await this.push.deleteByEndpoint(body.endpoint);
        return { ok: true };
    }
    async pushTest(body) {
        if (!body?.endpoint) {
            return { sent: 0, failed: 0, error: 'endpoint required' };
        }
        return this.push.sendToEndpoint(body.endpoint, {
            title: body.title || '테스트 알림',
            body: body.body || 'PWA 푸시 동작 확인',
            url: body.url || '/',
            tag: body.tag || 'test',
        });
    }
    subscribe(body) {
        return this.service.subscribe(body.sub, body.teamId);
    }
    unsubscribe(teamId, sub) {
        return this.service.unsubscribe(sub, parseInt(teamId, 10));
    }
    list(sub) {
        return this.service.listForUser(sub);
    }
    subs(sub) {
        return this.service.listSubscriptions(sub);
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)('push/public-key'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "publicKey", null);
__decorate([
    (0, common_1.Post)('push/subscribe'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "pushSubscribe", null);
__decorate([
    (0, common_1.Post)('push/unsubscribe'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "pushUnsubscribe", null);
__decorate([
    (0, common_1.Post)('push/test'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "pushTest", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Delete)('subscribe/:teamId'),
    __param(0, (0, common_1.Param)('teamId')),
    __param(1, (0, common_1.Query)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "unsubscribe", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('subscriptions'),
    __param(0, (0, common_1.Query)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "subs", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService,
        push_service_1.PushService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map