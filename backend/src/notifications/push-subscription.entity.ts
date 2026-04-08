import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

// Browser Web Push subscription. `endpoint` is globally unique per browser
// install, so we use it as the primary key. `userSub` / `teamId` are optional
// targeting metadata so we can fan out per-user or per-team if needed.
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
