import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, AppRole } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(AppRole.Admin, AppRole.Client)
  async list(@Query() query: PaginationQueryDto) {
    return this.ordersService.listOrders(query.page ?? 1, query.limit ?? 20);
  }

  @Get('active')
  @Roles(AppRole.Admin, AppRole.Client)
  async active() {
    return this.ordersService.listActiveOrders();
  }

  @Get('financial-summary')
  @Roles(AppRole.Admin)
  async financial() {
    return this.ordersService.getFinancialSummary();
  }

  @Get(':id')
  @Roles(AppRole.Admin, AppRole.Client)
  async getOne(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }

  @Post()
  @Roles(AppRole.Admin, AppRole.Client)
  async create(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.sub, dto);
  }

  @Patch(':id/status')
  @Roles(AppRole.Admin)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Get(':id/payments')
  @Roles(AppRole.Admin, AppRole.Client)
  async payments(@Param('id') id: string) {
    return this.ordersService.listPayments(id);
  }
}

