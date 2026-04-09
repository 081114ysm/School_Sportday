import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamSubscription } from './subscription.entity';
import { NotificationRecord } from './notification.entity';
import { PushSubscription } from './push-subscription.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { PushService } from './push.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeamSubscription,
      NotificationRecord,
      PushSubscription,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, PushService],
  exports: [NotificationsService, NotificationsGateway, PushService],
})
export class NotificationsModule {}
