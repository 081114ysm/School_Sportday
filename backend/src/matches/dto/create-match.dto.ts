import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateMatchDto {
  @IsString()
  @IsNotEmpty()
  sport: string;

  @IsString()
  @IsNotEmpty()
  day: string;

  @IsString()
  @IsNotEmpty()
  timeSlot: string;

  @IsNumber()
  teamAId: number;

  @IsNumber()
  teamBId: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  matchDate?: string;

  @IsNumber()
  @IsOptional()
  quarterCount?: number;

  @IsNumber()
  @IsOptional()
  quarterMinutes?: number;

  @IsString()
  @IsOptional()
  bracketStage?: string;
}
