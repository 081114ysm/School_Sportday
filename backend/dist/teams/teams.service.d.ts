import { Repository } from 'typeorm';
import { Team } from './team.entity';
import { CreateTeamDto } from './dto/create-team.dto';
export declare class TeamsService {
    private teamRepo;
    constructor(teamRepo: Repository<Team>);
    findAll(grade?: number, category?: string): Promise<Team[]>;
    findOne(id: number): Promise<Team | null>;
    create(dto: CreateTeamDto): Promise<Team>;
    remove(id: number): Promise<void>;
}
