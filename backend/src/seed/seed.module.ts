import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../teams/team.entity';
import { Match } from '../matches/match.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Team, Match])],
  providers: [SeedService],
})
export class SeedModule {}
