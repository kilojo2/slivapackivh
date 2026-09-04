import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class AdminUserDto {
  @IsString()
  telegramUserId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(['admin', 'editor'])
  role?: 'admin' | 'editor';
}