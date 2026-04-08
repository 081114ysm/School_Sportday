import { IsIn, IsNumber } from 'class-validator';

export class UpdateScoreDto {
  @IsIn(['A', 'B'])
  team: string;

  @IsNumber()
  delta: number;
}
