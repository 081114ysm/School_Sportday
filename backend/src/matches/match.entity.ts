import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Team } from '../teams/team.entity';

@Entity()
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sport: string;

  @Column()
  day: string;

  // ISO 날짜 'YYYY-MM-DD'. "이 경기가 과거인가?"를 판단하는 기준값.
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

  // 다중 세트 종목(배구 등)의 세트별 스코어. JSON 형식으로 저장:
  // [{a:25,b:20},{a:23,b:25},{a:15,b:11}]. 단일 점수 종목은 null.
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
