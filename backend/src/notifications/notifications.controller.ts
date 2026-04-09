import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    private readonly push: PushService,
  ) {}

  // ===== 웹 푸시 (PWA) =====
  @Get('push/public-key')
  publicKey() {
    return { key: this.push.getPublicKey() };
  }

  @Post('push/subscribe')
  async pushSubscribe(
    @Body()
    body: {
      subscription: {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      userSub?: string | null;
      teamId?: number | null;
    },
  ) {
    const saved = await this.push.saveSubscription(
      body.subscription,
      body.userSub ?? null,
      body.teamId ?? null,
    );
    return { ok: true, endpoint: saved.endpoint };
  }

  @Post('push/unsubscribe')
  async pushUnsubscribe(@Body() body: { endpoint: string }) {
    await this.push.deleteByEndpoint(body.endpoint);
    return { ok: true };
  }

  // 사용자 자체 테스트: 브라우저 자신의 구독(endpoint로 식별)에만 푸시를 전송한다.
  // 브로드캐스트하지 않는다 — 그렇게 하면 임의 방문자가 모든 기기에 스팸을 보낼 수 있다.
  @Post('push/test')
  async pushTest(
    @Body()
    body: {
      title?: string;
      body?: string;
      url?: string;
      tag?: string;
      endpoint: string;
    },
  ) {
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

  @Post('subscribe')
  subscribe(@Body() body: { sub: string; teamId: number }) {
    return this.service.subscribe(body.sub, body.teamId);
  }

  @Delete('subscribe/:teamId')
  unsubscribe(@Param('teamId') teamId: string, @Query('sub') sub: string) {
    return this.service.unsubscribe(sub, parseInt(teamId, 10));
  }

  @Get()
  list(@Query('sub') sub: string) {
    return this.service.listForUser(sub);
  }

  @Get('subscriptions')
  subs(@Query('sub') sub: string) {
    return this.service.listSubscriptions(sub);
  }
}
