import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
export declare class TeamsController {
    private readonly teamsService;
    constructor(teamsService: TeamsService);
    findAll(grade?: string, category?: string): Promise<import("./team.entity").Team[]>;
    create(dto: CreateTeamDto): Promise<import("./team.entity").Team>;
    remove(id: string): Promise<void>;
}
