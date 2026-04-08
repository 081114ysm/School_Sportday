import { Controller, Get, Query } from '@nestjs/common';
import { RankingsService } from './rankings.service';

@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get()
  getRankings(
    @Query('grade') grade?: string,
    @Query('category') category?: string,
  ) {
    return this.rankingsService.getRankings(
      grade ? parseInt(grade) : undefined,
      category,
    );
  }
}
