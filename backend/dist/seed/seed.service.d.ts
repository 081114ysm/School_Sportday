import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Team } from '../teams/team.entity';
import { Match } from '../matches/match.entity';
export declare class SeedService implements OnModuleInit {
    private teamRepo;
    private matchRepo;
    constructor(teamRepo: Repository<Team>, matchRepo: Repository<Match>);
    onModuleInit(): Promise<void>;
}
