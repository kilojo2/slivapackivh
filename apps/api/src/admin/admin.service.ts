import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../media/storage.service';
import { StatsService } from '../stats/stats.service';
import { AdminListCardsDto } from './dto/admin-list-cards.dto';
import { AdminUpdateCardDto } from './dto/admin-update-card.dto';
import { AdminUserDto } from './dto/admin-user.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly statsService: StatsService,
  ) {}

  async listCards(query: AdminListCardsDto) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const q = query.q?.trim();

    const where: Prisma.CardWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { text: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [cards, total] = await Promise.all([
      this.prisma.card.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          title: true,
          text: true,
          age: true,
          city: true,
          source: true,
          status: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
          media: {
            orderBy: { sort: 'asc' },
            select: { id: true, type: true, mediaKey: true },
          },
          _count: { select: { likes: true } },
        },
      }),
      this.prisma.card.count({ where }),
    ]);

    const items = cards.map(({ _count, ...card }) => ({
      ...card,
      likeCount: _count.likes,
    }));

    return { items, total, limit, offset };
  }

  async updateCard(id: string, dto: AdminUpdateCardDto) {
    const card = await this.prisma.card.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('Card not found');

    return this.prisma.card.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.text !== undefined ? { text: dto.text } : {}),
        ...(dto.age !== undefined ? { age: dto.age } : {}),
        ...(dto.city !== undefined ? { city: dto.city || null } : {}),
        ...(dto.source !== undefined ? { source: dto.source || null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async deleteCard(id: string, hard: boolean) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: { media: true },
    });
    if (!card) throw new NotFoundException('Card not found');

    if (hard) {
      for (const m of card.media) {
        await this.storage.delete(m.mediaKey).catch(() => undefined);
      }
      await this.prisma.card.delete({ where: { id } });
      return { deleted: true, hard: true };
    }

    await this.prisma.card.update({ where: { id }, data: { status: 'REMOVED' } });
    return { deleted: true, hard: false };
  }

  listUsers() {
    return this.prisma.allowedUser.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async upsertUser(dto: AdminUserDto) {
    const isActive = dto.isActive ?? true;
    return this.prisma.allowedUser.upsert({
      where: { telegramUserId: dto.telegramUserId },
      create: { telegramUserId: dto.telegramUserId, isActive, role: dto.role ?? 'editor' },
      update: {
        isActive,
        ...(dto.role !== undefined ? { role: dto.role } : {}),
      },
    });
  }

  async removeUser(id: string) {
    const user = await this.prisma.allowedUser.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.allowedUser.delete({ where: { id } });
  }

  stats() {
    return this.statsService.get();
  }

  listRemovalRequests() {
    return this.prisma.removalRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  listMediaHashes() {
    return this.prisma.mediaHash.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}