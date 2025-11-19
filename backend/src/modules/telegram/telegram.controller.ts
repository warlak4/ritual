import { Body, Controller, Get, Post, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TelegramService, CartData } from './telegram.service';
import { SendOrderDto } from './dto/send-order.dto';
import { SyncCartDto } from './dto/sync-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, AppRole } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('telegram')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Telegram')
@ApiBearerAuth()
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('send-order')
  @Roles(AppRole.Client, AppRole.Admin)
  async sendOrder(@CurrentUser() user: any, @Body() dto: SendOrderDto) {
    const result = await this.telegramService.sendOrderNotification(dto.phone, {
      items: dto.items.map((item) => ({
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        price: item.price,
      })),
      total: dto.total,
      currency: dto.currency,
      userName: dto.userName || (user ? `${user.firstName} ${user.lastName}` : undefined),
    });

    if (!result.success) {
      throw new Error(result.message || 'Failed to send order notification');
    }

    return { message: 'Перейдите в бота для оплаты' };
  }

  @Post('sync-cart')
  @Roles(AppRole.Client, AppRole.Admin)
  async syncCart(@CurrentUser() user: any, @Body() dto: SyncCartDto) {
    await this.telegramService.syncUserCart(dto.phone, {
      items: dto.items.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency,
      })),
      total: dto.total,
      currency: dto.currency,
    });
    return { success: true, message: 'Корзина синхронизирована с ботом' };
  }

  @Get('cart')
  @Roles(AppRole.Client, AppRole.Admin)
  async getCart(@Query('phone') phone: string): Promise<CartData> {
    const cart = await this.telegramService.getUserCart(phone);
    return cart || { items: [], total: 0, currency: 'RUB' };
  }
}

