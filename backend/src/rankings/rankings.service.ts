import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../matches/match.entity';
import { TeamsService } from '../teams/teams.service';

@Injectable()
export class RankingsService {
  constructor(
    @InjectRepository(Match)
    private matchRepo: Repository<Match>,
    private teamsService: TeamsService,
  ) {}

  async getRankings(grade?: number, category?: string) {
    const teams = await this.teamsService.findAll(grade, category);
    const doneMatches = await this.matchRepo.find({
      where: { status: 'DONE' },
      relations: ['teamA', 'teamB'],
      order: { id: 'DESC' },
    });

    const rankings = teams.map((team) => {
      const teamMatches = doneMatches.filter(
        (m) => m.teamAId === team.id || m.teamBId === team.id,
      );

      let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

      teamMatches.forEach((m) => {
        const isA = m.teamAId === team.id;
        const myScore = isA ? m.scoreA : m.scoreB;
        const opScore = isA ? m.scoreB : m.scoreA;
        goalsFor += myScore;
        goalsAgainst += opScore;
        if (myScore > opScore) wins++;
        else if (myScore === opScore) draws++;
        else losses++;
      });

      const recentForm = teamMatches.slice(0, 5).map((m) => {
        const isA = m.teamAId === team.id;
        const myScore = isA ? m.scoreA : m.scoreB;
        const opScore = isA ? m.scoreB : m.scoreA;
        const opponent = isA ? m.teamB?.name ?? '' : m.teamA?.name ?? '';
        const score = `${myScore}-${opScore}`;
        let result: 'W' | 'D' | 'L';
        if (myScore > opScore) result = 'W';
        else if (myScore === opScore) result = 'D';
        else result = 'L';
        return { result, opponent, score };
      });

      return {
        team,
        played: teamMatches.length,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDiff: goalsFor - goalsAgainst,
        points: wins * 3 + draws,
        recentForm,
      };
    });

    rankings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.goalDiff - a.goalDiff;
    });

    return rankings;
  }
}
