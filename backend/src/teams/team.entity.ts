import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'int' })
  grade: number | null;

  @Column({ nullable: true, type: 'int' })
  classNumber: number | null;

  @Column({ default: 'GRADE' })
  category: string;

  @CreateDateColumn()
  createdAt: Date;
}
