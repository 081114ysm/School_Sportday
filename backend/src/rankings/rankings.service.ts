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
    // 여자연합 AC/BD는 순위표에서 제외되지만, 경기 결과는 구성 팀(A/C, B/D)에 귀속.
    const allTeams = await this.teamsService.findAll();
    const womensAC = allTeams.find((t) => t.name === '여자연합 AC');
    const womensBD = allTeams.find((t) => t.name === '여자연합 BD');
    const A = allTeams.find((t) => t.name === 'A팀');
    const B = allTeams.find((t) => t.name === 'B팀');
    const C = allTeams.find((t) => t.name === 'C팀');
    const D = allTeams.find((t) => t.name === 'D팀');
    const unionMap = new Map<number, number[]>();
    if (womensAC && A && C) unionMap.set(womensAC.id, [A.id, C.id]);
    if (womensBD && B && D) unionMap.set(womensBD.id, [B.id, D.id]);
    const unionIds = new Set(unionMap.keys());
    const effectiveIds = (tid: number): number[] =>
      unionMap.get(tid) ?? [tid];

    const requested = await this.teamsService.findAll(grade, category);
    // 연합팀은 결과 반영 용도로만 사용하므로 출력에서 제외.
    const teams = requested.filter((t) => !unionIds.has(t.id));
    const doneMatches = await this.matchRepo.find({
      where: { status: 'DONE' },
      relations: ['teamA', 'teamB'],
      order: { id: 'DESC' },
    });

    const rankings = teams.map((team) => {
      const teamMatches = doneMatches.filter(
        (m) =>
          effectiveIds(m.teamAId).includes(team.id) ||
          effectiveIds(m.teamBId).includes(team.id),
      );

      let wins = 0,
        draws = 0,
        losses = 0,
        goalsFor = 0,
        goalsAgainst = 0;

      teamMatches.forEach((m) => {
        const isA = effectiveIds(m.teamAId).includes(team.id);
        const myScore = isA ? m.scoreA : m.scoreB;
        const opScore = isA ? m.scoreB : m.scoreA;
        goalsFor += myScore;
        goalsAgainst += opScore;
        if (myScore > opScore) wins++;
        else if (myScore === opScore) draws++;
        else losses++;
      });

      const recentForm = teamMatches.slice(0, 5).map((m) => {
        const isA = effectiveIds(m.teamAId).includes(team.id);
        const myScore = isA ? m.scoreA : m.scoreB;
        const opScore = isA ? m.scoreB : m.scoreA;
        const opponent = isA ? (m.teamB?.name ?? '') : (m.teamA?.name ?? '');
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
