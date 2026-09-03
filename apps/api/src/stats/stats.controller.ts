import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Post('track')
  @HttpCode(200)
  track() {
    return this.statsService.track();
  }

  @Get()
  get() {
    return this.statsService.get();
  }
}