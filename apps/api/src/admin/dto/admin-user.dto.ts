import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AdminUserDto {
  @IsString()
  telegramUserId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}