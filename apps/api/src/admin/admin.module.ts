import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { StatsModule } from '../stats/stats.module';
import { AdminAuthService } from './admin-auth.service';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Module({
  imports: [StatsModule, MediaModule],
  controllers: [AdminController],
  providers: [AdminAuthService, AdminGuard, AdminService],
})
export class AdminModule {}