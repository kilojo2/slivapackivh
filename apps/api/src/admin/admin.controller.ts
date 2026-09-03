import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { AdminListCardsDto } from './dto/admin-list-cards.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminUpdateCardDto } from './dto/admin-update-card.dto';
import { AdminUserDto } from './dto/admin-user.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly auth: AdminAuthService,
    private readonly admin: AdminService,
  ) {}

  // Жёсткий rate-limit на вход — защита от перебора пароля.
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: AdminLoginDto) {
    const token = this.auth.login(dto.password);
    return { token };
  }

  @Get('cards')
  @UseGuards(AdminGuard)
  cards(@Query() query: AdminListCardsDto) {
    return this.admin.listCards(query);
  }

  @Patch('cards/:id')
  @UseGuards(AdminGuard)
  updateCard(@Param('id') id: string, @Body() dto: AdminUpdateCardDto) {
    return this.admin.updateCard(id, dto);
  }

  @Delete('cards/:id')
  @UseGuards(AdminGuard)
  deleteCard(@Param('id') id: string, @Query('hard') hard?: string) {
    return this.admin.deleteCard(id, hard === 'true');
  }

  @Get('users')
  @UseGuards(AdminGuard)
  users() {
    return this.admin.listUsers();
  }

  @Post('users')
  @UseGuards(AdminGuard)
  addUser(@Body() dto: AdminUserDto) {
    return this.admin.upsertUser(dto);
  }

  @Delete('users/:id')
  @UseGuards(AdminGuard)
  removeUser(@Param('id') id: string) {
    return this.admin.removeUser(id);
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  stats() {
    return this.admin.stats();
  }

  @Get('removal-requests')
  @UseGuards(AdminGuard)
  removalRequests() {
    return this.admin.listRemovalRequests();
  }

  @Get('media-hashes')
  @UseGuards(AdminGuard)
  mediaHashes() {
    return this.admin.listMediaHashes();
  }
}