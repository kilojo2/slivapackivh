import {
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { GetCardsQueryDto } from './dto/get-cards-query.dto';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  getCards(@Query() query: GetCardsQueryDto) {
    return this.cardsService.findPublished(query);
  }

  @Get(':id')
  getCard(@Param('id') id: string) {
    return this.cardsService.view(id);
  }

  @Post(':id/like')
  likeCard(
    @Param('id') id: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.cardsService.like(id, ip, userAgent ?? '');
  }
}
