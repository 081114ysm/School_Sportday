import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AdminGuard } from '../common/admin.guard';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll(
    @Query('grade') grade?: string,
    @Query('category') category?: string,
  ) {
    return this.teamsService.findAll(
      grade ? parseInt(grade) : undefined,
      category,
    );
  }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamsService.remove(parseInt(id));
  }
}
