import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
@Index(['userSub', 'teamId'], { unique: true })
export class TeamSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userSub: string;

  @Column()
  teamId: number;

  @CreateDateColumn()
  createdAt: Date;
}
