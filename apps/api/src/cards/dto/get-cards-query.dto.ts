import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class GetCardsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsIn(['latest', 'popular'])
  sort?: 'latest' | 'popular';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;

  @IsOptional()
  @IsIn(['photo', 'video'])
  type?: 'photo' | 'video';

  @IsOptional()
  @IsIn(['onlyfans', 'tiktok'])
  source?: 'onlyfans' | 'tiktok';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(18)
  @Max(99)
  ageMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(18)
  @Max(99)
  ageMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}