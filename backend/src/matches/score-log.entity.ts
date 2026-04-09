import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ScoreLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  matchId: number;

  @Column()
  team: string;

  @Column()
  delta: number;

  @Column()
  scoreA: number;

  @Column()
  scoreB: number;

  @CreateDateColumn()
  timestamp: Date;
}
