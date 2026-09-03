import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  private todayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async track() {
    const date = this.todayKey();
    await this.prisma.dailyVisit.upsert({
      where: { date },
      create: { date, count: 1 },
      update: { count: { increment: 1 } },
    });
    return { ok: true };
  }

  async get() {
    const days = await this.prisma.dailyVisit.findMany({
      orderBy: { date: 'desc' },
      take: 30,
      select: { date: true, count: true },
    });
    const total = await this.prisma.dailyVisit.aggregate({
      _sum: { count: true },
    });
    return {
      today: days.find((d) => d.date === this.todayKey())?.count ?? 0,
      total: total._sum.count ?? 0,
      days,
    };
  }
}