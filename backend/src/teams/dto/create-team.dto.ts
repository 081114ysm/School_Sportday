import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  grade: number;

  @IsNumber()
  classNumber: number;
}
