import { Repository } from 'typeorm';
import { Match } from '../matches/match.entity';
import { TeamsService } from '../teams/teams.service';
export declare class RankingsService {
    private matchRepo;
    private teamsService;
    constructor(matchRepo: Repository<Match>, teamsService: TeamsService);
    getRankings(grade?: number, category?: string): Promise<{
        team: import("../teams/team.entity").Team;
        played: number;
        wins: number;
        draws: number;
        losses: number;
        goalsFor: number;
        goalsAgainst: number;
        goalDiff: number;
        points: number;
        recentForm: {
            result: "W" | "D" | "L";
            opponent: string;
            score: string;
        }[];
    }[]>;
}
