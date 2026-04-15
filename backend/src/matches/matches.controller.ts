import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { AdminGuard } from '../common/admin.guard';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  findAll(
    @Query('day') day?: string,
    @Query('status') status?: string,
    @Query('sport') sport?: string,
    @Query('matchDate') matchDate?: string,
  ) {
    return this.matchesService.findAll({ day, status, sport, matchDate });
  }

  @Get('live')
  findLive() {
    return this.matchesService.findLive();
  }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: CreateMatchDto) {
    return this.matchesService.create(dto);
  }

  @UseGuards(AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.matchesService.update(parseInt(id), data);
  }

  @UseGuards(AdminGuard)
  @Delete('all')
  removeAll() {
    return this.matchesService.removeAll();
  }

  @UseGuards(AdminGuard)
  @Delete('last-week')
  removeLastWeek() {
    return this.matchesService.removeLastWeek();
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.matchesService.remove(parseInt(id));
  }

  @UseGuards(AdminGuard)
  @Put(':id/score')
  updateScore(@Param('id') id: string, @Body() dto: UpdateScoreDto) {
    return this.matchesService.updateScore(parseInt(id), dto.team, dto.delta);
  }

  @UseGuards(AdminGuard)
  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.matchesService.updateStatus(parseInt(id), body.status);
  }

  @UseGuards(AdminGuard)
  @Put(':id/set-score')
  updateSetScore(
    @Param('id') id: string,
    @Body() body: { setIndex: number; team: 'A' | 'B'; delta: number },
  ) {
    return this.matchesService.updateSetScore(
      parseInt(id),
      body.setIndex,
      body.team,
      body.delta,
    );
  }

  @UseGuards(AdminGuard)
  @Put(':id/quarter')
  updateQuarter(
    @Param('id') id: string,
    @Body()
    body: { currentQuarter: number | null; quarterStartedAt: string | null },
  ) {
    return this.matchesService.updateQuarter(
      parseInt(id),
      body.currentQuarter,
      body.quarterStartedAt,
    );
  }

  @UseGuards(AdminGuard)
  @Put(':id/undo')
  undoScore(@Param('id') id: string) {
    return this.matchesService.undoScore(parseInt(id));
  }

  @UseGuards(AdminGuard)
  @Patch(':id/score')
  setScore(
    @Param('id') id: string,
    @Body()
    body: {
      homeScore?: number;
      awayScore?: number;
      scoreA?: number;
      scoreB?: number;
    },
  ) {
    const a = body.homeScore ?? body.scoreA ?? 0;
    const b = body.awayScore ?? body.scoreB ?? 0;
    return this.matchesService.setScore(parseInt(id), a, b);
  }

  @UseGuards(AdminGuard)
  @Put(':id/youtube')
  setYoutube(
    @Param('id') id: string,
    @Body() body: { youtubeUrl: string | null },
  ) {
    return this.matchesService.setYoutubeUrl(
      parseInt(id),
      body.youtubeUrl ?? null,
    );
  }
}
