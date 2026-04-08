import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './team.entity';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepo: Repository<Team>,
  ) {}

  findAll(grade?: number, category?: string): Promise<Team[]> {
    const where: any = {};
    if (grade) where.grade = grade;
    if (category) where.category = category;
    return this.teamRepo.find({
      where,
      order: { category: 'ASC', grade: 'ASC', classNumber: 'ASC', name: 'ASC' },
    });
  }

  findOne(id: number): Promise<Team | null> {
    return this.teamRepo.findOneBy({ id });
  }

  create(dto: CreateTeamDto): Promise<Team> {
    const team = this.teamRepo.create(dto);
    return this.teamRepo.save(team);
  }

  async remove(id: number): Promise<void> {
    await this.teamRepo.delete(id);
  }
}
