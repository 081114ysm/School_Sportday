import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class NotificationRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userSub: string;

  @Column()
  title: string;

  @Column()
  body: string;

  @Column({ default: 'INFO' })
  kind: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
