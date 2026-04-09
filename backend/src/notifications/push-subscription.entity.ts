import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

// 브라우저 Web Push 구독 정보. `endpoint`는 브라우저 설치마다 전역 고유값이므로
// 기본 키로 사용한다. `userSub` / `teamId`는 사용자별·팀별 팬아웃을 위한 선택적 메타데이터.
@Entity()
@Index(['teamId'])
@Index(['userSub'])
export class PushSubscription {
  @PrimaryColumn({ type: 'text' })
  endpoint: string;

  @Column({ type: 'text' })
  p256dh: string;

  @Column({ type: 'text' })
  auth: string;

  @Column({ type: 'varchar', nullable: true })
  userSub: string | null;

  @Column({ type: 'int', nullable: true })
  teamId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
