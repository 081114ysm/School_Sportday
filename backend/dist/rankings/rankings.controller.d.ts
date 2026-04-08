import { RankingsService } from './rankings.service';
export declare class RankingsController {
    private readonly rankingsService;
    constructor(rankingsService: RankingsService);
    getRankings(grade?: string, category?: string): Promise<{
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
