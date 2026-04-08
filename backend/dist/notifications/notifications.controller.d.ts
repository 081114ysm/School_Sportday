import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
export declare class NotificationsController {
    private readonly service;
    private readonly push;
    constructor(service: NotificationsService, push: PushService);
    publicKey(): {
        key: string;
    };
    pushSubscribe(body: {
        subscription: {
            endpoint: string;
            keys: {
                p256dh: string;
                auth: string;
            };
        };
        userSub?: string | null;
        teamId?: number | null;
    }): Promise<{
        ok: boolean;
        endpoint: string;
    }>;
    pushUnsubscribe(body: {
        endpoint: string;
    }): Promise<{
        ok: boolean;
    }>;
    pushTest(body: {
        title?: string;
        body?: string;
        url?: string;
        tag?: string;
        endpoint: string;
    }): Promise<{
        sent: number;
        failed: number;
    } | {
        sent: number;
        failed: number;
        error: string;
    }>;
    subscribe(body: {
        sub: string;
        teamId: number;
    }): Promise<import("./subscription.entity").TeamSubscription>;
    unsubscribe(teamId: string, sub: string): Promise<void>;
    list(sub: string): Promise<import("./notification.entity").NotificationRecord[]>;
    subs(sub: string): Promise<import("./subscription.entity").TeamSubscription[]>;
}
