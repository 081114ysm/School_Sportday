import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from './push-subscription.entity';
export interface PushPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
}
export declare class PushService implements OnModuleInit {
    private readonly repo;
    private readonly logger;
    private publicKey;
    private privateKey;
    constructor(repo: Repository<PushSubscription>);
    onModuleInit(): void;
    getPublicKey(): string;
    private loadOrGenerateVapid;
    saveSubscription(sub: webpush.PushSubscription, userSub?: string | null, teamId?: number | null): Promise<PushSubscription>;
    deleteByEndpoint(endpoint: string): Promise<void>;
    listAll(): Promise<PushSubscription[]>;
    sendToAll(payload: PushPayload): Promise<{
        sent: number;
        failed: number;
    }>;
    sendToTeam(teamId: number, payload: PushPayload): Promise<{
        sent: number;
        failed: number;
    }>;
    sendToUser(userSub: string, payload: PushPayload): Promise<{
        sent: number;
        failed: number;
    }>;
    sendToEndpoint(endpoint: string, payload: PushPayload): Promise<{
        sent: number;
        failed: number;
    }>;
    private sendToList;
}
