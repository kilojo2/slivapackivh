import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { hashVisitor } from '../common/visitor';
import { PrismaService } from '../prisma/prisma.service';
import { GetCardsQueryDto } from './dto/get-cards-query.dto';

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    type: 'PHOTO' | 'VIDEO';
    title: string;
    text: string;
    mediaKey: string;
    authorUserId?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'REMOVED';
  }) {
    return this.prisma.card.create({ data });
  }

  async findPublished(query: GetCardsQueryDto) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const [cards, total] = await Promise.all([
      this.prisma.card.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          text: true,
          mediaKey: true,
          viewCount: true,
          createdAt: true,
          _count: { select: { likes: true } },
        },
      }),
      this.prisma.card.count({ where: { status: 'PUBLISHED' } }),
    ]);

    const items = cards.map(({ _count, ...card }) => ({
      ...card,
      likeCount: _count.likes,
    }));

    return { items, total, limit, offset };
  }

  async view(id: string) {
    const card = await this.prisma.card.findFirst({
      where: { id, status: 'PUBLISHED' },
      select: {
        id: true,
        type: true,
        title: true,
        text: true,
        mediaKey: true,
        viewCount: true,
        createdAt: true,
        _count: { select: { likes: true } },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const updated = await this.prisma.card.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    const { _count, ...rest } = card;
    return { ...rest, likeCount: _count.likes, viewCount: updated.viewCount };
  }

  async like(id: string, ip: string, userAgent: string) {
    const card = await this.prisma.card.findUnique({ where: { id } });
    if (!card || card.status !== 'PUBLISHED') {
      throw new NotFoundException('Card not found');
    }

    const visitorHash = hashVisitor(ip, userAgent);

    try {
      await this.prisma.like.create({
        data: { cardId: id, visitorHash },
      });
      return {
        liked: true,
        likeCount: await this.prisma.like.count({ where: { cardId: id } }),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Уже лайкнуто с этого устройства/IP — уникальное ограничение сработало
        return {
          liked: false,
          likeCount: await this.prisma.like.count({ where: { cardId: id } }),
        };
      }
      throw error;
    }
  }
}
