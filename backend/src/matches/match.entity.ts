import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Team } from '../teams/team.entity';

@Entity()
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sport: string;

  @Column()
  day: string;

  // ISO date 'YYYY-MM-DD'. Source of truth for "is this match in the past?".
  @Column({ nullable: true, type: 'varchar' })
  matchDate: string | null;

  @Column()
  timeSlot: string;

  @Column()
  teamAId: number;

  @Column()
  teamBId: number;

  @Column({ default: 0 })
  scoreA: number;

  @Column({ default: 0 })
  scoreB: number;

  @Column({ default: 'SCHEDULED' })
  status: string;

  @Column({ nullable: true })
  result: string;

  @Column({ default: 'GRADE' })
  category: string;

  @Column({ nullable: true, type: 'varchar' })
  youtubeUrl: string | null;

  // Optional per-set scoreboard for multi-set sports (volleyball). Stored as
  // JSON: [{a:25,b:20},{a:23,b:25},{a:15,b:11}]. Null for single-score sports.
  @Column({ nullable: true, type: 'text' })
  setsJson: string | null;

  @ManyToOne(() => Team, { eager: true })
  @JoinColumn({ name: 'teamAId' })
  teamA: Team;

  @ManyToOne(() => Team, { eager: true })
  @JoinColumn({ name: 'teamBId' })
  teamB: Team;

  @CreateDateColumn()
  createdAt: Date;
}
