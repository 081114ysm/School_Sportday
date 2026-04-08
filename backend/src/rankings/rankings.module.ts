import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../matches/match.entity';
import { RankingsService } from './rankings.service';
import { RankingsController } from './rankings.controller';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match]), TeamsModule],
  controllers: [RankingsController],
  providers: [RankingsService],
})
export class RankingsModule {}
