import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
export declare class MatchesController {
    private readonly matchesService;
    constructor(matchesService: MatchesService);
    findAll(day?: string, status?: string, sport?: string, matchDate?: string): Promise<import("./match.entity").Match[]>;
    findLive(): Promise<import("./match.entity").Match[]>;
    create(dto: CreateMatchDto): Promise<import("./match.entity").Match>;
    update(id: string, data: any): Promise<import("./match.entity").Match>;
    remove(id: string): Promise<void>;
    updateScore(id: string, dto: UpdateScoreDto): Promise<import("./match.entity").Match>;
    updateStatus(id: string, body: {
        status: string;
    }): Promise<import("./match.entity").Match>;
    updateSetScore(id: string, body: {
        setIndex: number;
        team: 'A' | 'B';
        delta: number;
    }): Promise<import("./match.entity").Match>;
    undoScore(id: string): Promise<import("./match.entity").Match>;
    setScore(id: string, body: {
        homeScore?: number;
        awayScore?: number;
        scoreA?: number;
        scoreB?: number;
    }): Promise<import("./match.entity").Match>;
    setYoutube(id: string, body: {
        youtubeUrl: string | null;
    }): Promise<import("./match.entity").Match>;
}
