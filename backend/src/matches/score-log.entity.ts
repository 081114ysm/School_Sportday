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

  // delta만 반대로 적용하면 하한값 보정이나 세트 점수, 경기 상태를
  // 정확히 복원할 수 없으므로 변경 직전 상태를 함께 저장한다.
  @Column({ nullable: true, type: 'int' })
  previousScoreA: number | null;

  @Column({ nullable: true, type: 'int' })
  previousScoreB: number | null;

  @Column({ nullable: true, type: 'text' })
  previousSetsJson: string | null;

  @Column({ nullable: true })
  previousStatus: string | null;

  @Column({ nullable: true })
  previousResult: string | null;

  @CreateDateColumn()
  timestamp: Date;
}
