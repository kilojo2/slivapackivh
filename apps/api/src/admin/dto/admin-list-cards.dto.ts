import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminListCardsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'REMOVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'REMOVED';

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  q?: string;
}