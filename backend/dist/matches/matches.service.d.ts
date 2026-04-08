import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Match } from './match.entity';
import { ScoreLog } from './score-log.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { MatchesGateway } from './matches.gateway';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { PushService } from '../notifications/push.service';
export declare class MatchesService implements OnModuleInit, OnModuleDestroy {
    private matchRepo;
    private logRepo;
    private gateway;
    private notificationsGateway;
    private pushService;
    private readonly logger;
    private autoTimer;
    constructor(matchRepo: Repository<Match>, logRepo: Repository<ScoreLog>, gateway: MatchesGateway, notificationsGateway: NotificationsGateway, pushService: PushService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    autoFinalizePastMatches(): Promise<void>;
    findAll(filters: {
        day?: string;
        status?: string;
        sport?: string;
        matchDate?: string;
    }): Promise<Match[]>;
    findLive(): Promise<Match[]>;
    findOneOrFail(id: number): Promise<Match>;
    create(dto: CreateMatchDto): Promise<Match>;
    update(id: number, data: Partial<Match>): Promise<Match>;
    remove(id: number): Promise<void>;
    updateScore(id: number, team: string, delta: number): Promise<Match>;
    updateStatus(id: number, status: string): Promise<Match>;
    setScore(id: number, scoreA: number, scoreB: number): Promise<Match>;
    setYoutubeUrl(id: number, url: string | null): Promise<Match>;
    updateSetScore(id: number, _setIndex: number, team: 'A' | 'B', delta: number): Promise<Match>;
    undoScore(id: number): Promise<Match>;
}
