import { Team } from '../teams/team.entity';
export declare class Match {
    id: number;
    sport: string;
    day: string;
    matchDate: string | null;
    timeSlot: string;
    teamAId: number;
    teamBId: number;
    scoreA: number;
    scoreB: number;
    status: string;
    result: string;
    category: string;
    youtubeUrl: string | null;
    setsJson: string | null;
    teamA: Team;
    teamB: Team;
    createdAt: Date;
}
