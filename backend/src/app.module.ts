import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsModule } from './teams/teams.module';
import { MatchesModule } from './matches/matches.module';
import { RankingsModule } from './rankings/rankings.module';
import { SeedModule } from './seed/seed.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminController } from './common/admin.controller';

@Module({
  controllers: [AdminController],
  imports: [
    // DATABASE_URL 환경변수가 있으면 Postgres(Railway), 없으면 로컬 SQLite 사용
    TypeOrmModule.forRootAsync({
      useFactory: () =>
        process.env.DATABASE_URL
          ? {
              type: 'postgres' as const,
              url: process.env.DATABASE_URL,
              ssl: { rejectUnauthorized: false },
              autoLoadEntities: true,
              synchronize: true,
            }
          : {
              type: 'better-sqlite3' as const,
              database: 'database.sqlite',
              autoLoadEntities: true,
              synchronize: true,
            },
    }),
    TeamsModule,
    MatchesModule,
    RankingsModule,
    SeedModule,
    NotificationsModule,
  ],
})
export class AppModule {}
